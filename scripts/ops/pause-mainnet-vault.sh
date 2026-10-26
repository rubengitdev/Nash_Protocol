#!/usr/bin/env bash
# Closes NashVault deposits on Robinhood Chain mainnet (4663). Run by the owner from their own terminal.
# Reads PRIVATE_KEY from .env.mainnet.core.local, refuses any key that is not the project owner.
set -uo pipefail
cd "$(dirname "$0")/../.."

RPC=https://rpc.mainnet.chain.robinhood.com
REC=packages/contracts/deployments/mainnet-4663.json
PK="$(grep -m1 '^PRIVATE_KEY=' .env.mainnet.core.local | cut -d= -f2- | tr -d "\"' ")"

[ "$(cast chain-id --rpc-url "$RPC")" = "4663" ] || { echo "Not chain 4663"; exit 1; }
[ "$(cast wallet address --private-key "$PK" | tr A-Z a-z)" = "$(jq -r .owner "$REC" | tr A-Z a-z)" ] || { echo "Key is not the project owner"; exit 1; }

VAULT="$(jq -r .addresses.vault "$REC")"
if [ "$(cast call "$VAULT" 'depositsPaused()(bool)' --rpc-url "$RPC")" = "true" ]; then
  echo "Vault deposits already paused"
else
  cast send "$VAULT" 'setDepositsPaused(bool)' true --rpc-url "$RPC" --private-key "$PK"
fi
unset PK
echo "depositsPaused=$(cast call "$VAULT" 'depositsPaused()(bool)' --rpc-url "$RPC")"
