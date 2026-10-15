import { getTranslations } from "next-intl/server";
import type { ChinaSpecSection } from "@/types/china";

type Props = {
  specs?: ChinaSpecSection[];
  options?: string[];
};

/** How many sections open on their own: the general facts and the basics. */
const OPEN_SECTIONS = 2;

/**
 * The full spec sheet of a China listing — the che168 sheet the upstream
 * carries, machine-translated to English at the source, shown as it arrives.
 * A full sheet runs to ~150 lines, so every section after the first two is a
 * collapsed `<details>`; a row that names no sheet at all renders nothing.
 *
 * "YES" and "OPT" are the sheet's own words for standard and optional fitment,
 * so they read as a check mark and a localized "optional"; every other value
 * is printed untouched.
 */
export default async function ChinaSpecSheet({ specs, options }: Props) {
  const sections = specs ?? [];
  const highlights = options ?? [];
  if (sections.length === 0 && highlights.length === 0) return null;

  const t = await getTranslations("carDetail");

  return (
    <section className="@container rounded-2xl border border-neutral-200 p-5 dark:border-neutral-800">
      <h2 className="flex flex-wrap items-baseline gap-x-2 text-[15px] font-semibold text-neutral-900 dark:text-neutral-100">
        {t("specs.fullTitle")}
        <span className="text-[12px] font-normal text-neutral-500 dark:text-neutral-400">
          {t("china.specsNote")}
        </span>
      </h2>

      {highlights.length > 0 && (
        <div className="mt-4">
          <h3 className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
            {t("china.options")}
            <span className="ml-2 font-medium text-neutral-500 dark:text-neutral-400">
              {highlights.length}
            </span>
          </h3>
          {/* Each item carries its own bottom gap and the list takes the last
              one back, so a column break never opens on a margin. */}
          <ul className="-mb-2 mt-3 columns-1 gap-x-8 @md:columns-2 @3xl:columns-3">
            {highlights.map((name) => (
              <li
                key={name}
                className="flex break-inside-avoid items-start gap-2.5 pb-2 text-[13px] leading-snug text-neutral-700 dark:text-neutral-300"
              >
                <CheckIcon />
                {name}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 divide-y divide-neutral-100 border-t border-neutral-100 dark:divide-neutral-800 dark:border-neutral-800">
        {sections.map((section, i) => (
          <details
            key={`${section.title ?? "general"}-${i}`}
            open={i < OPEN_SECTIONS}
            className="group"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-3 text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 [&::-webkit-details-marker]:hidden">
              <span>
                {/* The sheet opens untitled; an untitled section further down
                    is one whose Chinese title had no translation. */}
                {section.title ??
                  t(i === 0 ? "china.specsGeneral" : "china.specsOther")}
                <span className="ml-2 font-medium text-neutral-500 dark:text-neutral-400">
                  {section.items.length}
                </span>
              </span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 shrink-0 text-neutral-400 transition-transform group-open:rotate-180"
                aria-hidden
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </summary>
            <dl className="grid gap-x-8 pb-3 @2xl:grid-cols-2">
              {section.items.map((item, j) => (
                <div
                  key={`${item.label}-${j}`}
                  className="flex items-start justify-between gap-4 border-b border-dashed border-neutral-100 py-1.5 text-[13px] dark:border-neutral-800"
                >
                  <dt className="min-w-0 text-neutral-500 dark:text-neutral-400">
                    {item.label}
                  </dt>
                  <dd className="min-w-0 text-right font-medium text-neutral-900 dark:text-neutral-100">
                    {item.value === "YES" ? (
                      <CheckIcon label={t("china.standard")} />
                    ) : item.value === "OPT" ? (
                      t("china.optional")
                    ) : (
                      item.value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </details>
        ))}
      </div>
    </section>
  );
}

function CheckIcon({ label }: { label?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-0.5 inline-block h-3.5 w-3.5 shrink-0 text-emerald-500"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
