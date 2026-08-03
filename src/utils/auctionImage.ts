export type AuctionImageSize = "original" | "thumb" | "card";

const SIZE_PARAM_RE = /[?&](h|w)=\d+/g;

const ENCAR_HOST = "ci.encar.com";

/**
 * Target boxes for Encar's CDN, in 16:9 — every source photo is 2200×1238, so
 * no variant re-crops the framing. A bare Encar URL serves 640×360, the
 * smallest thing the CDN has, which is why asking for a box is what unlocks the
 * full-quality photo rather than shrinking it.
 */
const ENCAR_BOXES: Record<AuctionImageSize, readonly [number, number]> = {
  thumb: [160, 90],
  card: [320, 180],
  // Deliberately not the 2200×1238 source (1–2 MB a shot): the gallery loads
  // this variant both for the slide on screen and for lightbox zoom, and 1920
  // already carries 9× the pixels of the bare URL at a fifth of the weight.
  original: [1920, 1080],
};

/**
 * Encar resizes through an `impolicy` query rather than the AJES suffix. The
 * `wtmk` param its own site adds is left off on purpose — that one stamps an
 * extra watermark over the photo.
 */
function withEncarSize(url: string, size: AuctionImageSize): string {
  const [w, h] = ENCAR_BOXES[size];
  const base = url.split("?")[0];
  return `${base}?impolicy=heightRate&rh=${h}&cw=${w}&ch=${h}&cg=Center`;
}

/**
 * Resize a car photo URL to one of the three variants the detail UI uses.
 *
 * AJES CDN: the resizer is keyed to the literal `&w=`/`&h=` suffix even when
 * the URL has no `?` — a standards-correct `?w=320` is ignored and serves the
 * full-size image, so don't "fix" the separator. Hosts that understand neither
 * convention are left untouched by their caller (CarGallery `sizeVariants`).
 */
export function withImageSize(url: string, size: AuctionImageSize): string {
  if (url.includes(ENCAR_HOST)) return withEncarSize(url, size);

  const clean = url.replace(SIZE_PARAM_RE, "").replace(/[?&]+$/, "");
  if (size === "original") return clean;
  if (size === "thumb") return `${clean}&h=50`;
  return `${clean}&w=320`;
}
