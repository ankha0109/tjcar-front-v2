import { getLocale, getTranslations } from "next-intl/server";
import {
  localizeKoreaOptionCategory,
  localizeKoreaOptionName,
} from "@/lib/koreaOptionNames";
import type { KoreaOptionGroup } from "@/types/korea";

type Props = {
  options?: KoreaOptionGroup[];
};

/**
 * Grouped standard-option checklist for the Korea detail page, shown beneath
 * the gallery (desktop) / at the end of the info column (mobile). Each Encar
 * category renders as its own card — icon, localized label, item count and a
 * check-marked list — so a 30+ option car stays scannable instead of a chip
 * cloud. Names arrive as canonical English and localize via the shared
 * dictionary.
 */
export default async function KoreaOptionsPanel({ options }: Props) {
  if (!options || options.length === 0) return null;

  const t = await getTranslations("carDetail.encar");
  const locale = await getLocale();

  const total = options.reduce((n, group) => n + group.items.length, 0);

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="flex items-center gap-2">
        <h2 className="text-[14px] font-semibold text-neutral-900 dark:text-neutral-100">
          {t("options.title")}
        </h2>
        <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-neutral-100 px-1.5 text-[11px] font-semibold text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
          {total}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {options.map((group) => (
          <div
            key={group.category}
            className="flex flex-col gap-2.5 rounded-xl border border-neutral-100 bg-neutral-50/60 p-3 dark:border-neutral-800 dark:bg-neutral-900/60"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white text-neutral-500 ring-1 ring-neutral-200/80 dark:bg-neutral-800 dark:text-neutral-400 dark:ring-neutral-700">
                  <CategoryIcon category={group.category} />
                </span>
                <span className="text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  {localizeKoreaOptionCategory(group.category, locale)}
                </span>
              </div>
              <span className="text-[11px] font-medium tabular-nums text-neutral-400 dark:text-neutral-500">
                {group.items.length}
              </span>
            </div>

            <ul className="flex flex-col gap-1.5">
              {group.items.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-[12.5px] leading-snug text-neutral-700 dark:text-neutral-300"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500"
                    aria-hidden
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  {localizeKoreaOptionName(item, locale)}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Stroke icon per canonical (English) Encar option category. */
function CategoryIcon({ category }: { category: string }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className: "h-3.5 w-3.5",
    "aria-hidden": true,
  } as const;

  switch (category) {
    case "Exterior/Interior":
      return (
        <svg {...common}>
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
          <circle cx="7" cy="17" r="2" />
          <path d="M9 17h6" />
          <circle cx="17" cy="17" r="2" />
        </svg>
      );
    case "Safety":
      return (
        <svg {...common}>
          <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
        </svg>
      );
    case "Convenience/Multimedia":
      return (
        <svg {...common}>
          <line x1="21" x2="14" y1="4" y2="4" />
          <line x1="10" x2="3" y1="4" y2="4" />
          <line x1="21" x2="12" y1="12" y2="12" />
          <line x1="8" x2="3" y1="12" y2="12" />
          <line x1="21" x2="16" y1="20" y2="20" />
          <line x1="12" x2="3" y1="20" y2="20" />
          <line x1="14" x2="14" y1="2" y2="6" />
          <line x1="8" x2="8" y1="10" y2="14" />
          <line x1="16" x2="16" y1="18" y2="22" />
        </svg>
      );
    case "Seats":
      return (
        <svg {...common}>
          <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" />
          <path d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H7v-2a2 2 0 0 0-4 0Z" />
          <path d="M5 18v2" />
          <path d="M19 18v2" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M20 6 9 17l-5-5" />
        </svg>
      );
  }
}
