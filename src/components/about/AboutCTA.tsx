import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

const COMING = ["ai", "loan", "app"] as const;

export default async function AboutCTA() {
  const t = await getTranslations("about.cta");

  return (
    <section className="bg-white dark:bg-neutral-950">
      <div className="mx-auto w-full max-w-7xl px-4 py-14 md:py-20">
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50/70 px-6 py-10 dark:border-neutral-800 dark:bg-neutral-900/40 md:px-10 md:py-12">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-7">
              <h2 className="text-2xl font-semibold text-neutral-900 md:text-3xl dark:text-neutral-100">
                {t("heading")}
              </h2>
              <p className="mt-3 max-w-xl text-sm text-neutral-600 md:text-base dark:text-neutral-400">
                {t("body")}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 lg:col-span-5 lg:justify-end">
              <Link
                href="/cars"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-neutral-900 px-5 text-[13.5px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
              >
                {t("primary")}
              </Link>
              <a
                href="tel:+97670000000"
                className="inline-flex h-11 items-center gap-2 rounded-full border border-neutral-300 bg-white px-5 text-[13.5px] font-semibold text-neutral-900 transition-colors duration-200 hover:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:border-neutral-100"
              >
                {t("secondary")}
              </a>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-neutral-200 pt-6 dark:border-neutral-800">
            <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              {t("comingSoon.label")}
            </span>
            {COMING.map((key) => (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[12px] font-medium text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {t(`comingSoon.${key}`)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
