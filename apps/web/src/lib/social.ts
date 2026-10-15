// Single source of truth for the project's social links.
// Handles are configured per deployment (NEXT_PUBLIC_X_HANDLE). When unset the
// link is hidden rather than pointing at an account the team does not own.
export const X_HANDLE = (process.env.NEXT_PUBLIC_X_HANDLE ?? "").replace(/^@/, "").trim();
export const HAS_X = /^[A-Za-z0-9_]{1,15}$/.test(X_HANDLE);
export const X_URL = HAS_X ? `https://x.com/${X_HANDLE}` : "";
export const X_LABEL = "Follow Nash Protocol on X (Twitter)";
export const X_TITLE = HAS_X ? `Follow Nash Protocol on X (@${X_HANDLE})` : X_LABEL;
