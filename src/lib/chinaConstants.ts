// Shared by the server service (`services/china.ts`) and the client infinite
// hook (`hooks/useChinaInfinite.ts`), so it lives in a non-server-only module.
export const CHINA_PER_PAGE = 40;

/**
 * The AJES ids `/api/china/{id}` routes (`[A-Za-z0-9]+`). Checked before the id
 * goes into a backend path: Next hands the segment over decoded, so `..%2F`
 * would otherwise walk the server-side fetch — bearer token attached — onto
 * another endpoint.
 */
export const CHINA_ID_RE = /^[A-Za-z0-9]{1,32}$/;
