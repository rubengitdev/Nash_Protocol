# Deploying Nash Protocol to Robinhood testnet (chain 46630)

Nash has **not** been deployed under its new name yet. The contract source is renamed and tested; this is the runbook for putting it on testnet. Everything that broadcasts needs a funded key and an explicit decision from the owner, so none of it has been run.

| | |
| :--- | :--- |
| Chain | Robinhood Chain Testnet, id `46630`, settles to Ethereum Sepolia |
| Public RPC | `https://rpc.testnet.chain.robinhood.com` (use a provider key for sustained load) |
| Explorer | <https://explorer.testnet.chain.robinhood.com> |
| Gas | ETH. At the time of writing the testnet gas price is ~0.01 gwei, so a full deploy costs a fraction of a cent of testnet ETH |
| USDG faucet | <https://faucet.paxos.com/> |

## Prerequisites

1. A deployer key funded with testnet ETH. The previous testnet deployer address still held about 0.0196 ETH on 2026-10-15 (read-only check), which is ample.
2. `.env.testnet` created from `.env.testnet.example` and filled in. It is git-ignored and must stay local. At minimum: `RPC_URL`, `PRIVATE_KEY`, `DEPLOYER_ADDRESS`, `USDG_ADDRESS`, Supabase values for the indexer, and the price-feed settings.
3. `forge build` passes in `packages/contracts` and `pnpm check:lending-abis` is green.

## The pipeline

The testnet pipeline is deliberately gated. Each mode refuses to run without an explicit profile path, and broadcasting is blocked by approval flags in the profile (`RH_TESTNET_DEPLOYMENT_APPROVED`, `RH_REFERENCE_ORACLE_APPROVED`, ...). Leave them `false` until you have read the output of the preceding read-only step.

> The order below is taken from the modes in `scripts/rh-live.mjs` and the `package.json` scripts. Read each script's own checks before running it; this document does not replace them.

**1. Read-only readiness (sends nothing, writes nothing to a database)**

```bash
pnpm check:preparation                      # profile, key, RPC and database sanity report
pnpm prepare:rh-suite
pnpm simulate:rh-modules                    # forge simulation, no broadcast
```

**2. Core contracts and the first market** (`node --import tsx scripts/rh-live.mjs <mode> .env.testnet`)

```
--prepare → --check → --deploy-base → --deploy-modules → --deploy-market → --verify
```

Deploys the registry, router, vault, AutoProtect module, the testnet reference oracle and the TSLA/USDG pair (the contracts are proxy-based; see `NashProxies`). Deployment records are written under `packages/contracts/deployments/`; the previous deployment's record was `testnet-46630.json`. Commit the new one.

**3. Margin (long/short) and Pons groups**

```bash
pnpm nash testnet deploy margin             # UniswapV2 pool + short pair + MarginRouter, then funded acceptance
pnpm nash testnet deploy pons               # Pons perp group, reusing the faucet USDG
```

Both scripts prompt before broadcasting. `--yes` still requires typing `deploy`.

**4. Prices, then enable**

```bash
pnpm rh:publisher:serve                     # keeps oracle prices fresh; markets stay paused without it
pnpm nash testnet enable                    # syncs the site's flags and market list (Railway)
NASH_TESTNET_SITE=https://<your-site> pnpm nash testnet preflight
```

The preflight and enable scripts read the deployment identity from `LENDING_DEPLOYMENT_JSON` / `MARGIN_DEPLOYMENT_JSON` in `.env.testnet`; nothing is hard-coded.

**5. Wire the app**

```bash
pnpm generate:lending-abis                  # regenerate typed ABIs with addresses
```

Put the printed `PROTOCOL_ADDRESSES`, `LENDING_DEPLOYMENT_JSON`, `MARGIN_DEPLOYMENT_JSON` and `MARKET_DEPLOYMENTS_JSON` into `apps/web/.env` (and the hosted environment), flip the `*_ENABLED` flags only after acceptance passes, then `pnpm dev:core`.

## Order of operations for the owner

1. Decide the deployer key and confirm it is funded.
2. Run step 1 and read the report.
3. Approve and run step 2, then 3.
4. Commit the deployment record to the `testnet` branch ([`BRANCHING.md`](BRANCHING.md)).

## Notes

- Token symbols for vault shares are `nUSDG` / `nUSD`; the vault name is "Nash USDG Yield Vault".
- The old Levier testnet contracts remain on chain and are unrelated to a Nash deployment. Nothing in this repository points at them.
- The `RhTestnetReferenceOracle` is centralized and testnet-only by design. Mainnet uses `VerifiedFeedOracle` over Chainlink-style feeds.
