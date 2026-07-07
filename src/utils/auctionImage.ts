export type AuctionImageSize = "original" | "thumb" | "card";

const SIZE_PARAM_RE = /[?&](h|w)=\d+/g;

/**
 * AJES-CDN only. The CDN's resizer is keyed to the literal `&w=`/`&h=` suffix
 * even when the URL has no `?` — a standards-correct `?w=320` is ignored and
 * serves the full-size image, so don't "fix" the separator. Hosts without this
 * convention (Encar) must skip sizing entirely (CarGallery `sizeVariants`).
 */
export function withImageSize(url: string, size: AuctionImageSize): string {
  const clean = url.replace(SIZE_PARAM_RE, "").replace(/[?&]+$/, "");
  if (size === "original") return clean;
  if (size === "thumb") return `${clean}&h=50`;
  return `${clean}&w=320`;
}
