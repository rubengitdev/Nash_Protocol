import { env } from "../env.mjs";

// Canonical origin for robots.txt and sitemap.xml: the configured site URL, else the network's public host.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (env.NETWORK_MODE === "MAINNET" ? "https://www.nashprotocol.live" : "https://testnet.nashprotocol.live")
).replace(/\/$/, "");
