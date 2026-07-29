import type { CarSource } from "@/types/car";
import {
  DISPLAY_TIME_ZONE,
  formatZonedAuctionTime,
  isAuctionTimeSet,
  parseJapanAuctionDate,
} from "@/utils/auctionTime";

/**
 * One auction slot, resolved to the Ulaanbaatar clock the site displays.
 *
 * Everything here is computed through `Intl` with an explicit `timeZone`, so the
 * result is identical on the server and in the browser regardless of either
 * machine's zone — no hydration drift, and no dependency on the viewer sitting
 * in GMT+8. See the `auction-time-timezone` note.
 */
export type AuctionMoment = {
  /** Ulaanbaatar calendar days from today: 0 = today, 1 = tomorrow, < 0 = past. */
  daysAway: number;
  /** Minutes until the lot starts; null when it has no scheduled hour yet. */
  minutesUntil: number | null;
  /**
   * - `live`: starts within {@link LIVE_WINDOW_MINUTES}
   * - `upcoming`: further out, or scheduled for a future day with no hour set
   * - `past`: its start time (or its whole day, when unscheduled) has gone by
   */
  kind: "live" | "upcoming" | "past";
  /** `07/30` — the auction day on the Ulaanbaatar calendar. */
  dateLabel: string;
  /** `09:00` in Ulaanbaatar; null for the AJES "00:00:00" not-scheduled sentinel. */
  timeLabel: string | null;
  /** `2026/07/30 09:00 (GMT+8)` — tooltips and the compare table. */
  fullLabel: string;
};

/** How close a lot has to be before it counts as live. */
export const LIVE_WINDOW_MINUTES = 120;

/** `YYYY/MM/DD` → the same day as a UTC midnight, so two days can be subtracted. */
function calendarDayMs(ymd: string): number {
  const [y, m, d] = ymd.split("/").map(Number);
  return Date.UTC(y, m - 1, d);
}

const MS_PER_DAY = 86_400_000;
const MS_PER_MINUTE = 60_000;

/**
 * Resolve a raw auction date string for display.
 *
 * - `japan`: the raw string is Japan wall time (GMT+9) and gets anchored there
 *   before being re-rendered in Ulaanbaatar (GMT+8, i.e. Japan − 1h).
 * - `korea` / `china`: the feed already sends GMT+8 wall time, so it is anchored
 *   to +08:00 and passes through unchanged.
 *
 * When the time part is the `00:00:00` sentinel the slot has no scheduled hour
 * yet: the date is taken verbatim with **no** zone shift (shifting it would drag
 * the lot back onto the previous day) and `timeLabel` stays null.
 */
export function getAuctionMoment(
  raw: string | undefined,
  source: CarSource,
): AuctionMoment | null {
  if (!raw) return null;

  const now = new Date();
  const today = formatZonedAuctionTime(now, DISPLAY_TIME_ZONE).date;

  let date: string;
  let time: string | null;
  let minutesUntil: number | null;

  if (isAuctionTimeSet(raw)) {
    const instant =
      source === "japan"
        ? parseJapanAuctionDate(raw)
        : parseZoned(raw, "+08:00");
    if (!instant) return null;
    const zoned = formatZonedAuctionTime(instant, DISPLAY_TIME_ZONE);
    date = zoned.date;
    time = zoned.time;
    minutesUntil = Math.round(
      (instant.getTime() - now.getTime()) / MS_PER_MINUTE,
    );
  } else {
    const datePart = raw.trim().replace(" ", "T").split("T")[0] ?? "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return null;
    date = datePart.replace(/-/g, "/");
    time = null;
    minutesUntil = null;
  }

  const daysAway = Math.round(
    (calendarDayMs(date) - calendarDayMs(today)) / MS_PER_DAY,
  );

  // With an hour on the clock, "live" and "past" are decided by that hour. An
  // unscheduled lot only has a day to go on, so it falls back to the calendar
  // and can never read as live.
  const kind =
    minutesUntil === null
      ? daysAway < 0
        ? "past"
        : "upcoming"
      : minutesUntil < 0
        ? "past"
        : minutesUntil <= LIVE_WINDOW_MINUTES
          ? "live"
          : "upcoming";

  return {
    daysAway,
    minutesUntil,
    kind,
    dateLabel: date.slice(5), // "2026/07/30" → "07/30"
    timeLabel: time,
    fullLabel: time ? `${date} ${time} (GMT+8)` : date,
  };
}

/** Parse a `YYYY-MM-DD HH:mm:ss` wall time anchored to a fixed UTC offset. */
function parseZoned(raw: string, offset: string): Date | null {
  const d = new Date(`${raw.trim().replace(" ", "T")}${offset}`);
  return Number.isNaN(d.getTime()) ? null : d;
}
