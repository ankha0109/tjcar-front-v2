import { getTranslations } from "next-intl/server";
import Reveal from "@/components/ui/Reveal";

const MILESTONES = ["y2017", "y2022", "y2024", "y2025", "y2026"] as const;
const STATS = ["orders", "users", "savings"] as const;

/**
 * Company story. Tinted band so it breaks the rhythm of the white card sections
 * around it. Milestones use the same connector rail as `ReportSteps` — vertical
 * below `md`, horizontal from `md` up.
 */
export default async function AboutStory() {
  const t = await getTranslations("about.story");

  return (
    <section className="border-y border-neutral-200/70 bg-neutral-50/60 dark:border-neutral-800/70 dark:bg-neutral-900/40">
      <div className="mx-auto w-full max-w-7xl px-4 py-14 md:py-20 lg:px-6">
        <div className="max-w-3xl">
          <p className="mb-3 flex items-center gap-2.5 text-[11px] font-semibold uppercase text-primary">
            <span aria-hidden="true" className="h-px w-6 bg-primary/45" />
            {t("eyebrow")}
          </p>
          <h2 className="text-balance text-[26px] font-semibold leading-[1.15] text-neutral-900 md:text-[34px] dark:text-neutral-50">
            {t("heading")}
          </h2>
          <p className="mt-4 text-[13.5px] leading-relaxed text-neutral-600 md:text-[14.5px] dark:text-neutral-400">
            {t("body")}
          </p>
        </div>

        <Reveal className="mt-12 md:mt-14">
          <ol className="relative grid gap-8 lg:grid-cols-5 lg:gap-6">
            {MILESTONES.map((key, i) => (
              <li key={key} className="relative flex gap-4 lg:block">
                {/* Rail from this node's edge to the next node's edge: vertical
                    below lg (node 48px, row gap 32px), horizontal on lg
                    (node 56px, column gap 24px). */}
                {i < MILESTONES.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-8 left-6 top-12 w-px -translate-x-1/2 bg-linear-to-b from-primary/35 via-primary/15 to-primary/35 lg:-right-6 lg:bottom-auto lg:left-14 lg:top-7 lg:h-px lg:w-auto lg:-translate-y-1/2 lg:translate-x-0 lg:bg-linear-to-r"
                  />
                ) : null}

                <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-[13px] font-semibold text-primary shadow-[0_1px_2px_rgba(15,23,42,0.06)] ring-1 ring-primary/20 lg:h-14 lg:w-14 lg:text-[14px] dark:bg-neutral-900 dark:ring-primary/25">
                  {t(`milestones.${key}.label`)}
                </span>

                <div className="min-w-0 lg:mt-5">
                  <p className="text-[14px] font-medium leading-relaxed text-neutral-900 lg:text-[15px] dark:text-neutral-100">
                    {t(`milestones.${key}.text`)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>

        <Reveal delay={80}>
          <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-neutral-200 pt-10 md:mt-14 md:grid-cols-3 dark:border-neutral-800">
            {STATS.map((key) => (
              <div key={key}>
                <dt className="sr-only">{t(`stats.${key}.label`)}</dt>
                <dd>
                  <span className="block text-[30px] font-semibold leading-none text-neutral-900 md:text-[38px] dark:text-neutral-50">
                    {t(`stats.${key}.value`)}
                  </span>
                  <span className="mt-2.5 block text-[12.5px] text-neutral-500 dark:text-neutral-400">
                    {t(`stats.${key}.label`)}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
