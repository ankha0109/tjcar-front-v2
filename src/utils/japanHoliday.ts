/**
 * Japan's summer (Obon) auction break — every auction house stops for it, so
 * `/japan` carries a notice while the window is open. Korea and the report
 * service are unaffected and keep running.
 *
 * The window is anchored to Asia/Ulaanbaatar rather than Japan on purpose: it is
 * the reader's own calendar that decides whether the notice is still true, and
 * the notice should survive the whole of the last day here.
 *
 * Next time the break moves, change these two constants and nothing else — the
 * dates in the notice are formatted from them, they are NOT written by hand into
 * `messages/*.json`.
 */
const HOLIDAY_START = new Date("2026-08-10T00:00:00+08:00");
/** Exclusive — the auctions are back on this day. */
const HOLIDAY_END = new Date("2026-08-18T00:00:00+08:00");

const TIME_ZONE = "Asia/Ulaanbaatar";
const DAY_MS = 24 * 60 * 60 * 1000;

export function isJapanHolidayActive(now: Date = new Date()): boolean {
  return now >= HOLIDAY_START && now < HOLIDAY_END;
}

/** Calendar day/month as read in `TIME_ZONE`, not in the server's own zone. */
function dayMonth(date: Date): { day: number; month: number } {
  const [, month, day] = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(date)
    .split("-")
    .map(Number);
  return { day, month };
}

/**
 * The month alone, in whatever case the locale uses beside a day number — ru
 * needs the genitive ("августа", not the standalone "август"), which only comes
 * out of a day+month format.
 */
function monthBesideDay(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: TIME_ZONE,
    month: "long",
    day: "numeric",
  })
    .formatToParts(date)
    .filter((part) => part.type === "month")
    .map((part) => part.value)
    .join("");
}

/**
 * "8-р сарын 18" (mn) / "August 18" (en) / "18 августа" (ru). `Intl` renders mn
 * months as "наймдугаар сарын", which nobody writes, so mn is spelled out by
 * hand the same way `formatPostDate` does it.
 */
function holidayDate(date: Date, locale: string): string {
  if (locale === "mn") {
    const { day, month } = dayMonth(date);
    return `${month}-р сарын ${day}`;
  }
  return new Intl.DateTimeFormat(locale, {
    timeZone: TIME_ZONE,
    month: "long",
    day: "numeric",
  }).format(date);
}

/** "8-р сарын 10–17" (mn) / "August 10–17" (en) / "10–17 августа" (ru). */
export function holidayRange(locale: string): string {
  const first = HOLIDAY_START;
  const last = new Date(HOLIDAY_END.getTime() - DAY_MS);
  const from = dayMonth(first);
  const to = dayMonth(last);

  // A break that straddles two months (a New Year one, say) has to be written
  // out in full on both sides.
  if (from.month !== to.month) {
    return `${holidayDate(first, locale)} – ${holidayDate(last, locale)}`;
  }

  if (locale === "mn") return `${from.month}-р сарын ${from.day}–${to.day}`;
  if (locale === "ru") {
    return `${from.day}–${to.day} ${monthBesideDay(first, locale)}`;
  }
  return `${monthBesideDay(first, locale)} ${from.day}–${to.day}`;
}

/** The day the auctions are back: "8-р сарын 18" / "August 18" / "18 августа". */
export function holidayResume(locale: string): string {
  return holidayDate(HOLIDAY_END, locale);
}
