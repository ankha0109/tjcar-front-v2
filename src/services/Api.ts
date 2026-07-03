import { signOut } from "next-auth/react";
import { buildQuery, type QueryParams } from "@/utils/buildQuery";

let signingOut = false;

/**
 * A 401 from the proxied backend means our bearer token was rejected (expired /
 * revoked) even though next-auth may still report us as "authenticated" — e.g. a
 * session that outlived its Sanctum token, or a backend that cleared tokens on
 * redeploy. Clear the stale session once so the client re-syncs to a guest
 * state; authed features (e.g. the wishlist) then fall back to their
 * localStorage path instead of silently 401-ing on every write. `redirect:
 * false` keeps the user on the current page as a guest rather than bouncing them
 * to the login screen.
 */
function handleUnauthorized(): void {
  if (signingOut || typeof window === "undefined") return;
  signingOut = true;
  void signOut({ redirect: false }).finally(() => {
    signingOut = false;
  });
}

function readLocaleFromCookie(): string {
  if (typeof document === "undefined") return "mn";
  const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/);
  return match?.[1] ?? "mn";
}

type RequestOptions = Omit<RequestInit, "body" | "headers" | "method"> & {
  headers?: Record<string, string>;
  body?: unknown;
  method?: string;
};

export class ApiError extends Error {
  status: number;
  details: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

const Api = () => {
  const baseURL = "/api/v1";

  const request = async <T = unknown>(
    url: string,
    options: RequestOptions = {},
  ): Promise<T> => {
    const { body, headers: customHeaders, ...restOptions } = options;

    const headers: Record<string, string> = {
      Accept: "application/json",
      "Accept-Language": readLocaleFromCookie(),
      ...customHeaders,
    };

    let finalBody: BodyInit | undefined;

    if (body !== undefined && body !== null) {
      if (typeof FormData !== "undefined" && body instanceof FormData) {
        finalBody = body;
      } else if (typeof body === "object") {
        headers["Content-Type"] = "application/json";
        finalBody = JSON.stringify(body);
      } else {
        finalBody = body as BodyInit;
      }
    }

    const response = await fetch(`${baseURL}${url}`, {
      ...restOptions,
      headers,
      body: finalBody,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) handleUnauthorized();
      throw new ApiError(
        response.status,
        errorData.message || response.statusText || "Unknown error",
        errorData,
      );
    }

    return response.json() as Promise<T>;
  };

  return {
    get: <T = unknown>(
      url: string,
      params: QueryParams = {},
      options: RequestOptions = {},
    ) => {
      const queryString = buildQuery(url, params);
      return request<T>(queryString, { ...options, method: "GET" });
    },
    post: <T = unknown>(
      url: string,
      body: unknown,
      options: RequestOptions = {},
    ) => request<T>(url, { ...options, method: "POST", body }),
    put: <T = unknown>(
      url: string,
      body: unknown,
      options: RequestOptions = {},
    ) => request<T>(url, { ...options, method: "PUT", body }),
    delete: <T = unknown>(url: string, options: RequestOptions = {}) =>
      request<T>(url, { ...options, method: "DELETE" }),
  };
};

export default Api();
