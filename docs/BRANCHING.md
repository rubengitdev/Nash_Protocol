# Branching

Three long-lived branches, one per environment.

| Branch | Meaning | Deploys to |
| :--- | :--- | :--- |
| `main` | Integration. Everything lands here first | Preview / localhost |
| `testnet` | Exactly what is deployed on Robinhood testnet (46630): code, testnet config template, deployment records | Testnet environment |
| `mainnet` | Exactly what is deployed on Robinhood mainnet (4663). Protected | Production |

```
feature/*  ──PR──▶  main  ──merge──▶  testnet  ──merge (after acceptance)──▶  mainnet
```

## Rules

- Work on `feature/*`, `fix/*` or `chore/*` branches and open a PR into `main`.
- Promote by merging **forward only**: `main → testnet → mainnet`. Never commit directly to `testnet` or `mainnet` except deployment records and environment templates (see below).
- Deployment records (`packages/contracts/deployments/*.json`) are committed on the branch of the network they describe: `testnet-46630.json` on `testnet`, `mainnet-4663.json` on `mainnet`.
- A merge into `mainnet` requires: green CI, the Phase 0 checklist in [`MAINNET.md`](MAINNET.md), and an owner sign-off.
- Secrets are never committed on any branch. `.env*` is ignored except `*.example`.

## Commands

```bash
git switch main && git pull
git switch testnet && git merge --no-ff main     # promote to testnet
git switch mainnet && git merge --no-ff testnet  # promote to mainnet, after acceptance
```

## Mapping to hosting (recommended)

| Platform | Setting |
| :--- | :--- |
| Vercel | Project root `apps/web`; Production Branch `mainnet`; `testnet` gets a stable preview with testnet env vars; `main` previews |
| Railway | Environment `testnet` deploys from branch `testnet`; environment `mainnet` from branch `mainnet`; services `web` (`SERVICE=web`) and `backend` (`SERVICE=backend`) |

The web build reads public configuration at build time and secrets at runtime (see the `Dockerfile` header), so the same image can serve either network with different variables.
