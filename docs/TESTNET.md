# Deploying Nash Protocol to Robinhood testnet (chain 46630)

| | |
| :--- | :--- |
| Chain | Robinhood Chain Testnet, id `46630`, settles to Ethereum Sepolia |
| Public RPC | `https://rpc.testnet.chain.robinhood.com` (use a provider key for sustained load) |
| Explorer | <https://explorer.testnet.chain.robinhood.com> |
| Gas | ETH, about 0.01 gwei on testnet at the time of writing |
| USDG faucet | <https://faucet.paxos.com/> |

## Status

The full runbook below was **rehearsed end to end on an Anvil fork of testnet on 2026-10-15** with the real TSLA and USDG tokens and live Robinhood reference prices. Nothing has been broadcast to the real testnet yet.

| Stage | Rehearsal result |
| :--- | :--- |
| 1. Core lending (TSLA/USDG) | Registry, router, vault, Auto-Protect, leverage and short routers as proxies, reference oracle, pair proxy. Funded deposit → borrow → repay → withdraw: `FUNDED_LENDING_LIFECYCLE_PASSED`. Finalize: 8 contracts, 31 transactions verified, allowances zero, market left paused |
| 2. Margin (long and short) | Uniswap V2 pool, short pair proxy, `MarginRouter` proxy, pool seeded, short opened and closed with zero debt, collateral and router dust left over |
| 3. Pons group | Not deployed on testnet (see below) |

## What the rehearsal fixed

The testnet pipeline inherited from Levier deployed the registry, router and pairs from compiled bytecode with **constructor arguments** (the old non-upgradeable design). The contracts are now UUPS proxies (`constructor() { _disableInitializers(); }` plus `initialize(...)`), so that path could not work. Changes, all in `scripts/`:

- `lib/rh-live.mjs`: new `deployProxy` (implementation plus an `ERC1967Proxy` initialized in the same transaction, through the same gated, journaled `submit`), and `verifyRuntime` is now proxy-aware: it checks the proxy runtime, the EIP-1967 implementation slot, and the implementation's code against the compiled artifact. Its return value for a proxy is the implementation's code hash.
- `rh-live.mjs`, `deploy-rh-margin.mjs`, `deploy-rh-expansion.mjs`: registry, router, pairs, the four modules and `MarginRouter` deploy through `deployProxy`. (`deploy-rh-expansion.mjs` is patched the same way but was not rehearsed.)
- `testnet-glue.mjs`: the three manual hand-offs between stages as checked commands.
- Not updated: `pnpm prepare:rh-suite` and `pnpm simulate:rh-modules` estimate module deployment from v1 constructor data. They are optional estimators and are not part of the flow below.

## Prerequisites

1. A funded deployer. The previous testnet deployer held about 0.0196 ETH and 54.9 USDG on 2026-10-15, which is ample: at the real gas price the whole of stages 1 and 2 should cost a small fraction of that.
2. `.env.testnet` (git-ignored, **mode 0600**, untracked). Start from `.env.testnet.example`, add `PRIVATE_KEY`, `DEPLOYER_ADDRESS`, `KEEPER_PRIVATE_KEY` (the price publisher) and `KEEPER_ADDRESS`, `USDG_ADDRESS`, and a `PROTOCOL_ADDRESSES` whose `tokens` map holds the real `TSLA` and `USDG` addresses. Keep `RH_TESTNET_DEPLOYMENT_APPROVED` and `RH_REFERENCE_ORACLE_APPROVED` at `'false'` until you mean to broadcast.
3. `forge build` in `packages/contracts` so `out/` holds the artifacts, and `pnpm install`.
4. Root `.env` and `apps/web/.env` must also exist as TESTNET profiles with mode 0600 (`pnpm localnet:up` generates them). The pipeline updates all three files together and refuses to run if any fails its guards.

A fresh deployment starts with an empty journal (`.secrets/rh-live/`, git-ignored). Never copy a journal from another deployment.

## Rehearse first (free)

