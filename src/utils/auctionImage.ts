export type AuctionImageSize = "original" | "thumb" | "card";

const SIZE_PARAM_RE = /[?&](h|w)=\d+/g;

export function withImageSize(url: string, size: AuctionImageSize): string {
  const clean = url.replace(SIZE_PARAM_RE, "").replace(/[?&]+$/, "");
  if (size === "original") return clean;
  if (size === "thumb") return `${clean}&h=50`;
  return `${clean}&w=320`;
}
