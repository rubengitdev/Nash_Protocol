#!/usr/bin/env bash
# Publishes the Nash token contract address on the mainnet website, then redeploys it.
#   set-token-ca.sh 0xYourTokenAddress
# Sets NEXT_PUBLIC_TOKEN_CA in the nash-protocol-mainnet Vercel project (Production) and redeploys the latest
# production build, which makes the CA chip in the header, footer and mobile menu and the hero badge go live.
# The variable is inlined at build time, so the redeploy is what publishes it. Testnet is a separate project
# and stays on "Coming soon". To take the address down again: `vercel env rm NEXT_PUBLIC_TOKEN_CA production`
# in that project and redeploy.
set -uo pipefail
cd "$(dirname "$0")/../.."

CA="${1:-}"
PROJECT=nash-protocol-mainnet
SCOPE=rubencahyadi504-9120s-projects
SITE=https://www.nashprotocol.live

[[ "$CA" =~ ^0x[0-9a-fA-F]{40}$ ]] || { echo "Usage: $0 0x<40 hex characters>"; exit 1; }

printf '%s' "$CA" | vercel env add NEXT_PUBLIC_TOKEN_CA production --force --no-sensitive --project "$PROJECT" --scope "$SCOPE" >/dev/null \
  || { echo "FAILED to set NEXT_PUBLIC_TOKEN_CA"; exit 1; }
echo "set NEXT_PUBLIC_TOKEN_CA=$CA"

URL="$(vercel ls "$PROJECT" --scope "$SCOPE" 2>&1 | grep -m1 -E 'Ready +Production' | grep -oE 'https://[^ ]+')"
[ -n "$URL" ] || { echo "No ready production deployment found"; exit 1; }
echo "Redeploying $URL"
vercel redeploy "$URL" --scope "$SCOPE" || exit 1

echo
echo "Wait for the build (about 1 to 10 minutes), then check it is live:"
echo "  curl -s $SITE | grep -c ${CA:2:8}"
