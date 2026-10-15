# Nash Protocol: Mainnet deployment plan

Target: **Robinhood Chain mainnet** (chain id `4663`, explorer <https://robinhoodchain.blockscout.com>, public RPC `https://rpc.mainnet.chain.robinhood.com`).
Cost: see [`MAINNET_BUDGET.md`](MAINNET_BUDGET.md) (about $5.24, $6.55 with buffer).

Nothing here has been broadcast. Every mainnet transaction is signed by the project owner from their own terminal.

Status legend: `[ ]` not started · `[~]` in progress · `[x]` done.

## 1. Decisions to confirm before anything else

| Decision | Needed from the owner |
| :--- | :--- |
| Audit status | State it. The contracts have **not** been audited. If you launch without one, the mitigations below are mandatory, not optional |
| Project wallet | **Decided by the owner (2026-10-15): one wallet for everything on mainnet, `0xd09D9c87ECfe008B4D6D3cEbeAd25103c16d9a7C`.** It is the deployer, the contract owner (`PROTOCOL_OWNER_ADDRESS`), the keeper and the signer of every pause or unpause. Fund it per the budget. No other wallet is created for the project |
| Owner of the contracts | The project wallet above. The multisig recommendation is waived by the owner; see the key-custody note under the mitigations |
| Deployer wallet | The project wallet above (`DEPLOYER_ADDRESS`). Confirm on Blockscout that it holds no unrelated roles from an older deployment before reusing it |
| Hosting | Where `web` and `backend` run (the previous setup used Railway services `web` and `backend` in a `mainnet` environment) |
| Database | A new Supabase project for mainnet. Do **not** reuse the Levier mainnet database. Apply migrations only, never `supabase/seed.sql` |
| Domain and social handles | Needed for `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_X_HANDLE` |
| Pons token | Whether Nash launches its own Pons token. The Pons config in `scripts/mainnet-pons-deploy.config.json` still lists the legacy `LEVIER` token (see [`RELAUNCH.md`](RELAUNCH.md)) |

### Mandatory mitigations

1. Owner is the single project wallet (multisig waived, see above). 2. Everything deploys **paused** (markets, routers, vault, AutoProtect). 3. Low launch caps sized so a total loss is survivable. 4. One market first, supervised wallet test, then the rest one at a time. 5. Pause runbook rehearsed on a fork before any unpause. 6. `TRADING_ENABLED`, `LENDING_ENABLED`, `MARGIN_TRADING_ENABLED` stay `false` until enablement.

**Key custody (single-wallet decision).** The contracts are upgradeable proxies, so whoever holds the project wallet's key controls upgrades, pauses, risk parameters and market listing. With one wallet there is no second signer to catch a mistake or a compromise. Keep the key out of every hosted environment: sign deployment, pause and unpause from the owner's own terminal. If the keeper must run unattended on a server, its key is the same key, so decide that before Phase 4 rather than during it.

## 2. Phases

Each phase has an entry gate; do not start one until the previous gate passes.

### Phase 0: Readiness

- [ ] `forge build && forge test` in `packages/contracts` (152 tests at the time of the rebrand)
- [ ] `pnpm install --frozen-lockfile && pnpm lint && pnpm check:lending-abis && pnpm security:check && pnpm build`
- [ ] Mainnet RPC returns chain id `4663`
- [ ] Asset inventory (USDG, each tokenized equity, each price feed id) with bytecode and code hash checked on Blockscout. `scripts/mainnet-full-deploy.config.json` holds the verified addresses for TSLA, AMZN, PLTR, AMD and NVDA; re-verify them
- [ ] `node scripts/estimate-mainnet-budget.mjs` is within band and the deployer is funded

### Phase 1: Fork rehearsal

Run the whole sequence and the pause runbook against `anvil --fork-url $RPC_URL --chain-id 4663`: deposit → borrow → repay → withdraw, a leveraged long and short open/close, a full pause/unpause.

### Phase 2: Full deployment (owner broadcasts)

```bash
bash scripts/ops/init-mainnet-profile.sh   # hidden prompt for the key; refuses any wallet but the project wallet; every broadcast switch stays off
pnpm rh:mainnet:full:plan          # read-only plan and gas estimate
# set MAINNET_FULL_BROADCAST_ENABLED=true in .env.mainnet.core.local
pnpm rh:mainnet:full:deploy        # OWNER runs; journaled and resumable
# set it back to false
pnpm rh:mainnet:full:verify
pnpm rh:mainnet:verify-sources     # Sourcify / Blockscout
```

or `pnpm rh:mainnet:full:interactive`, which prompts and requires typing `DEPLOY MAINNET`. Every market registers **paused**.

### Phase 3: Pons group (optional)

`pnpm rh:mainnet:pons:plan` → `:run` → `:verify`. Decide the token first.

### Phase 4: Database and services

- [ ] New Supabase project; apply `supabase/migrations/*` in order; confirm RLS on every table
- [ ] `web` (`SERVICE=web`) and `backend` (`SERVICE=backend`, runs `scripts/run-all-backend.mjs`: API, indexer, price oracle, keeper) with variables from `apps/web/.env.mainnet.example` and the per-app `.env.example` files. `NETWORK_MODE=MAINNET`, `CHAIN_ID=4663`, `USDG_FAUCET_URL=''`
- [ ] Indexer migrated and synced; the keeper uses the project wallet (see the key-custody note), funded for gas and its key entered as a sealed secret only if you accept running it unattended

### Phase 5: App live, read-only

Domain and TLS attached; every page smoke-tested on chain 4663; no testnet addresses or faucet links visible; prices fresh. Stable for 24 h before Phase 6.

### Phase 6: Enablement (owner broadcasts unpauses)

1. Seed small liquidity into one market and open only that market.
2. Set `LENDING_ENABLED=true`; supervised deposit → borrow → repay → withdraw with small amounts.
3. Unpause margin routers; set `MARGIN_TRADING_ENABLED=true`; supervised long and short.
4. Unpause vault deposits and AutoProtect; confirm the keeper acts.
5. Open the remaining markets one at a time, each with a supervised test.

Mainnet markets launch capped at 1.5× leverage.

### Phase 7: Monitoring

Watch logs, HTTP error rate, publisher heartbeat, keeper actions and oracle freshness. Review caps at 24 h and 72 h; raise only by a transaction from the project wallet.

## 3. Address registry (fill from verified receipts only)

| Contract | Address | Verified |
| :--- | :--- | :--- |
| NashMarketRegistry | | |
| NashRouter | | |
| AutoProtectModule | | |
| ShortRouter | | |
| NashVault | | |
| Oracle (VerifiedFeedOracle / CompositeSanityOracle) | | |
| NashPair per market | | |
| LeverageRouter / MarginRouter | | |
| Protocol owner, deployer and keeper (one wallet) | `0xd09D9c87ECfe008B4D6D3cEbeAd25103c16d9a7C` | n/a |

## 4. Emergency runbook

Trigger on any of: stale or wrong oracle, unexpected liquidation, abnormal outflow, an exploit report, keeper or publisher down longer than the oracle staleness window.

1. **Stop the UI path:** set `TRADING_ENABLED`, `LENDING_ENABLED`, `MARGIN_TRADING_ENABLED` to `false` in the hosted `mainnet` environment and redeploy `web`.
2. **Pause on chain** from the project wallet: all markets (registry), routers, vault deposits, AutoProtect.
3. **Preserve exits:** markets in `REDUCE_ONLY` still allow repay and withdraw. Prefer it over a hard pause when users need to unwind.
4. Collect evidence (transactions, oracle rounds, logs) before changing anything else.
5. Unpause one market at a time after the cause is understood and a supervised test passes.
