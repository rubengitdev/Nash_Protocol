# Mainnet deployment budget: $5 to $7

**Result: about $5.24 for the deploy itself, $6.55 with a 25% safety buffer.** That sits inside the $5 to $7 target. If the chain's gas price doubled while you deploy, the same plan would cost about $9.30; the estimator below tells you when that is happening.

Generated 2026-10-15 by `node scripts/estimate-mainnet-budget.mjs` against Robinhood Chain mainnet (4663):

| Input | Value | Source |
| :--- | :--- | :--- |
| Gas price | 0.0201 gwei | `eth_gasPrice` on `rpc.mainnet.chain.robinhood.com` |
| ETH / USD | $2,364.14 | Chainlink `ETH / USD` feed `0x78F3…d3A9` on mainnet, read on-chain (a web API gave $2,362 at the same time) |

| Line item | Gas | ETH | USD |
| :--- | ---: | ---: | ---: |
| Core, oracle, isolated markets, margin, vault (41 transactions) | 48.05 M | 0.00151 | $3.56 |
| Pons perp stack and market listing (10 transactions) | 6.70 M | 0.00021 | $0.50 |
| Keeper wallet funding (Auto-Protect transactions) | fixed | 0.00050 | $1.18 |
| **Subtotal** | | **0.00222** | **$5.24** |
| **With 25% buffer: fund the deployer with this** | | **0.00277** | **$6.55** |
| If gas price doubles | | 0.00393 | $9.30 |

## How the estimate is built

- **Gas units** are the measured figures from fork rehearsals of this same contract set (48.05 M gas for the full non-Pons deployment, 6.7 M for the Pons group).
- **L1 calibration ×1.56.** A fork meters only L2 execution. Robinhood Chain is an Arbitrum Orbit chain, so each transaction also pays for posting its data to Ethereum. The factor is derived from the recorded rehearsal estimate: 0.0015 ETH ÷ (48.05 M gas × 0.02 gwei) = 1.56.
- **Cross-check against reality.** The previous project's mainnet deployer balance fell from 0.002743 ETH to 0.000227 ETH, about 0.0025 ETH or $5.9 at today's price. That total includes an abandoned first deployment (v1) that this plan does not repeat, so it is a ceiling, and it agrees with the estimate.
- **Not included:** seed liquidity for the first market (about $4.42 of tokens for a micro-sized market in the last rehearsal), and domain, hosting and database subscriptions.

## Using it

```bash
node scripts/estimate-mainnet-budget.mjs          # table; exit code 2 if over the band
node scripts/estimate-mainnet-budget.mjs --json   # machine-readable
RPC_URL_MAINNET=https://<your-provider> node scripts/estimate-mainnet-budget.mjs
```

Edit `scripts/mainnet-budget.plan.json` to change the band, buffer, calibration or line items. Re-measure gas with `pnpm rh:mainnet:full:plan` (read-only) before you broadcast, then rerun the estimator.

## Funding checklist

- [ ] Deployer wallet holds at least **0.0028 ETH** on chain 4663 (about $6.55 at today's price).
- [ ] Gas price is near 0.02 gwei at the time of broadcast. If it is above 0.04 gwei, wait.
- [ ] The previous mainnet deployer holds only about 0.0002 ETH; it cannot fund this deployment on its own.
- [ ] Gas caps in `.env.mainnet.core.local` (`MAINNET_MAX_TOTAL_GAS_WEI` and friends) are set from this table, not left blank.
