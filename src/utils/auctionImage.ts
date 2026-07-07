export type AuctionImageSize = "original" | "thumb" | "card";

const SIZE_PARAM_RE = /[?&](h|w)=\d+/g;

export function withImageSize(url: string, size: AuctionImageSize): string {
  const clean = url.replace(SIZE_PARAM_RE, "").replace(/[?&]+$/, "");
  if (size === "original") return clean;
  const sep = clean.includes("?") ? "&" : "?";
  if (size === "thumb") return `${clean}${sep}h=50`;
  return `${clean}${sep}w=320`;
}
