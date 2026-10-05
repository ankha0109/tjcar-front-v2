/**
 * Names shared by the two halves of the `/api/v1` proxy gate: `proxy.ts` hands a
 * visitor a signed pass with every page, and the proxy route asks for it back on
 * Japan and Korea reads. Kept free of the signing code (`proxyGateToken.ts`,
 * which needs `node:crypto`) because the browser's `Api` reads two of these.
 */

/** The pass itself: `{expires}.{HMAC(secret, expires + "." + userAgent)}`. */
export const GATE_COOKIE = "tj_v";

export const GATE_TTL_SECONDS = 60 * 60;

/**
 * Answered by `proxy.ts` alone with a 204 and a fresh pass. Any page request
 * mints one too; this is the cheap way for a tab that has sat on one list past
 * the hour to get the next, without rendering a page it will throw away.
 */
export const GATE_REFRESH_PATH = "/gate";

/** Set on a 403 that a fresh pass would cure, so `Api` knows to renew and retry. */
export const GATE_REFUSAL_HEADER = "X-Proxy-Gate";
export const GATE_REFUSAL_STALE_PASS = "cookie";
