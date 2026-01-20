import { auth } from "@/auth";
import { NextResponse, NextRequest } from "next/server";

export async function proxy(req: NextRequest) {
  const session = await auth();
  const { pathname, searchParams } = req.nextUrl;

  // Allow access to the login page without authentication
  if (pathname === "/auth/login") {
    return NextResponse.next();
  }

  // Хэрэв заавал нэвтрэх шаардлагатай бол доорх кодыг идэвхжүүлнэ үү
  // if (!session) {
  //   if (pathname === "/") {
  //     // If the root index is accessed, redirect to /login without callbackUrl
  //     return NextResponse.redirect(new URL("/auth/login", req.url));
  //   }

  //   const callbackUrl = encodeURIComponent(
  //     `${pathname}${searchParams ? "?" + searchParams.toString() : ""}`
  //   );
  //   return NextResponse.redirect(
  //     new URL(`/auth/login?callbackUrl=${callbackUrl}`, req.url)
  //   );
  // }

  // If the user is authenticated, allow the request
  return NextResponse.next();
}

// Specify the paths where middleware should apply
export const config = {
  matcher: [
    /*
      Match all paths except for:
      - /auth/login (the login page should be publicly accessible)
      - /_next/* (static files like images, CSS, etc.)
      - /favicon.ico (the favicon)
      - /images/* (static images)
      - /webmanifest (the webmanifest)
      - /manifest (the manifest)
      - /icon (the icon)
      - /sw (the service worker)
      - /api/* (API routes)
      - .svg (svg files)
    */
    "/((?!api|_next/static|_next/image|favicon.ico|images|webmanifest|manifest|icon|sw|\\.svg$).*)",
  ],
};
