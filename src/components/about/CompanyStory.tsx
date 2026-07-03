import { getTranslations } from "next-intl/server";

const MILESTONES = ["y2022", "y2024", "y2025"] as const;
const STATS = ["orders", "users", "delivery", "savings"] as const;

export default async function CompanyStory() {
  const t = await getTranslations("about.story");

  return (
    <section className="border-b border-neutral-100 dark:border-neutral-900">
      <div className="mx-auto w-full max-w-7xl px-4 py-14 md:py-20">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-7">
            <span className="text-xs font-medium uppercase text-neutral-500 dark:text-neutral-400">
              {t("eyebrow")}
            </span>
            <h2 className="mt-2 text-2xl font-semibold text-neutral-900 md:text-3xl dark:text-neutral-100">
              {t("heading")}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-neutral-600 md:text-base dark:text-neutral-400">
              {t("body")}
            </p>
          </div>

          <div className="lg:col-span-5">
            <ol className="relative space-y-5 border-l border-neutral-200 pl-6 dark:border-neutral-800">
              {MILESTONES.map((key) => (
                <li key={key} className="relative">
                  <span className="absolute -left-[27px] top-1.5 flex h-2.5 w-2.5 items-center justify-center rounded-full border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-950">
                    <span className="h-1 w-1 rounded-full bg-primary" />
                  </span>
                  <div className="text-[11px] font-semibold uppercase text-neutral-500 dark:text-neutral-400">
                    {t(`milestones.${key}.label`)}
                  </div>
                  <div className="mt-0.5 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {t(`milestones.${key}.text`)}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 md:mt-14 md:grid-cols-4 md:gap-4">
          {STATS.map((key) => (
            <div
              key={key}
              className="rounded-xl border border-neutral-200 bg-white px-4 py-4 transition-colors hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-700 md:px-5 md:py-5"
            >
              <div className="text-2xl font-semibold tabular-nums tracking-tight text-neutral-900 md:text-[28px] dark:text-neutral-100">
                {t(`stats.${key}.value`)}
              </div>
              <div className="mt-1 text-[12.5px] text-neutral-500 dark:text-neutral-400">
                {t(`stats.${key}.label`)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
