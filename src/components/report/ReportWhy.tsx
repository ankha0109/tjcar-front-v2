import { getTranslations } from "next-intl/server";
import ReportHeading from "./ReportHeading";
import Reveal from "./Reveal";

const REASON_KEYS = ["r1", "r2", "r3", "r4"] as const;

/** §5.3 "why check" reasons + quote. */
export default async function ReportWhy() {
  const t = await getTranslations("reportLanding.why");

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-14 md:py-20 lg:px-6">
      <ReportHeading
        heading={t("heading")}
        subheading={t("subheading")}
      />

      <Reveal className="mt-10 grid gap-4 sm:grid-cols-2 md:mt-12 md:gap-6">
        {REASON_KEYS.map((k, i) => (
          <article
            key={k}
            className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <span className=" text-[12px] font-semibold tabular-nums text-primary">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-2 text-[15.5px] font-semibold text-neutral-900 dark:text-neutral-50">
              {t(`reasons.${k}.title`)}
            </h3>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-neutral-600 dark:text-neutral-400">
              {t(`reasons.${k}.body`)}
            </p>
          </article>
        ))}
      </Reveal>

      <Reveal delay={80}>
        <blockquote className="mt-6 rounded-2xl border border-primary/15 border-l-2 border-l-primary bg-primary/[0.04] p-6 text-[15px] leading-relaxed text-neutral-800 md:mt-8 md:text-[16px] dark:border-primary/20 dark:border-l-primary dark:bg-primary/[0.06] dark:text-neutral-200">
          “{t("quote")}”
        </blockquote>
      </Reveal>
    </section>
  );
}
