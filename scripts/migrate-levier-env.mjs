#!/usr/bin/env node
// Converts an env file written for the Levier codebase into one the Nash codebase accepts.
//   node scripts/migrate-levier-env.mjs <old-env> <new-env>
//
// The rename changed exactly two identifiers that live in env files:
//   - the JSON key  levierVault   ->  nashVault   (inside PROTOCOL_ADDRESSES)
//   - the variable  MAINNET_LEVIER_VAULT_ADDRESS -> MAINNET_NASH_VAULT_ADDRESS
// Addresses, market slugs and every secret are copied byte for byte. Slugs such as
// "levier-tsla-usdg-testnet" are stored on chain by the old deployment and are left untouched.
// The output is written with mode 0600 and refuses to overwrite an existing file.
import fs from "node:fs";

const [src, dest] = process.argv.slice(2);
if (!src || !dest) {
  console.error("Usage: node scripts/migrate-levier-env.mjs <old-env> <new-env>");
  process.exit(1);
}
if (fs.existsSync(dest)) {
  console.error(`Refusing to overwrite ${dest}`);
  process.exit(1);
}

let renamedKeys = 0;
let renamedVars = 0;
const out = fs
  .readFileSync(src, "utf8")
  .split(/\r?\n/)
  .map((line) => {
    let next = line;
    if (next.startsWith("MAINNET_LEVIER_VAULT_ADDRESS=")) {
      next = next.replace("MAINNET_LEVIER_VAULT_ADDRESS=", "MAINNET_NASH_VAULT_ADDRESS=");
      renamedVars++;
    }
    const before = next;
    next = next.replace(/"levierVault"/g, '"nashVault"');
    if (next !== before) renamedKeys++;
    return next;
  })
  .join("\n");

fs.writeFileSync(dest, out, { mode: 0o600 });
console.log(`wrote ${dest}: ${renamedKeys} JSON key rename(s), ${renamedVars} variable rename(s). Nothing else changed.`);
console.log("Reminder: reusing an old deployment's addresses points the app at Levier-era contracts. Deploy Nash contracts for a real relaunch (docs/TESTNET.md).");
