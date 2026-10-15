# Deploying Nash Protocol to Robinhood testnet (chain 46630)

| | |
| :--- | :--- |
| Chain | Robinhood Chain Testnet, id `46630`, settles to Ethereum Sepolia |
| Public RPC | `https://rpc.testnet.chain.robinhood.com` (use a provider key for sustained load) |
| Explorer | <https://explorer.testnet.chain.robinhood.com> |
| Gas | ETH, about 0.01 gwei on testnet at the time of writing |
| USDG faucet | <https://faucet.paxos.com/> |

## Status: deployed 2026-10-15

Stages 1 and 2 were rehearsed on an Anvil fork and then **broadcast to the real testnet** from the deployer `0xFE29…3B10` with the real TSLA and USDG tokens and live Robinhood reference prices. Blocks 135,835,698 to 135,842,726, 63 transactions, **0.00028 ETH** in total fees.

| Contract | Address (proxy) | Implementation |
| :--- | :--- | :--- |
| NashMarketRegistry | [`0xa765…93d4`](https://explorer.testnet.chain.robinhood.com/address/0xa765b0a37d45c87a0a4338cab9dc890507cf93d4) | [`0x6193…d7bd`](https://explorer.testnet.chain.robinhood.com/address/0x6193fa2a2c8c1a2b7b44d672de245aef9c8ed7bd) |
| NashRouter | [`0x4760…20cc`](https://explorer.testnet.chain.robinhood.com/address/0x4760509de76cf084de0b61e55173d0c3192920cc) | [`0x2361…21db`](https://explorer.testnet.chain.robinhood.com/address/0x23611b3fa33e95f49583861062bca9ef2d4b21db) |
| NashVault (`nUSDG`) | [`0xb378…9006`](https://explorer.testnet.chain.robinhood.com/address/0xb37840da67d01ffb4fac77f56201eed9cd7f9006) | [`0x6cb6…0db0`](https://explorer.testnet.chain.robinhood.com/address/0x6cb67a96399b090f9d9345a1b6ba7f2b45190db0) |
| AutoProtectModule | [`0xb2d4…8ea2`](https://explorer.testnet.chain.robinhood.com/address/0xb2d4cb95d3f43d815c448f0a3dd5e270e5208ea2) | [`0xbeae…1001`](https://explorer.testnet.chain.robinhood.com/address/0xbeae7837a7b71075aac39dc649205409e1bd1001) |
| LeverageRouter | [`0x30d3…3019`](https://explorer.testnet.chain.robinhood.com/address/0x30d3ba85a542a48a2e6d7e20ad2ae75bd8ea3019) | [`0x698f…f508`](https://explorer.testnet.chain.robinhood.com/address/0x698f830bfb601f781c45f106ce4656b73273f508) |
| ShortRouter | [`0x745c…6027`](https://explorer.testnet.chain.robinhood.com/address/0x745c7038b51712297ad0f10dae027d0009756027) | [`0xab6e…7d94`](https://explorer.testnet.chain.robinhood.com/address/0xab6e8489840c9a428746e799dc52b83bb4347d94) |
| NashPair TSLA/USDG | [`0x45ca…1a1b`](https://explorer.testnet.chain.robinhood.com/address/0x45ca70e8f78c14773338d9c1a771c3887ede1a1b) | [`0xc14a…8279`](https://explorer.testnet.chain.robinhood.com/address/0xc14acc095ec04217ce61f14838a059d7ab8b8279) |
| RhTestnetReferenceOracle | [`0x2a15…c869`](https://explorer.testnet.chain.robinhood.com/address/0x2a15ad2b007943de27faad46d15d78453f46c869) | not a proxy |
| NashPair TSLA short | [`0xbc41…14b8`](https://explorer.testnet.chain.robinhood.com/address/0xbc414d8ac3cc530d7e1e027f4c46757e426e14b8) | [`0xb642…d750`](https://explorer.testnet.chain.robinhood.com/address/0xb642f88d93569295a783035fd29dbf7b4cd1d750) |
| MarginRouter | [`0xd3a0…6fda`](https://explorer.testnet.chain.robinhood.com/address/0xd3a00803dedef75a28007317ab0cbb075a116fda) | [`0x5bb3…369f`](https://explorer.testnet.chain.robinhood.com/address/0x5bb350d93a02bb0a7a4e3046b34dbd5c1f4d369f) |
| Uniswap V2 pool (TSLA/USDG) | [`0x61eB…2865`](https://explorer.testnet.chain.robinhood.com/address/0x61eB7118E5DE9faDFCbb1663a19Bc444D9a72865) | vendored V2 |

Tokens: USDG `0x7E955252E15c84f5768B83c41a71F9eba181802F`, TSLA `0xC9f9c86933092BbbfFF3CCb4b105A4A94bf3Bd4E`.

Final state, read back from the chain independently of the pipeline: the registry owner is the deployer; the registry holds 2 markets (TSLA long and TSLA short), both **paused**; the vault is "Nash USDG Yield Vault" / `nUSDG` over USDG with deposits paused; the leverage router and Auto-Protect are paused; every proxy points at its own implementation. Application execution flags (`LENDING_ENABLED`, `MARGIN_TRADING_ENABLED`, `TRADING_ENABLED`) are `false`.

| Stage | Result |
| :--- | :--- |
| 1. Core lending (TSLA/USDG) | `FUNDED_LENDING_LIFECYCLE_PASSED` (seed liquidity, deposit, borrow, repay, withdraw), finalize: 8 contracts, 31 transactions verified, allowances zero |
| 2. Margin (long and short) | Pool seeded with 34.86 USDG; a long and a short each opened and closed with zero debt, zero collateral and zero router dust left |
| 3. Pons group | Not deployed (see below) |

The machine-readable record (addresses, implementations, code hashes, every transaction hash) is `packages/contracts/deployments/testnet-46630.json` on the **`testnet` branch**, with the pipeline's evidence reports under `docs/evidence/`. `node scripts/export-deployment-record.mjs` regenerates it from the journal.

The app reads this deployment: `/api/analytics` reports **2 of 2 markets verified** at the current block. Browser-wallet flows have **not** been exercised.

## Source verification (2026-10-15)

All 22 addresses of the deployment have verified source on the [testnet explorer](https://explorer.testnet.chain.robinhood.com): the 9 proxies, their 9 implementations, both oracles, the Uniswap V2 factory and the TSLA/USDG pool.

```bash
pnpm testnet:verify            # read-only check with a step-by-step display, ends with every contract and its explorer link
pnpm testnet:verify:publish    # publishes missing source (forge verify-contract for Nash, standard-JSON for the vendored Uniswap V2); safe to re-run
```

`testnet:verify:publish` compares each address's creation transaction with the bytecode compiled from this checkout and refuses to publish source that does not match what is deployed. The proxies all share one bytecode: Blockscout verifies the first (`NashRouter`'s) directly and shows the others as its twin, with the source readable on each page. The check script labels those "same code as 0x4760..20cc". Use a terminal at least 120 columns wide when recording, so the explorer URLs do not wrap.

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