```bash
anvil --fork-url https://rpc.testnet.chain.robinhood.com --chain-id 46630 --port 8546 --block-time 1
cast rpc anvil_setBalance <deployer-and-keeper-address> 0x8AC7230489E80000 --rpc-url http://127.0.0.1:8546
```

Point `RPC_URL` and `INDEXER_RPC_URL` in `.env.testnet` at `http://127.0.0.1:8546`. Two fork quirks, neither a pipeline problem: Anvil needs `--block-time` because the pipeline waits for 2 confirmations, and it advertises a 1 gwei priority tip (about 100× the real testnet fee), so raise the cost caps in `RH_LIVE_EXECUTION_JSON` (`maxTransactionGasCostWei`, `maxSignerGasCostWei`) for the rehearsal only. Restore the public RPC and the default policy afterwards.

## Stage 1: core lending (all markets end paused)

```bash
node --import tsx scripts/rh-live.mjs --prepare .env.testnet     # read-only: writes the execution policy and the reference binding
node --import tsx scripts/rh-live.mjs --check .env.testnet       # read-only: live Robinhood quote and Kraken USDG book

# set RH_TESTNET_DEPLOYMENT_APPROVED='true' in .env.testnet
node --import tsx scripts/rh-live.mjs --deploy-base .env.testnet
node scripts/testnet-glue.mjs base-manifest

# set RH_REFERENCE_ORACLE_APPROVED='true'
node --import tsx scripts/rh-live.mjs --deploy-market .env.testnet
node scripts/testnet-glue.mjs modules-config
node --import tsx scripts/rh-live.mjs --deploy-modules .env.testnet

node --import tsx scripts/rh-live.mjs --acceptance .env.testnet           # funded deposit, borrow, repay, withdraw
node --import tsx scripts/rh-live.mjs --close-acceptance .env.testnet
node --import tsx scripts/finalize-rh-deployment.mjs .env.testnet         # writes verified addresses into all three env profiles
node --import tsx scripts/rh-live.mjs --verify .env.testnet
```

`finalize` also writes an evidence report under `docs/evidence/rh-core-deployment/`; commit it on the `testnet` branch.

## Stage 2: margin (long and short)

```bash
node scripts/testnet-glue.mjs margin-plan                      # sizes the pool seed to the deployer's USDG (needs >= ~25 USDG)
node --import tsx scripts/deploy-rh-margin.mjs .env.testnet
node --import tsx scripts/accept-rh-margin.mjs .env.testnet
```

## Stage 3: Pons group (not done)

`pnpm nash testnet deploy pons` runs `DeployPons.s.sol`, which deploys **mock** PMEME/PGOV tokens with owner-set prices. That contradicts the testnet's real-prices-only policy and the group is aimed at graduated Pons tokens on mainnet, so it was left out. Decide whether you want it before running it.

## After deployment

```bash
pnpm generate:lending-abis        # typed ABIs
pnpm rh:publisher:serve           # keeps oracle prices fresh; markets stay paused without it
NASH_TESTNET_SITE=https://<your-site> pnpm nash testnet preflight
pnpm dev:core                     # the app now reads the real addresses from apps/web/.env
```

`LENDING_ENABLED`, `MARGIN_TRADING_ENABLED` and `TRADING_ENABLED` stay `false` until supervised browser-wallet acceptance passes. `pnpm localnet:up --force-env` regenerates the **placeholder** env and discards real addresses; do not run it after a deployment.

## Notes

- Vault shares are `nUSDG`; the vault is "Nash USDG Yield Vault".
- The old Levier testnet contracts remain on chain and are unrelated; nothing here points at them.
- `RhTestnetReferenceOracle` is centralized and testnet-only by design. Mainnet uses `VerifiedFeedOracle` over Chainlink feeds.
- Anvil forks cannot reproduce Arbitrum's L1 data fee, so real costs are somewhat higher than a fork suggests; the budget on mainnet is covered in [`MAINNET_BUDGET.md`](MAINNET_BUDGET.md).
