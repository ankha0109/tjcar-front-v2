/**
 * Post image variant. Unlike the auction CDN (which resizes off a `&w=` suffix
 * on the URL), S3 stores three physical files per upload and the variant lives
 * in the file name: `<uuid>.jpg`, `<uuid>_w320.jpg`, `<uuid>_h50.jpg`.
 */
export type PostImageSize = "original" | "card" | "thumb";

const SUFFIX: Record<Exclude<PostImageSize, "original">, string> = {
  card: "_w320.jpg",
  thumb: "_h50.jpg",
};

/** Swap a post image URL for one of its stored variants. `null` stays `null`. */
export function postImage(
  url: string | null,
  size: PostImageSize = "original",
): string | null {
  if (!url) return null;
  if (size === "original") return url;
  return url.replace(/\.[^./]+$/, SUFFIX[size]);
}
