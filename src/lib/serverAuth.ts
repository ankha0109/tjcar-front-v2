import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getToken } from "next-auth/jwt";
import { SESSION_TOKEN_COOKIE } from "@/lib/authCookies";
import { ServerApiError } from "@/services/errors";

export async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const req = {
    headers: new Headers({ cookie: cookieHeader }),
  };

  const token = await getToken({
    req: req as never,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
    cookieName: SESSION_TOKEN_COOKIE,
  });

  return (token?.accessToken as string | undefined) ?? null;
}

/**
 * Use inside protected server pages: catch ServerApiError 401 and redirect to
 * /auth/login with the current path as callbackUrl. Re-throws other errors.
 *
 * Example:
 *   try {
 *     const data = await ServerApi.get("/my-bids");
 *   } catch (err) {
 *     await redirectIfUnauthorized(err);
 *     throw err;
 *   }
 */
export async function redirectIfUnauthorized(err: unknown): Promise<void> {
  if (err instanceof ServerApiError && err.status === 401) {
    const reqHeaders = await headers();
    const callbackUrl = reqHeaders.get("x-pathname") ?? "/";
    redirect(
      `/api/signout?callbackUrl=${encodeURIComponent(
        `/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`,
      )}`,
    );
  }
}
