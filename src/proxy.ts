import { getToken } from "next-auth/jwt";
import { NextResponse, NextRequest } from "next/server";
import { SESSION_TOKEN_COOKIE } from "@/lib/authCookies";

export async function proxy(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
    cookieName: SESSION_TOKEN_COOKIE,
  });
  const isAuthed = Boolean(token?.accessToken);

  const { pathname, searchParams } = req.nextUrl;
  const currentPath = `${pathname}${searchParams.toString() ? "?" + searchParams.toString() : ""}`;

  if (pathname.startsWith("/dashboard") && !isAuthed) {
    return NextResponse.redirect(
      new URL(
        `/auth/login?callbackUrl=${encodeURIComponent(currentPath)}`,
        req.url,
      ),
    );
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", currentPath);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|webmanifest|manifest|icon|sw|\\.svg$).*)",
  ],
};
