import { getTranslations } from "next-intl/server";

const STEPS = ["select", "deposit", "auction", "ship", "handover"] as const;

export default async function ProcessTimeline() {
  const t = await getTranslations("about.process");

  return (
    <section className="border-b border-neutral-100 bg-neutral-50/60 dark:border-neutral-900 dark:bg-neutral-900/30">
      <div className="mx-auto w-full max-w-7xl px-4 py-14 md:py-20">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 md:mb-12 md:flex-row md:items-end">
          <div>
            <span className="text-xs font-medium uppercase text-neutral-500 dark:text-neutral-400">
              {t("eyebrow")}
            </span>
            <h2 className="mt-2 text-2xl font-semibold text-neutral-900 md:text-3xl dark:text-neutral-100">
              {t("heading")}
            </h2>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-neutral-700 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-300">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {t("durationBadge")}
          </span>
        </div>

        <ol className="relative grid grid-cols-1 gap-6 md:grid-cols-5 md:gap-4">
          {/* horizontal connecting line on desktop */}
          <span
            aria-hidden="true"
            className="absolute left-4 top-0 hidden h-px w-[calc(100%-2rem)] -translate-y-3 bg-gradient-to-r from-transparent via-neutral-300 to-transparent md:block dark:via-neutral-700"
            style={{ top: "1.25rem" }}
          />
          {STEPS.map((key, idx) => (
            <li key={key} className="relative flex gap-4 md:flex-col md:gap-3">
              <div className="flex shrink-0 md:relative">
                <span className="relative z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 bg-white text-[13px] font-semibold tabular-nums text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100">
                  {idx + 1}
                </span>
                {/* vertical connector on mobile, except last */}
                {idx < STEPS.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute left-1/2 top-10 h-[calc(100%+1.5rem)] w-px -translate-x-1/2 bg-neutral-200 md:hidden dark:bg-neutral-800"
                  />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                  {t(`steps.${key}.title`)}
                </h3>
                <p className="mt-1 text-[13.5px] leading-relaxed text-neutral-600 dark:text-neutral-400">
                  {t(`steps.${key}.body`)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
