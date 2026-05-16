import "server-only";
import { buildQuery, type QueryParams } from "@/utils/buildQuery";
import { getAccessToken } from "@/lib/serverAuth";
import { ServerApiError } from "@/services/errors";

export { ServerApiError };

type RequestOptions = Omit<RequestInit, "body" | "headers" | "method"> & {
  headers?: Record<string, string>;
  body?: unknown;
  method?: string;
};

const baseURL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "";

const request = async <T = unknown>(
  url: string,
  options: RequestOptions = {},
): Promise<T> => {
  const { body, headers: customHeaders, ...restOptions } = options;
  const fullUrl = `${baseURL}${url}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...customHeaders,
  };

  const accessToken = await getAccessToken();
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  let finalBody: BodyInit | undefined;
  if (body !== undefined && body !== null) {
    if (typeof body === "object") {
      headers["Content-Type"] = "application/json";
      finalBody = JSON.stringify(body);
    } else {
      finalBody = body as BodyInit;
    }
  }

  let response: Response;
  try {
    response = await fetch(fullUrl, {
      ...restOptions,
      headers,
      body: finalBody,
    });
  } catch (err) {
    throw new ServerApiError({
      status: 0,
      url: fullUrl,
      message: err instanceof Error ? `Network error: ${err.message}` : "Network error",
      details: err,
    });
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ServerApiError({
      status: response.status,
      url: fullUrl,
      message:
        errorData?.message || response.statusText || "Unknown error",
      details: errorData,
    });
  }

  return response.json() as Promise<T>;
};

const ServerApi = {
  get: <T = unknown>(
    url: string,
    params: QueryParams = {},
    options: RequestOptions = {},
  ) => request<T>(buildQuery(url, params), { ...options, method: "GET" }),
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

export default ServerApi;
