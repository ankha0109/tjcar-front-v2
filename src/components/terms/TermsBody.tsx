import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Reveal from "@/components/ui/Reveal";
import { CONTACT_PHONE_DISPLAY, CONTACT_PHONE_RAW } from "@/lib/contact";

/**
 * The clauses, in the order the v1 `/tos` page listed them. `amount` marks the
 * two deposit clauses that carry a figure worth pulling out of the paragraph;
 * `winning` is the one clause customers dispute afterwards, so it gets the
 * tinted card instead of a plain paragraph.
 */
const SECTIONS = [
  { key: "deposit", amount: true },
  { key: "premium", amount: true },
  { key: "applied", amount: false },
  { key: "refund", amount: false },
  { key: "winning", amount: false },
] as const;

/** Header height plus a little air, so an anchor jump clears the fixed bar. */
const ANCHOR_OFFSET = "scroll-mt-[calc(var(--header-h)+1.5rem)]";

export default async function TermsBody() {
  const t = await getTranslations("terms");

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 md:py-16 lg:px-6">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
        {/* Contents rail. Desktop only — on a phone the document is short
            enough that a jump list costs more than it saves. */}
        <aside className="hidden lg:col-span-4 lg:block xl:col-span-3">
          <nav
            aria-label={t("toc")}
            className="sticky top-[calc(var(--header-h)+1.5rem)]"
          >
            <p className="mb-4 text-[11px] font-semibold uppercase text-neutral-400 dark:text-neutral-500">
              {t("toc")}
            </p>
            <ol className="border-l border-neutral-200 dark:border-neutral-800">
              {SECTIONS.map((section, i) => (
                <li key={section.key}>
                  {/* antd's reset paints a bare <a> blue, so the colour has to
                      sit on the anchor itself — inheriting it does not win. */}
                  <a
                    href={`#${section.key}`}
                    className="group -ml-px flex gap-3 border-l-2 border-transparent py-2 pl-4 text-[13px] leading-snug text-neutral-500 transition-colors hover:border-primary hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                  >
                    <span className="text-[11px] font-semibold tabular-nums text-neutral-300 transition-colors group-hover:text-primary dark:text-neutral-600">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {t(`sections.${section.key}.title`)}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <div className="max-w-3xl lg:col-span-8 xl:col-span-9">
          <ol className="divide-y divide-neutral-200/80 dark:divide-neutral-800/80">
            {SECTIONS.map((section, i) => {
              const number = String(i + 1).padStart(2, "0");
              const highlighted = section.key === "winning";

              return (
                <li
                  key={section.key}
                  id={section.key}
                  className={`${ANCHOR_OFFSET} py-8 first:pt-0 last:pb-0`}
                >
                  <div className="flex items-baseline gap-4">
                    <span
                      aria-hidden="true"
                      className="w-5 shrink-0 text-[12px] font-semibold tabular-nums text-primary/70"
                    >
                      {number}
                    </span>
                    <h2 className="text-[19px] font-semibold leading-snug text-neutral-900 md:text-[21px] dark:text-neutral-50">
                      {t(`sections.${section.key}.title`)}
                    </h2>
                  </div>

                  <div className="mt-3.5 sm:pl-9">
                    {highlighted ? (
                      <div className="rounded-xl border border-primary/25 bg-primary/[0.045] p-4 md:p-5 dark:bg-primary/10">
                        <p className="mb-2.5 flex items-center gap-2 text-[11px] font-semibold uppercase text-primary">
                          <AlertIcon className="h-3.5 w-3.5" />
                          {t("importantLabel")}
                        </p>
                        <p className="text-[14.5px] leading-[1.75] text-neutral-700 dark:text-neutral-300">
                          {t(`sections.${section.key}.body`)}
                        </p>
                      </div>
                    ) : (
                      <p className="text-[14.5px] leading-[1.8] text-neutral-600 dark:text-neutral-400">
                        {t(`sections.${section.key}.body`)}
                      </p>
                    )}

                    {section.amount ? (
                      <p className="mt-4 inline-flex items-baseline gap-2.5 rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2 dark:border-neutral-800 dark:bg-neutral-900/60">
                        <span className="text-[15px] font-semibold tabular-nums text-neutral-900 dark:text-neutral-50">
                          {t(`sections.${section.key}.amount`)}
                        </span>
                        <span className="text-[12px] text-neutral-500 dark:text-neutral-400">
                          {t(`sections.${section.key}.amountLabel`)}
                        </span>
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>

          <Reveal className="mt-12 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 md:p-6 dark:border-neutral-800 dark:bg-neutral-900/40">
              <h2 className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-50">
                {t("closing.title")}
              </h2>
              <p className="mt-2 text-[13.5px] leading-relaxed text-neutral-600 dark:text-neutral-400">
                {t("closing.body")}
              </p>
              <Link
                href="/auth/register"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
              >
                {t("closing.cta")}
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-5 md:p-6 dark:border-neutral-800 dark:bg-neutral-900/40">
              <h2 className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-50">
                {t("contact.title")}
              </h2>
              <p className="mt-2 text-[13.5px] leading-relaxed text-neutral-600 dark:text-neutral-400">
                {t("contact.body")}
              </p>
              <a
                href={`tel:${CONTACT_PHONE_RAW}`}
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-neutral-200 px-4 py-2.5 text-[13px] font-semibold text-neutral-900 transition-colors hover:border-primary hover:text-primary dark:border-neutral-700 dark:text-neutral-100"
              >
                <PhoneIcon className="h-3.5 w-3.5" />
                {CONTACT_PHONE_DISPLAY}
              </a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function AlertIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16.5v.01" />
    </svg>
  );
}

function PhoneIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
    </svg>
  );
}

function ArrowRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
