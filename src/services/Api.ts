import { buildQuery, type QueryParams } from "@/utils/buildQuery";

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
  const baseURL = "/api/proxy";

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
