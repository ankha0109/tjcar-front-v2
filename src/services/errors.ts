export class ServerApiError extends Error {
  status: number;
  url: string;
  details: unknown;
  constructor(opts: {
    status: number;
    url: string;
    message: string;
    details?: unknown;
  }) {
    super(`[${opts.status}] ${opts.message} (${opts.url})`);
    this.name = "ServerApiError";
    this.status = opts.status;
    this.url = opts.url;
    this.details = opts.details;
  }
}
