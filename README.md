<p align="center">
  <img src="apps/web/public/brand/nash-mark-512.png" alt="Nash Protocol" width="160" />
</p>

<h1 align="center">NASH PROTOCOL</h1>

<p align="center"><em>Leverage, at equilibrium.</em></p>

> **The credit and leverage layer for tokenized assets on Robinhood Chain.**
> Isolated lending markets, up to 2.5× long, short any listed asset, and positions that protect themselves.

Nash Protocol is a rebrand and relaunch of the Levier codebase. Features are unchanged; the name, identity, narrative and on-chain contract names are new. See [`docs/RELAUNCH.md`](docs/RELAUNCH.md) for exactly what changed and what was deliberately left alone.

Named for John Nash, whose equilibrium says a system is stable when no one can do better by changing strategy alone. The protocol is built the same way: isolated markets so one asset's bad day stays contained, and incentives that make the individually rational move the one that keeps the system healthy.

---

## Status

| Area | State |
| :--- | :--- |
| Smart contracts | Renamed to `Nash*`; **152 Foundry tests passing** (unit, fuzz, invariants, upgradeability) |
| Web app | New identity, landing page with 3D hero, all app pages re-themed; production build passes |
| Localhost | One-command stack (Postgres + PostgREST in Docker, API, web). No cloud credentials needed |
| Robinhood testnet (46630) | **Deployed 2026-10-15**: core lending and margin (long/short), funded acceptance passed, all markets paused, execution flags off. Addresses and runbook: [`docs/TESTNET.md`](docs/TESTNET.md) |
| Robinhood mainnet (4663) | Not deployed. Plan and budget estimator ready: [`docs/MAINNET.md`](docs/MAINNET.md), [`docs/MAINNET_BUDGET.md`](docs/MAINNET_BUDGET.md) |

> The contracts have not been audited. Leverage can lose all of your collateral. Nothing here is financial advice.

---

## Quick start (localhost)

Requirements: Node `>= 22`, pnpm `>= 9`, Docker. Foundry only if you work on the contracts.

```bash
pnpm install
pnpm localnet:up      # Postgres + PostgREST in Docker, migrations, local fixture, .env files
pnpm dev:core         # web on http://localhost:3002, API on http://localhost:3001
```

Open <http://localhost:3002>. Stop with `pnpm localnet:down` (add `--volumes` to wipe the database, or run `pnpm localnet:reset`).

What works locally and what needs a deployment is spelled out in [`docs/LOCALHOST.md`](docs/LOCALHOST.md).

---

## Product

- **Isolated lending markets.** Every pair is quarantined; there is no shared pool for risk to travel through.
- **1-click leverage.** Long up to 2.5× (1.5× on mainnet at launch) or short any listed asset in one transaction.
- **Auto-Protect.** Pick a loan ratio you are comfortable with; a keeper deleverages before a liquidator could.
- **ERC-4626 yield vaults.** Supply stablecoins and earn from borrowers across isolated pairs.
- **RPC privacy shield.** Browser RPC traffic goes through `/api/rpc`; provider credentials never reach DevTools.
- **Pure backend gateway.** The browser never talks to the database; everything goes through `apps/api`.
- **Zero-fallback policy.** Zod-validated environment; missing configuration fails fast instead of silently defaulting.

### Roadmap

| Phase | Goal |
| :---: | :--- |
| I | Launch isolated lending markets for 5–10 major assets |
| II | Integrate major DEXs; add long and short leverage |
| III | Expand to new asset classes and chains; launch a native trading interface |
| IV | Community governance and liquidity staking |
| V | Bring traditional finance onchain with real-world assets |

---

## Architecture

```
User / Web3 Wallet
       │
       ▼
  NashRouter ───────────────┐
       │                     │
       ├── LeverageRouter    │  (atomic Long & Multiply)
       ├── ShortRouter       │  (atomic Short)
       └── AutoProtectModule │  (keeper deleverage)
              │
              ▼
       NashPair  (isolated lending, one per asset pair)
              │
              ▼
   Oracle  (VerifiedFeedOracle on mainnet · RhTestnetReferenceOracle on testnet)
              │
       NashMarketRegistry  (risk tiers A / B / C / Experimental)
              │
       NashVault  (ERC-4626 yield)
```

