import { buildQuery } from "@/utils/buildQuery";

const ServerApi = (accessToken: string) => {
  const baseURL = process.env.NEXT_PUBLIC_API_URL || "";

  const request = async (url: string, options: RequestInit = {}): Promise<any> => {
    const response = await fetch(`${baseURL}${url}`, {
      ...options,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw { status: response.status, message: response.statusText };
    }

    return response.json();
  };

  return {
    get: (url: string, params: Record<string, any> = {}, options: RequestInit = {}) => {
      const queryString = buildQuery(url, params);
      return request(queryString, { ...options, method: "GET" });
    },
    post: (url: string, body: any, options: RequestInit = {}) =>
      request(url, { ...options, method: "POST", body: JSON.stringify(body) }),
    put: (url: string, body: any, options: RequestInit = {}) =>
      request(url, { ...options, method: "PUT", body: JSON.stringify(body) }),
    delete: (url: string, options: RequestInit = {}) =>
      request(url, { ...options, method: "DELETE" }),
  };
};

export default ServerApi;
