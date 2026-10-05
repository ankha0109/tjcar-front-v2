import { createHmac, timingSafeEqual } from "node:crypto";
import { GATE_TTL_SECONDS } from "@/lib/proxyGate";

/**
 * Signing for the proxy gate's visitor pass. Server only — `proxy.ts` mints,
 * the `/api/v1` route verifies.
 *
 * The pass is bound to the `User-Agent` it was issued to and to nothing else.
 * Deliberately not the IP: a phone moving between wifi and mobile data changes
 * address mid-session and would be locked out of its own list.
 */

/**
 * Read per call, never at module scope: the secret lives in `.env.production`
 * and is picked up when the server starts, so setting or rotating it needs a
 * restart and not a rebuild. Unset means the gate's cookie check is off.
 */
export function gateSecret(): string | null {
  return process.env.PROXY_GATE_SECRET || null;
}

function sign(secret: string, expires: number, userAgent: string): string {
  return createHmac("sha256", secret)
    .update(`${expires}.${userAgent}`)
    .digest("base64url");
}

export function mintGateToken(
  secret: string,
  userAgent: string,
  now: number = Date.now(),
): string {
  const expires = Math.floor(now / 1000) + GATE_TTL_SECONDS;
  return `${expires}.${sign(secret, expires, userAgent)}`;
}

export function isValidGateToken(
  secret: string,
  token: string | undefined,
  userAgent: string,
  now: number = Date.now(),
): boolean {
  if (!token) return false;

  const dot = token.indexOf(".");
  if (dot < 1) return false;

  const expires = Number(token.slice(0, dot));
  if (!Number.isSafeInteger(expires) || expires * 1000 <= now) return false;

  const given = Buffer.from(token.slice(dot + 1));
  const wanted = Buffer.from(sign(secret, expires, userAgent));

  return given.length === wanted.length && timingSafeEqual(given, wanted);
}
