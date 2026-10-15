# Relaunch notes: Levier → Nash Protocol

The relaunch keeps the product exactly as it was. What changed is the name, the identity, the story, and everything in the code that carried the old name. This file is the ledger.

## What changed

| Area | Before | After |
| :--- | :--- | :--- |
| Brand | Levier Markets | **Nash Protocol** (short: Nash) |
| Workspace packages | `@levier/{web,api,indexer,keeper,price-oracle,contracts,types}` | `@nash/*` |
| Solidity contracts | `LevierPair`, `LevierRouter`, `LevierMarketRegistry`, `LevierVault`, `LevierProxies`, `DeployLevier` | `NashPair`, `NashRouter`, `NashMarketRegistry`, `NashVault`, `NashProxies`, `DeployNash` (files renamed, 152 tests still green) |
| Vault share tokens | `lvUSDG`, `lvUSD` | `nUSDG`, `nUSD` |
| Market and vault slugs | `levier-tsla-usdg-mainnet` ... | `nash-tsla-usdg-mainnet` ... |
| Env | `MAINNET_LEVIER_VAULT_ADDRESS`; JSON key `levierVault` | `MAINNET_NASH_VAULT_ADDRESS`; `nashVault` |
| Hooks | `useLevierMarkets`, `useLevierVault`, `useLevierPortfolio` | `useNash*` |
| CLI | `scripts/levier` (`levier testnet ...`) | `scripts/nash` (`pnpm nash testnet ...`) |
| Visual identity | Acid lime on olive-black; Inter, Tomorrow, Fraunces | Navy, emerald, silver, white; Newsreader, Montserrat, JetBrains Mono, Caveat ([`BRAND.md`](BRAND.md)) |
| Landing page | Stock-card hero | 3D hooded figure in a three-ribbon ring; manifesto, Hex isolation board, the 1955 letter, personas, roadmap |
| Social links | Hard-coded `@LevierTech` | Env-driven (`NEXT_PUBLIC_X_HANDLE`); the link is hidden until set |
| Hosted URLs in scripts | Hard-coded Levier Railway site and Levier contract addresses | `NASH_TESTNET_SITE`, and addresses read from `.env.testnet` |
| Seed data | Fictional markets incl. META, AAPL, GOOGL, SPY; mainnet rows with invented TVL | Local-only fixture limited to the 5 catalog assets, testnet only |
| Docs | Old plan with Levier project ids, URLs and deployer address | Rewritten without any of them |

Also fixed along the way: comparison table named assets (AAPL, SPY) that are not in the catalog; a competitor liquidation-penalty range that could not be sourced was removed; leverage claims follow the network (2.5× testnet, 1.5× mainnet at launch).

## What was deliberately **not** changed

- **The legacy `LEVIER` Pons token.** `packages/contracts/test/PonsPerpMainnetFork.t.sol` and `scripts/mainnet-pons-deploy.config.json` reference a real on-chain token whose symbol is `LEVIER`. Renaming the label would mislabel a real address, so it stays. Decide whether Nash launches its own Pons token, then replace that entry.
- **Old deployments.** No Levier deployment record, deployer address, Supabase project id or Railway URL was copied. The old contracts still exist on chain and are unrelated to Nash.
- **Secrets.** `.env`, `.env.*`, `.secrets/` and raw transaction journals from the old repo were not copied. A scan for key patterns found only placeholder zero keys in `*.example` files.
- **Feature behaviour.** Contract logic, API routes, indexer, keeper and oracle are untouched apart from names.
- **`docs/project-specs.md`.** Kept as the historical baseline of the inherited codebase.

## Reusing a Levier env file

The web validates its environment strictly, so a Levier `.env.testnet` fails on the renamed `levierVault` key. Convert it:

```bash
node scripts/migrate-levier-env.mjs ../levier/.env.testnet .env.testnet
```

Only the key and variable above are renamed; addresses, slugs and secrets are copied unchanged. Note that doing this points the app at Levier-era contracts. For a real relaunch, deploy Nash contracts ([`TESTNET.md`](TESTNET.md)).

## Needs your decision

1. **Social handle and domain.** Set `NEXT_PUBLIC_X_HANDLE` and `NEXT_PUBLIC_SITE_URL`. No handle was invented, so no X link renders yet.
2. **Git remote.** A local repository with `main`, `testnet`, `mainnet` exists; no remote was added and nothing was pushed.
3. **Non-affiliation line.** The footer says Nash is independent and not affiliated with, endorsed by, or sponsored by Robinhood. Confirm that is true before publishing.
4. **Audit statement.** The contracts are unaudited; the site says "experimental software". Decide what you want to claim publicly.
5. **Pons token.** Launch a Nash token on Pons, or drop the legacy `LEVIER` market from the Pons config.
6. **Language.** Site copy is English, like the original. An Indonesian version is a copy task, not a code one.
7. **Testnet deployment.** Needs your deployer key and a go-ahead ([`TESTNET.md`](TESTNET.md)).
8. **Chinese Equities attribution.** `data/chinese-equities-proofs.json` says "verifiedBy: Nash Chinese Equities Data Audit" after the rename. Confirm you want the audit attributed under the new name.

## Known gaps carried over

- Root `test:*` scripts point at a `tests/` directory that was git-ignored in the Levier repository and is missing here.
- `scripts/deploy-rh-lending.mjs` refuses to broadcast by design; testnet deployment goes through `scripts/rh-live.mjs` and its approval gates.
- Analytics, Pons markets and wallet writes need a deployment and an indexer; see [`LOCALHOST.md`](LOCALHOST.md).
