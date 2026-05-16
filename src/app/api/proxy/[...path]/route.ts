import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { SESSION_TOKEN_COOKIE } from "@/lib/authCookies";

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
    cookieName: SESSION_TOKEN_COOKIE,
  });

  const { path } = await params;
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
