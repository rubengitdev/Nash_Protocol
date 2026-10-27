import type { NetworkMode } from "@nash/types";
import { MAINNET_ORIGIN, TESTNET_ORIGIN } from "./site-url";

// Pages mainnet hides (see earn-visible.ts, pons-visible.ts and china-visible.ts): switching there would land on a 404.
const MAINNET_HIDDEN = ["/earn", "/markets/pons", "/markets/china"];

/** The same page on the other network's deployment, or /markets when the other network does not have it. */
export function networkSwitchHref(target: NetworkMode, pathname: string): string {
  const origin = target === "MAINNET" ? MAINNET_ORIGIN : TESTNET_ORIGIN;
  const hidden = target === "MAINNET" && MAINNET_HIDDEN.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  return `${origin}${hidden ? "/markets" : pathname}`;
}
