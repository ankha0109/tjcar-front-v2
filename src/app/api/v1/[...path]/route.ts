import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { SESSION_TOKEN_COOKIE } from "@/lib/authCookies";
import {
  GATE_COOKIE,
  GATE_REFUSAL_HEADER,
  GATE_REFUSAL_STALE_PASS,
} from "@/lib/proxyGate";
import { gateSecret, isValidGateToken } from "@/lib/proxyGateToken";

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;

/**
 * Every call the browser bundle makes through `Api` — and so the only things
 * this proxy forwards. It used to pass any path and any method straight to the
 * backend, session token attached: a public door onto the whole API, lot detail
 * and admin routes included, neither of which a page ever fetches from here
 * (they are read server-side, through `ServerApi`).
 *
 * `*` stands for exactly one path segment. A new client call needs a line here
 * or it answers 404 — in development too, so it cannot go unnoticed.
 */
const CLIENT_ROUTES: ReadonlyArray<readonly [method: string, pattern: string]> = [
  ["GET", "japan"],
  ["GET", "korea"],
  ["GET", "korea/models"],
  ["GET", "korea/*/inspection"],
  ["GET", "korea/*/insurance"],
  ["POST", "ai/evaluation/intro"],
  ["POST", "ai/evaluation/chat"],
  ["POST", "auth/register"],
  ["POST", "auth/forgot-password"],
  ["POST", "auth/reset-password"],
  ["GET", "balance"],
  ["POST", "balance-requests"],
  ["GET", "bids"],
  ["POST", "bids"],
  ["GET", "bids/*"],
  ["PATCH", "bids/*"],
  ["GET", "orders"],
  ["GET", "orders/*"],
  ["POST", "payments/qpay/*/check"],
  ["POST", "plates/search"],
  ["POST", "premium-images"],
  ["GET", "premium-images/*"],
  ["GET", "reports"],
  ["POST", "reports"],
  ["POST", "reports/search"],
  ["GET", "reports/*"],
  ["GET", "stats"],
  ["POST", "v1/vehicle-cost/calculate"],
  ["GET", "vin/*"],
  ["GET", "wishlists"],
  ["POST", "wishlists"],
  ["POST", "wishlists/sync"],
  ["DELETE", "wishlists/*/*"],
];

const CLIENT_ROUTE_SEGMENTS = CLIENT_ROUTES.map(
  ([method, pattern]) => [method, pattern.split("/")] as const,
);

function isClientRoute(method: string, path: string[]): boolean {
  return CLIENT_ROUTE_SEGMENTS.some(
    ([allowedMethod, segments]) =>
      allowedMethod === method &&
      segments.length === path.length &&
      segments.every((segment, i) => segment === "*" || segment === path[i]),
  );
}

/**
 * The two catalogues whose reads spend an upstream quota (AJES, Encar), and so
 * the two a scraper is after.
 */
const GATED_SECTIONS = new Set(["japan", "korea"]);

function forbidden(headers?: Record<string, string>): NextResponse {
  return NextResponse.json(
    { message: "Хуудсаа дахин ачаалаад оролдоно уу." },
    { status: 403, headers },
  );
}

/**
 * No page of ours lives under `/auction` — every real one carries a locale
 * prefix — so a request naming one as its referer was not sent by this site.
 * It is the calling card of the scraper that emptied the AJES budget on
 * 2026-10-05.
 */
function hasForgedReferer(referer: string | null): boolean {
  if (!referer) return false;
  try {
    return new URL(referer).pathname.startsWith("/auction");
  } catch {
    return false;
  }
}

/**
 * Why a Japan or Korea read is turned away, or null to let it through. None of
 * the three checks needs the client to do anything: a browser fetching from our
 * own pages satisfies all of them unprompted.
 */
function gateRefusal(request: NextRequest): NextResponse | null {
  if (hasForgedReferer(request.headers.get("referer"))) {
    return forbidden();
  }

  // Browsers stamp this on every fetch and page script cannot forge it. Anything
  // but `same-origin` came from another site or was typed into the address bar.
  // A MISSING header is not refused here: Safari only started sending it in
  // 16.4, so that would lock every older iPhone out of its own list. Those
  // requests are left to the pass below, which a script without one fails too.
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite !== null && fetchSite !== "same-origin") {
    return forbidden();
  }

  // Until the secret is configured there is no pass to ask for.
  const secret = gateSecret();
  if (secret === null) return null;

  const pass = request.cookies.get(GATE_COOKIE)?.value;
  const userAgent = request.headers.get("user-agent") ?? "";

  if (!isValidGateToken(secret, pass, userAgent)) {
    return forbidden({ [GATE_REFUSAL_HEADER]: GATE_REFUSAL_STALE_PASS });
  }

  return null;
}

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;

  if (!isClientRoute(request.method, path)) {
    return NextResponse.json({ message: "Not Found" }, { status: 404 });
  }

  if (GATED_SECTIONS.has(path[0])) {
    const refusal = gateRefusal(request);
    if (refusal) return refusal;
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
    cookieName: SESSION_TOKEN_COOKIE,
  });

  const url = `${API_URL}/${path.join("/")}${request.nextUrl.search}`;

  const body =
    request.method !== "GET" && request.method !== "HEAD"
      ? await request.text()
      : undefined;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const acceptLanguage = request.headers.get("accept-language");
  if (acceptLanguage) {
    headers["Accept-Language"] = acceptLanguage;
  }

  // Forwarded so the API can tell a crawler from a reader. Every request reaches
  // it through this proxy, so without this it only ever sees Node's own agent and
  // its bot/browser accounting of the AJES daily quota is meaningless.
  const userAgent = request.headers.get("user-agent");
  if (userAgent) {
    headers["User-Agent"] = userAgent;
  }
  if (token?.accessToken) {
    headers.Authorization = `Bearer ${token.accessToken}`;
  }

  const response = await fetch(url, {
    method: request.method,
    headers,
    body,
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
