// Shared shapes for the Laravel API (next-intl backend at NEXT_PUBLIC_API_URL).

/** A single Eloquent API Resource — Laravel wraps it as `{ data: ... }`. */
export type ResourceObject<T> = { data: T };

/** `links` block on a Laravel length-aware paginator. */
export type PaginationLinks = {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
};

/** One entry of the `meta.links` array (numbered page buttons). */
export type PaginationMetaLink = {
  url: string | null;
  label: string;
  page: number | null;
  active: boolean;
};

/** `meta` block on a Laravel length-aware paginator. */
export type PaginationMeta = {
  current_page: number;
  from: number | null;
  last_page: number;
  links: PaginationMetaLink[];
  path: string;
  per_page: number;
  to: number | null;
  total: number;
};

/** A paginated `ResourceCollection` response: `{ data, links, meta }`. */
export type Paginated<T> = {
  data: T[];
  links: PaginationLinks;
  meta: PaginationMeta;
};
