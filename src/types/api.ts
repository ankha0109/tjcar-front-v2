// Shared shapes for the Laravel API (next-intl backend at NEXT_PUBLIC_API_URL).

/** A single Eloquent API Resource — Laravel wraps it as `{ data: ... }`. */
export type ResourceObject<T> = { data: T };

/**
 * `meta` block on a Laravel length-aware paginator. The API strips every URL
 * the paginator builds (`links`, `meta.links`, `meta.path`) — they carry the
 * backend host the proxy hides — so page by number from these fields.
 */
export type PaginationMeta = {
  current_page: number;
  from: number | null;
  last_page: number;
  per_page: number;
  to: number | null;
  total: number;
};

/** A paginated `ResourceCollection` response: `{ data, meta }`. */
export type Paginated<T> = {
  data: T[];
  meta: PaginationMeta;
};
