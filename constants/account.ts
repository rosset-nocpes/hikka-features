/** The extension's account: calls through the background, tokens and logins. */

// Calls and the live connection (utils/convex-client.ts)

/** How soon a failed call may ask about compatibility again. */
export const RECHECK_INTERVAL = 60_000;

/** How long a tab waits for the background to lend a token. */
export const TOKEN_TIMEOUT = 20_000;

/** Failed reconnects in a row after which the token is suspected. */
export const SUSPECT_RETRIES = 2;

/** Waits before signing in again with a fresh token, one per failure. */
export const REAUTH_DELAYS = [1_000, 10_000, 60_000, 300_000];

// The session the background keeps (utils/convex-session.ts)

/** Seconds before its expiry an access token is refreshed. */
export const TOKEN_EXPIRY_MARGIN_S = 30;

/** As long as the backend's login cookie lives. */
export const LOGIN_TTL_MS = 15 * 60_000;

/**
 * A refresh that never answers would hold every token request behind it,
 * so auth requests give up after this long.
 */
export const AUTH_REQUEST_TIMEOUT = 15_000;
