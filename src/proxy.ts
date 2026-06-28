import createIntlMiddleware from "next-intl/middleware";
import { getToken } from "next-auth/jwt";
import { NextResponse, userAgent, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { SESSION_TOKEN_COOKIE } from "@/lib/authCookies";
import { DEVICE_COOKIE, type Device } from "@/lib/device";

const intlMiddleware = createIntlMiddleware(routing);

const PROTECTED_SEGMENTS = ["/dashboard"];

function resolveDevice(req: NextRequest): Device {
  const override = req.nextUrl.searchParams.get("view");
  if (override === "mobile" || override === "desktop") return override;
  return userAgent(req).device?.type === "mobile" ? "mobile" : "desktop";
}

function stripLocale(pathname: string): string {
  for (const locale of routing.locales) {
    if (pathname === `/${locale}`) return "/";
    if (pathname.startsWith(`/${locale}/`))
      return pathname.slice(locale.length + 1);
  }
  return pathname;
}

function getLocaleFromPath(pathname: string): string {
  for (const locale of routing.locales) {
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      return locale;
    }
  }
  return routing.defaultLocale;
}

export async function proxy(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  const pathWithoutLocale = stripLocale(pathname);
  const locale = getLocaleFromPath(pathname);

  const isProtected = PROTECTED_SEGMENTS.some(
    (seg) =>
      pathWithoutLocale === seg || pathWithoutLocale.startsWith(`${seg}/`),
  );

  if (isProtected) {
    const token = await getToken({
      req,
      secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === "production",
      cookieName: SESSION_TOKEN_COOKIE,
    });
    if (!token?.accessToken) {
      const currentPath = `${pathname}${searchParams.toString() ? "?" + searchParams.toString() : ""}`;
      return NextResponse.redirect(
        new URL(
          `/${locale}/auth/login?callbackUrl=${encodeURIComponent(currentPath)}`,
          req.url,
        ),
      );
    }
  }

  const intlResponse = intlMiddleware(req);
  intlResponse.headers.set("x-pathname", pathname);

  const device = resolveDevice(req);
  if (req.cookies.get(DEVICE_COOKIE)?.value !== device) {
    intlResponse.cookies.set(DEVICE_COOKIE, device, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return intlResponse;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|webmanifest|manifest|icon|sw|.*\\.svg).*)",
  ],
};
