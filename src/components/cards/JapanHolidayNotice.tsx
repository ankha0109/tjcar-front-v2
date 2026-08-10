import { useLocale, useTranslations } from "next-intl";
import { holidayRange, holidayResume } from "@/utils/japanHoliday";

/**
 * The Obon break banner on `/japan`. `AuctionBrowser` only renders it while
 * `isJapanHolidayActive()` says so, and that check runs on the server — a
 * client-side clock would both risk a hydration mismatch and take the visitor's
 * word for what day it is.
 */
export default function JapanHolidayNotice() {
  const t = useTranslations("auctions.holidayNotice");
  const locale = useLocale();

  return (
    <div
      role="status"
      className="mb-4 flex gap-3 rounded-xl border border-l-4 border-amber-200 border-l-amber-500 bg-amber-50 px-4 py-3.5 text-amber-900 sm:gap-3.5 sm:px-5 dark:border-amber-900/40 dark:border-l-amber-500 dark:bg-amber-950/30 dark:text-amber-100"
    >
      <CalendarPauseIcon className="mt-px h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />

      <div className="min-w-0">
        <p className="text-sm font-semibold sm:text-[15px]">{t("title")}</p>

        <p className="mt-1 text-[13px] leading-relaxed text-amber-800 sm:text-sm dark:text-amber-200/85">
          {t("body", {
            range: holidayRange(locale),
            resume: holidayResume(locale),
          })}
        </p>

        <p className="mt-2 flex items-start gap-1.5 text-[12.5px] font-medium text-amber-700 dark:text-amber-400">
          <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{t("services")}</span>
        </p>
      </div>
    </div>
  );
}

function CalendarPauseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M3 10h18M8 3v4M16 3v4" />
      <path d="M10 14v3.5M14 14v3.5" />
    </svg>
  );
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
