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

## 3. Address registry

Deployed 2026-10-16 from the project wallet. The machine-readable record is `packages/contracts/deployments/mainnet-4663.json`; the reused Uniswap V2 factory and pools are in `mainnet-4663-v1.json`. Status: 45 deployment transactions (nonce 887 to 931) and 32 market-opening transactions confirmed; `deploy-rh-mainnet-full.mjs --verify` and `enable-rh-mainnet-markets.mjs --verify` pass. Cost: 0.000492 ETH for the deployment (the dry run predicted 0.00049), 0.001532 ETH for the seed tokens, about 0.00003 ETH for opening the markets.

All markets (TSLA, AMZN, PLTR, AMD; long and short each) are NORMAL at micro size (0.25 USDG into each long pair, 0.001 stock into each short pair; caps are the micro caps). The reused pools already held liquidity, so the pool-seeding step was skipped. LeverageRouter, ShortRouter, AutoProtect and the vault are still paused. Application flags (`TRADING_ENABLED`, `LENDING_ENABLED`, `MARGIN_TRADING_ENABLED`) are `false`.

| Contract | Address (proxy) | Implementation |
| :--- | :--- | :--- |
| NashMarketRegistry | `0x62Ec9001F335A18C4eB8F4560419F2C52508419c` | `0xEeAF61F01905B96E2B018Dd497cc63644D04eCf1` |
| NashRouter (lending) | `0x11d08d677DB43Ab5E551DDA89604421D3f236e27` | `0xDB5813fFB2fd0a62Bfb338F8773174ce75a43A97` |
| AutoProtectModule | `0xfF1b47c5F081eD41221d93a7CFE70deCA0C9d52D` | `0x18079c12DEd8d8444917cc11753a58cD53109a03` |
| ShortRouter | `0xBc00dB2b2a0131C6eC4DEa2dD9CcbAF543f1201E` | `0xf381dFF97E591B987B3668674E5dBBadff7eA2Ce` |
| NashVault | `0xA29A58864C48112d5373C9e18E89Ec568b5Ea58c` | `0xE8464d9266ec2E137528cb95991046EccA5dbf7C` |
| LeverageRouter | `0x8125aa942B5720505CB0DbeFe9E9873AAbD39aEA` | `0x15046C7457f81a198C4973B18293e68407682115` |
| VerifiedFeedOracle | `0x117c0383422aB1D47DBDB612eF3E4FE10c5B7B08` | `0x1374493f701846843d7B40BFA7887ae4B32EB5c8` |
| NashPair (shared implementation) | see the record, one proxy per market and side | `0xb9bbbEE335CE264135c19fFd82e17BCEd1061453` |
| MarginRouter (shared implementation) | see the record, one proxy per market | `0x6a5AD84EeA6271889F01dA5a6D84d6807849943E` |
| Uniswap V2 factory (reused, v1) | `0xF3e3F49BCF467FC2b710ab9997AF53aA0f1cED02` | n/a |
| Protocol owner, deployer and keeper (one wallet) | `0xd09D9c87ECfe008B4D6D3cEbeAd25103c16d9a7C` | n/a |

Source verification: `node scripts/verify-rh-mainnet-sources.mjs` matched **28 of 28** Nash contracts on Sourcify on 2026-10-16 (the first attempt matched only 4 and the second all 28, so Sourcify is intermittent: rerun it if a later check shows gaps). Blockscout shows Sourcify matches on each address page. The Blockscout mainnet API sits behind a bot challenge, so `forge verify-contract` cannot be scripted against it. The deployment record files live on the `mainnet` branch; check it out to run the mainnet scripts.

### Showing the verification on camera

```bash
PS1='$ '                    # once, so the prompt that returns at the end shows no directory
pnpm -s mainnet:verify      # -s hides pnpm's banner, which prints the directory
```

`scripts/check-mainnet-verified.mjs` is read-only. It checks every Nash address on chain and on Sourcify (exact match, and each proxy must point at the listed implementation), checks the reused Uniswap V2 addresses against the vendored Uniswap V2 bytecode, and ends with the explorer link of each contract. It clears the screen and scrollback first, so the command line and prompt that show your working directory are gone, replaces the terminal title, and scrubs the current directory, the home directory and the user name from everything it prints. Add `--no-clear` to keep the screen, `--fast` to skip the pauses, `--plain` for no colours. The Blockscout mainnet API is behind a bot challenge, so the explorer itself cannot be queried from a script; the links open in a browser.

## 4. Emergency runbook

Trigger on any of: stale or wrong oracle, unexpected liquidation, abnormal outflow, an exploit report, keeper or publisher down longer than the oracle staleness window.

1. **Stop the UI path:** set `TRADING_ENABLED`, `LENDING_ENABLED`, `MARGIN_TRADING_ENABLED` to `false` in the hosted `mainnet` environment and redeploy `web`.
2. **Pause on chain** from the project wallet: all markets (registry), routers, vault deposits, AutoProtect.
3. **Preserve exits:** markets in `REDUCE_ONLY` still allow repay and withdraw. Prefer it over a hard pause when users need to unwind.
4. Collect evidence (transactions, oracle rounds, logs) before changing anything else.
5. Unpause one market at a time after the cause is understood and a supervised test passes.