| Contract | Role |
| :--- | :--- |
| `NashMarketRegistry` | Supported markets and their risk parameters (LLTV, oracle, caps, status, tier) |
| `NashPair` | Isolated lending engine: collateral, stablecoin debt, LTV checks, interest, liquidation |
| `NashRouter` | User entry point: supply / borrow / repay / withdraw in one transaction |
| `LeverageRouter`, `MarginRouter` | Atomic long and multiply positions with slippage and oracle sanity checks |
| `ShortRouter` | Atomic short execution |
| `AutoProtectModule` | User-defined deleverage rules; keepers act only on a proven on-chain breach |
| `NashVault` | ERC-4626 vault routing stablecoin liquidity across isolated pairs |
| `Pons*` | Leverage for graduated Pons tokens (perp manager, LP vault, TWAP oracle) |

Solidity `0.8.24` (Cancun, optimizer 200, `via_ir`), Foundry, OpenZeppelin v5. All core contracts sit behind ERC-1967 UUPS proxies.

## Monorepo

```text
Nash_Protocol/
├── apps/
│   ├── web/          Next.js 14 (App Router) · three.js hero · wagmi/viem
│   ├── api/          Express REST gateway over Supabase
│   ├── indexer/      EVM event indexer
│   ├── keeper/       Auto-Protect worker
│   └── price-oracle/ price publisher (testnet reference oracle)
├── packages/
│   ├── contracts/    Foundry project (src, test, script)
│   └── types/        shared TypeScript types (@nash/types)
├── data/             static JSON: asset catalog, tokens, markets, vaults
├── docker/localnet/  local Postgres + PostgREST
├── scripts/          deploy, verify and local tooling (scripts/localnet, scripts/nash)
├── supabase/         migrations and the local-only fixture
└── docs/             brand, localhost, testnet, mainnet, relaunch notes
```

## Scripts

| Command | What it does |
| :--- | :--- |
| `pnpm localnet:up` / `localnet:down` / `localnet:reset` | Local database stack |
| `pnpm dev:core` | Web + API |
| `pnpm dev:local` | `localnet:up` then `dev:core` |
| `pnpm dev` | Web, API and Pons indexer (needs a real database) |
| `pnpm build` | Build everything except contracts |
| `pnpm lint` | Typecheck all workspaces |
| `pnpm --filter @nash/contracts test` | Foundry tests |
| `pnpm check:lending-abis` | Fail if generated ABIs differ from compiled contracts |
| `pnpm security:check` | Scan for leaked secrets |
| `node scripts/estimate-mainnet-budget.mjs` | Live mainnet deployment cost estimate |
| `pnpm nash help` | Testnet deploy / status helper |

## Environment and security

Copy a template and fill it in; never commit a populated file (`.gitignore` blocks `.env*` except the `*.example` templates).

- [`.env.example`](.env.example), [`.env.testnet.example`](.env.testnet.example), [`.env.mainnet.example`](.env.mainnet.example)
- `pnpm localnet:up` generates local-only `.env` files with throwaway credentials.

Engineering principles inherited from the Levier codebase and kept: English-only code and docs, SOLID/DRY, zero-fallback configuration, no hard-coded market or token data in UI components (it lives in `data/`), dual TESTNET/MAINNET mode with network-scoped tables, and a pure backend API gateway.

## Branches

`main` is development. `testnet` and `mainnet` track what is deployed to each network. See [`docs/BRANCHING.md`](docs/BRANCHING.md).

## Brand

Black, graphite, brushed silver and white, taken from the brand banner; a type system derived from John Nash's own work and habits (journal serif for the argument, geometric sans for the interface, monospace for the machine, a hand for the margin notes). Full guide with sources: [`docs/BRAND.md`](docs/BRAND.md).
