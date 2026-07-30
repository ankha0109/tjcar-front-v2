/**
 * Variant of an image we uploaded to our own CDN (`cdn.tjcar.mn` — posts,
 * in-stock cars). Unlike the auction CDN (which resizes off a `&w=` suffix on
 * the URL), S3 stores three physical files per upload and the variant lives in
 * the file name: `<uuid>.jpg`, `<uuid>_w320.jpg`, `<uuid>_h50.jpg` — written by
 * the backend's `ImageUploadService`, always `.jpg` whatever the original ext.
 */
export type CdnImageSize = "original" | "card" | "thumb";

const SUFFIX: Record<Exclude<CdnImageSize, "original">, string> = {
  card: "_w320.jpg",
  thumb: "_h50.jpg",
};

/** Swap a CDN image URL for one of its stored variants. `null` stays `null`. */
export function cdnImage(
  url: string | null,
  size: CdnImageSize = "original",
): string | null {
  if (!url) return null;
  if (size === "original") return url;
  return url.replace(/\.[^./]+$/, SUFFIX[size]);
}
