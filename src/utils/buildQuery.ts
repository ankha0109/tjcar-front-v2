export type QueryParams = Record<
  string,
  string | number | boolean | null | undefined
>;

export function buildQuery(url: string, params: QueryParams) {
  const entries: [string, string][] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    entries.push([key, String(value)]);
  }
  const query = new URLSearchParams(entries).toString();
  return query ? `${url}?${query}` : url;
}
