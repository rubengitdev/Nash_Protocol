import { env } from "../env.mjs";

// The Chinese Equities area is a simulation: static catalog data and a mock wallet-signature flow with no contracts
// behind it. It stays hidden on mainnet until real Chinese-equity markets are deployed.
export const CHINA_VISIBLE = env.NETWORK_MODE !== "MAINNET";
