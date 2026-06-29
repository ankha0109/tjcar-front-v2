import { getTranslations } from "next-intl/server";
import ReportHeading from "./ReportHeading";

const STEP_KEYS = ["input", "collect", "ready"] as const;

export default async function ReportSteps() {
  const t = await getTranslations("reportLanding.steps");

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 md:px-8 md:py-16">
      <ReportHeading
        eyebrow={t("eyebrow")}
        heading={t("heading")}
        subheading={t("subheading")}
      />

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        {STEP_KEYS.map((k) => (
          <div
            key={k}
            className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 transition-shadow duration-300 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900 dark:hover:shadow-black/40"
          >
            <span className="block text-[44px] font-bold leading-none text-primary/15 dark:text-primary/25">
              {t(`items.${k}.step`)}
            </span>
            <h3 className="mt-3 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {t(`items.${k}.title`)}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              {t(`items.${k}.body`)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
