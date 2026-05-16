// Project-unique cookie names so multiple Next.js apps on localhost don't
// collide on the default `authjs.*` cookie names. Browsers scope cookies by
// domain (not port), so two dev servers on localhost:2500 and localhost:3500
// would otherwise overwrite each other's session, CSRF, and callback cookies.

const useSecureCookies = process.env.NODE_ENV === "production";
const prefix = useSecureCookies ? "__Secure-" : "";

const APP_COOKIE_PREFIX = "tjcar";

export const SESSION_TOKEN_COOKIE = `${prefix}${APP_COOKIE_PREFIX}.session-token`;
export const CALLBACK_URL_COOKIE = `${prefix}${APP_COOKIE_PREFIX}.callback-url`;
export const CSRF_TOKEN_COOKIE = `${useSecureCookies ? "__Host-" : ""}${APP_COOKIE_PREFIX}.csrf-token`;

export const COMMON_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: useSecureCookies,
};
