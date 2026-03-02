import { buildQuery } from "@/utils/buildQuery";
import { signOut } from "next-auth/react";

type RequestOptions = {
  headers?: Record<string, string>;
  useAuth?: boolean;
  body?: any;
  method?: string;
  [key: string]: any;
};

const Api = () => {
  const publicBaseURL = process.env.NEXT_PUBLIC_API_URL || "";
  const proxyBaseURL = "/api/proxy";
  let isSigningOut = false;

  const request = async (
    url: string,
    options: RequestOptions = {}
  ): Promise<any> => {
    const {
      useAuth = true,
      body,
      headers: customHeaders,
      ...restOptions
    } = options;

    // Authenticated calls → proxy (token is added server-side)
    // Public calls → direct API URL
    const baseURL = useAuth ? proxyBaseURL : publicBaseURL;

    const headers: Record<string, string> = {
      Accept: "application/json",
      ...customHeaders,
    };

    let finalBody = body;

    if (body) {
      if (typeof FormData !== "undefined" && body instanceof FormData) {
        // FormData used: Allow browser to set Content-Type header with boundary
        // Do not set Content-Type manually
      } else if (typeof body === "object") {
        headers["Content-Type"] = "application/json";
        finalBody = JSON.stringify(body);
      }
    }

    const response = await fetch(`${baseURL}${url}`, {
      ...restOptions,
      headers,
      body: finalBody,
    });

    if (!response.ok) {
      if (response.status === 401) {
        if (!isSigningOut) {
          isSigningOut = true;
          window.dispatchEvent(new Event("token_expired"));
        }
      }
      const errorData = await response.json().catch(() => ({}));
      const error = {
        status: response.status,
        message: errorData.message || response.statusText || "Unknown error",
        details: errorData,
      };
      throw error;
    }

    return response.json();
  };

  return {
    get: (
      url: string,
      params: Record<string, any> = {},
      options: RequestOptions = {}
    ) => {
      const queryString = buildQuery(url, params);
      return request(queryString, { ...options, method: "GET" });
    },
    post: (url: string, body: any, options: RequestOptions = {}) =>
      request(url, { ...options, method: "POST", body }),
    put: (url: string, body: any, options: RequestOptions = {}) =>
      request(url, { ...options, method: "PUT", body }),
    delete: (url: string, options: RequestOptions = {}) =>
      request(url, { ...options, method: "DELETE" }),
  };
};

export default Api();
