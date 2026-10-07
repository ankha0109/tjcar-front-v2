import { getLocale, getTranslations } from "next-intl/server";
import {
  localizeKoreaOptionCategory,
  localizeKoreaOptionName,
} from "@/lib/koreaOptionNames";
import type { KoreaOptionGroup } from "@/types/korea";
import { cn } from "@/utils";

type Props = {
  options?: KoreaOptionGroup[];
};

/**
 * Grouped standard-option checklist for the Korea detail page, shown full
 * width under the gallery and the info column.
 *
 * One card, and nothing inside it is a card: each Encar category is a group —
 * icon, localized label, item count, then its check-marked list — so a 30+
 * option car stays scannable without boxes nested in a box.
 *
 * How the groups sit follows the panel's own width (container queries), not
 * the viewport's — it runs from ~320px on a phone to ~1190px on a desktop:
 *
 * - narrow: bands under hairlines, one column of names;
 * - wider: the same bands with two, then three, columns of names;
 * - widest: the categories stand side by side, a column each, and the
 *   hairlines go — the panel is a third of the height it is as bands.
 *
 * Names arrive as canonical English and localize via the shared dictionary.
 */
export default async function KoreaOptionsPanel({ options }: Props) {
  if (!options || options.length === 0) return null;

  const t = await getTranslations("carDetail.encar");
  const locale = await getLocale();

  const total = options.reduce((n, group) => n + group.items.length, 0);
  // Side by side only suits three or four categories — Encar's usual set. One
  // or two would each stretch over half the page, and five would be too narrow
  // for the names; those stay bands and take a fourth column of names instead.
  const sideBySide = options.length === 3 || options.length === 4;

  return (
    <section className="@container rounded-2xl border border-neutral-200 p-5 dark:border-neutral-800">
      <h2 className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-100">
        {t("options.title")}
        <span className="ml-2 font-medium text-neutral-500 dark:text-neutral-400">
          {total}
        </span>
      </h2>

      <div
        className={cn(
          "mt-1 divide-y divide-neutral-100 dark:divide-neutral-800",
          sideBySide &&
            "@6xl:mt-4 @6xl:grid @6xl:auto-cols-fr @6xl:grid-flow-col @6xl:gap-x-8 @6xl:divide-y-0",
        )}
      >
        {options.map((group) => (
          <div
            key={group.category}
            className={cn("py-4 last:pb-0", sideBySide && "@6xl:py-0")}
          >
            <h3 className="flex items-center gap-2 text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
              <span className="text-neutral-400 dark:text-neutral-500">
                <CategoryIcon category={group.category} />
              </span>
              {localizeKoreaOptionCategory(group.category, locale)}
              <span className="font-medium text-neutral-500 dark:text-neutral-400">
                {group.items.length}
              </span>
            </h3>

            {/* Each item carries its own bottom gap, and the list takes the
                last one back, so a column break never opens on a margin. The
                check and its gap are as wide as the heading icon and its gap,
                which lines the names up under the category label. */}
            <ul
              className={cn(
                "-mb-2 mt-3 columns-1 gap-x-8 @md:columns-2 @3xl:columns-3",
                sideBySide ? "@6xl:columns-1" : "@6xl:columns-4",
              )}
            >
              {group.items.map((item) => (
                <li
                  key={item}
                  className="flex break-inside-avoid items-start gap-2.5 pb-2 text-[13px] leading-snug text-neutral-700 dark:text-neutral-300"
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
    className: "h-4 w-4",
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
