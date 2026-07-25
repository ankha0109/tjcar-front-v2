import type { Post } from "@/types/post";

/**
 * `published_at` / `created_at` arrive as `"YYYY-MM-DD HH:mm:ss"` — Safari
 * rejects that in `new Date()`, so the space becomes a `T` first.
 */
export function parsePostDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value.replace(" ", "T"));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** ISO value for a `<time dateTime>` attribute. */
export function postDateTimeAttr(value: string | null | undefined): string | undefined {
  return parsePostDate(value)?.toISOString();
}

/**
 * Human date, e.g. "2026 оны 7-р сарын 25" (mn) / "July 25, 2026" (en).
 * `Intl` renders mn months as "долоодугаар сарын", which nobody writes — mn is
 * spelled out by hand the same way `formatSaleDate` does it.
 */
export function formatPostDate(
  value: string | null | undefined,
  locale: string,
): string | null {
  const date = parsePostDate(value);
  if (!date) return null;

  if (locale === "mn") {
    return `${date.getFullYear()} оны ${date.getMonth() + 1}-р сарын ${date.getDate()}`;
  }
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

/** Strip every tag and collapse whitespace — used to build a fallback excerpt. */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Card summary. `excerpt` is optional on the backend, so fall back to the first
 * `max` characters of the body with the HTML taken out.
 */
export function postExcerpt(
  post: Pick<Post, "excerpt" | "body">,
  max = 140,
): string {
  const excerpt = post.excerpt?.trim();
  if (excerpt) return excerpt;

  const text = stripHtml(post.body ?? "");
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}
