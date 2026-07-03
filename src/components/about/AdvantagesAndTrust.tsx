import { getTranslations } from "next-intl/server";

type AdvantageKey = "savings" | "transparency" | "endToEnd" | "value";

const ADVANTAGES: AdvantageKey[] = [
  "savings",
  "transparency",
  "endToEnd",
  "value",
];

export default async function AdvantagesAndTrust() {
  const t = await getTranslations("about.advantages");

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

            <ul className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
              {ADVANTAGES.map((key) => (
                <li key={key} className="flex gap-3">
                  <span className="mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300">
                    <CheckIcon className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                      {t(`items.${key}.title`)}
                    </h3>
                    <p className="mt-1 text-[13.5px] leading-relaxed text-neutral-600 dark:text-neutral-400">
                      {t(`items.${key}.body`)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <aside className="lg:col-span-5">
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-6 dark:border-neutral-800 dark:bg-neutral-900/40 md:p-7">
              <span className="text-xs font-medium uppercase text-primary">
                {t("callout.eyebrow")}
              </span>
              <h3 className="mt-2 text-xl font-semibold text-neutral-900 md:text-2xl dark:text-neutral-100">
                {t("callout.heading")}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                {t("callout.body")}
              </p>
              <div className="mt-5 rounded-xl border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950">
                <span className="block text-[11px] font-semibold uppercase text-neutral-500 dark:text-neutral-400">
                  Toyota Prius
                </span>
                <span className="mt-1 block text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                  {t("callout.example")}
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
