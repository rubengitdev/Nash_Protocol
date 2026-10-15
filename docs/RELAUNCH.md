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
| Env | `MAINNET_LEVIER_VAULT_ADDRESS`; `PROTOCOL_ADDRESSES` keys `levierRouter`, `levierVault` | `MAINNET_NASH_VAULT_ADDRESS`; `nashRouter`, `nashVault` |
| Hooks | `useLevierMarkets`, `useLevierVault`, `useLevierPortfolio` | `useNash*` |
| CLI | `scripts/levier` (`levier testnet ...`) | `scripts/nash` (`pnpm nash testnet ...`) |
| Visual identity | Acid lime on olive-black; Inter, Tomorrow, Fraunces | Navy, emerald, silver, white; Newsreader, Montserrat, JetBrains Mono, Caveat ([`BRAND.md`](BRAND.md)) |
| Landing page | Stock-card hero | 3D hooded figure in a three-ribbon ring; manifesto, Hex isolation board, the 1955 letter, personas, roadmap |
| Social links | Hard-coded `@LevierTech` | Env-driven (`NEXT_PUBLIC_X_HANDLE`); the link is hidden until set |
| Hosted URLs in scripts | Hard-coded Levier Railway site and Levier contract addresses | `NASH_TESTNET_SITE`, and addresses read from `.env.testnet` |
| Seed data | Fictional markets incl. META, AAPL, GOOGL, SPY; mainnet rows with invented TVL | Local-only fixture limited to the 5 catalog assets, testnet only |
| Docs | Old plan with Levier project ids, URLs and deployer address | Rewritten without any of them |
| Testnet deploy pipeline | Deployed registry, router and pairs with v1 constructor arguments, which the upgradeable contracts reject | Deploys implementation plus an initialized ERC1967 proxy; `verifyRuntime` is proxy-aware; stage hand-offs scripted (`scripts/testnet-glue.mjs`). Rehearsed on a fork ([`TESTNET.md`](TESTNET.md)) |

Also fixed along the way: comparison table named assets (AAPL, SPY) that are not in the catalog; a competitor liquidation-penalty range that could not be sourced was removed; leverage claims follow the network (2.5× testnet, 1.5× mainnet at launch).

## What was deliberately **not** changed

- **The legacy `LEVIER` Pons token.** `packages/contracts/test/PonsPerpMainnetFork.t.sol` and `scripts/mainnet-pons-deploy.config.json` reference a real on-chain token whose symbol is `LEVIER`. Renaming the label would mislabel a real address, so it stays. Decide whether Nash launches its own Pons token, then replace that entry.
- **Old deployments.** No Levier deployment record, deployer address, Supabase project id or Railway URL was copied. The old contracts still exist on chain and are unrelated to Nash.
- **Secrets.** `.env`, `.env.*`, `.secrets/` and raw transaction journals from the old repo were not copied. A scan for key patterns found only placeholder zero keys in `*.example` files.
- **Feature behaviour.** Contract logic, API routes, indexer, keeper and oracle are untouched apart from names.
- **`docs/project-specs.md`.** Kept as the historical baseline of the inherited codebase.

## Reusing a Levier env file

The web validates its environment strictly, so a Levier `.env.testnet` fails on the renamed `levierRouter` and `levierVault` keys. Convert it:

```bash
node scripts/migrate-levier-env.mjs ../levier/.env.testnet .env.testnet
```

Only the keys and variable above are renamed; addresses, slugs and secrets are copied unchanged. Note that doing this points the app at Levier-era contracts. For a real relaunch, deploy Nash contracts ([`TESTNET.md`](TESTNET.md)).

## Decisions

Resolved on 2026-10-15:

- **Language:** English only, like the original site.
- **Footer:** the non-affiliation sentence was removed at the owner's request; the footer now carries only the experimental-software, leverage-risk and not-financial-advice notice.
- **Git:** a private GitHub repository with `main`, `testnet`, `mainnet`.
- **Testnet:** deploy with the existing testnet deployer, staged, with owner confirmation before each broadcast ([`TESTNET.md`](TESTNET.md)).

Still open:

1. **Social handle and domain.** Set `NEXT_PUBLIC_X_HANDLE` and `NEXT_PUBLIC_SITE_URL`. No handle was invented, so no X link renders yet.
2. **Audit statement.** The contracts are unaudited; the site says "experimental software". Decide what you want to claim publicly.
3. **Pons token.** Launch a Nash token on Pons, or drop the legacy `LEVIER` market from the Pons config.
4. **Chinese Equities attribution.** `data/chinese-equities-proofs.json` says "verifiedBy: Nash Chinese Equities Data Audit" after the rename. Confirm you want the audit attributed under the new name.

## Known gaps carried over

- Root `test:*` scripts point at a `tests/` directory that was git-ignored in the Levier repository and is missing here.
- `scripts/deploy-rh-lending.mjs` refuses to broadcast by design; testnet deployment goes through `scripts/rh-live.mjs` and its approval gates.
- `pnpm prepare:rh-suite` and `pnpm simulate:rh-modules` still estimate module deployment from v1 constructor data; they are optional and not part of the rehearsed flow.
- Analytics, Pons markets and wallet writes need a deployment and an indexer; see [`LOCALHOST.md`](LOCALHOST.md).
