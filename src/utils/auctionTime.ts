/**
 * AJES `AUCTION_DATE` is Japan local time (GMT+9) with no timezone suffix, e.g.
 * "2026-07-15 14:30:00". Ulaanbaatar is GMT+8 (no DST). These helpers anchor the
 * raw string to +09:00 so the absolute instant is correct for any viewer, and
 * format for display in Asia/Ulaanbaatar. See the `auction-time-timezone` note.
 */

/** Japan timezone offset the raw AUCTION_DATE strings are expressed in. */
const JAPAN_TZ_OFFSET = "+09:00";

/** Timezone the auction house runs on — the raw AUCTION_DATE zone. */
export const AUCTION_TIME_ZONE = "Asia/Tokyo";

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

/** One auction instant rendered for a single timezone. */
export type ZonedAuctionTime = { date: string; time: string };

/**
 * Split an absolute instant into `2026/07/25` + `10:42` as seen in the given
 * zone. Numeric and 24-hour on purpose, identical in every locale: the Japan and
 * Ulaanbaatar times sit side by side and are meant to be compared at a glance.
 */
export function formatZonedAuctionTime(
  date: Date,
  timeZone: string,
): ZonedAuctionTime {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return {
    date: `${part("year")}/${part("month")}/${part("day")}`,
    time: `${part("hour")}:${part("minute")}`,
  };
}

/**
 * Both clocks for one auction: the auction house's own (Japan, GMT+9) and the
 * viewer-facing Ulaanbaatar one (GMT+8, i.e. Japan − 1h). Null when the lot has
 * no scheduled time yet.
 */
export function auctionSchedule(
  raw: string,
): { japan: ZonedAuctionTime; ulaanbaatar: ZonedAuctionTime } | null {
  const date = parseJapanAuctionDate(raw);
  if (!date) return null;
  return {
    japan: formatZonedAuctionTime(date, AUCTION_TIME_ZONE),
    ulaanbaatar: formatZonedAuctionTime(date, DISPLAY_TIME_ZONE),
  };
}
