# Running Nash Protocol on localhost

No cloud accounts and no secrets are needed. The stack is Postgres and PostgREST in Docker (a local stand-in for Supabase), the Express API, and the Next.js web app.

## Requirements

- Node `>= 22` (developed on 24) and pnpm `>= 9`
- Docker (the `docker compose` plugin)
- Foundry, only if you work on the contracts

## Start

```bash
pnpm install
pnpm localnet:up      # database, migrations, fixture, generated .env files
pnpm dev:core         # web :3002 and API :3001
```

Open <http://localhost:3002>. `pnpm dev:local` does both steps in one command.

| Port | Service |
| :--- | :--- |
| 3002 | Web (Next.js) |
| 3001 | API (Express) |
| 54321 | `/rest/v1` gateway (what the API treats as "Supabase") |
| 54323 | PostgREST |
| 54322 | Postgres (`postgres://postgres:nash_local_only@127.0.0.1:54322/nash`) |

Everything binds to `127.0.0.1` only. The credentials are throwaway values that exist solely in `docker/localnet/compose.yml` and the generated `.env` files.

## What you will see

| Area | Local behaviour |
| :--- | :--- |
| Landing page, 3D hero, every section | Fully working |
| Markets, Earn | Populated from `supabase/seed.sql`. **The numbers are an illustrative fixture, not real data** |
| Reference prices | Live, read from the public price providers |
| Lending, Trade (long/short), Portfolio, Analytics, Pons | Render with their empty or "not enabled" states. They need Nash contracts deployed on Robinhood testnet and an indexer, which `localnet` does not provide |
| Wallet writes | Disabled: `LENDING_ENABLED`, `MARGIN_TRADING_ENABLED` and `TRADING_ENABLED` are `false` and the web env holds a schema-valid **placeholder** deployment |

To exercise real contracts, deploy to testnet ([`TESTNET.md`](TESTNET.md)), then put the real addresses into `apps/web/.env`.

## Commands

| Command | Effect |
| :--- | :--- |
| `pnpm localnet:up` | Start the stack; applies migrations and the fixture on a fresh database. Idempotent |
| `pnpm localnet:up --reseed` | Reload `supabase/seed.sql` |
| `pnpm localnet:up --force-env` | Rewrite the generated `.env` files |
| `pnpm localnet:down` | Stop containers (data kept) |
| `pnpm localnet:reset` | Stop, delete the database volume, start fresh |
| `pnpm --filter @nash/web build` | Production build check |

## Troubleshooting

- **`Docker is not reachable`**: start Docker (or Podman's Docker socket) and retry.
- **Port already in use**: something else holds 3001, 3002 or 5432x. Stop it, or change the host port in `docker/localnet/compose.yml`.
- **`Invalid ENV fields: ...` when the web starts**: the web validates its environment strictly (zero-fallback). Run `pnpm localnet:up --force-env` to regenerate a valid one.
- **Markets page empty**: confirm the API is up (`curl localhost:3001/health`) and the database has rows (`pnpm localnet:up --reseed`).
- **Hero shows a still logo instead of the 3D scene**: the browser could not create a WebGL context. The page still works; try a browser with hardware acceleration enabled.
- **Slow first page load in dev**: Next compiles routes on demand. `pnpm --filter @nash/web build && pnpm --filter @nash/web start` serves the optimized build.

## Tests

```bash
pnpm --filter @nash/contracts test          # 152 Foundry tests
pnpm --filter @nash/price-oracle test       # 15 oracle tests
pnpm lint                                   # typecheck every workspace
pnpm check:lending-abis                     # generated ABIs match compiled contracts
```

> The root `test:*` scripts (`test:lending-client`, `test:indexer`, ...) point at a `tests/` directory that was git-ignored in the Levier repository and is absent from this checkout. They cannot run until those suites are restored. This is a known gap carried over, not something the rebrand broke.
