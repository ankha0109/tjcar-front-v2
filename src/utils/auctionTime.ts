/**
 * AJES `AUCTION_DATE` is Japan local time (GMT+9) with no timezone suffix, e.g.
 * "2026-07-15 14:30:00". Ulaanbaatar is GMT+8 (no DST). These helpers anchor the
 * raw string to +09:00 so the absolute instant is correct for any viewer, and
 * format for display in Asia/Ulaanbaatar. See the `auction-time-timezone` note.
 */

/** Japan timezone offset the raw AUCTION_DATE strings are expressed in. */
const JAPAN_TZ_OFFSET = "+09:00";

/** Timezone auction times are shown in on the site. */
export const DISPLAY_TIME_ZONE = "Asia/Ulaanbaatar";

/**
 * True when the auction has a real scheduled time. A "00:00:00" time part is a
 * sentinel meaning the slot is not scheduled yet.
 */
export function isAuctionTimeSet(raw: string): boolean {
  if (!raw) return false;
  const timePart = raw.trim().replace(" ", "T").split("T")[1] ?? "";
  return !!timePart && !timePart.startsWith("00:00:00");
}

/**
 * Parse AUCTION_DATE as Japan time (GMT+9) into an absolute Date. Returns null
 * when the string is empty, malformed, or the 00:00:00 "not scheduled" sentinel.
 */
export function parseJapanAuctionDate(raw: string): Date | null {
  if (!isAuctionTimeSet(raw)) return null;
  const iso = raw.trim().replace(" ", "T");
  const d = new Date(`${iso}${JAPAN_TZ_OFFSET}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Format an absolute instant as Ulaanbaatar local time. */
export function formatUlaanbaatarTime(date: Date, locale: string): string {
  return date.toLocaleString(locale, {
    timeZone: DISPLAY_TIME_ZONE,
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
