import { getTranslations } from "next-intl/server";
import ReportHeading from "./ReportHeading";
import Reveal from "./Reveal";

const AUDIENCE_KEYS = ["a1", "a2", "a3", "a4", "a5", "a6"] as const;

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
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

/**
 * §5.8 "who is this for".
 * Tinted full-bleed band + asymmetric layout: the heading stays on the left
 * while the cases read as one hairline checklist — deliberately card-less so
 * it doesn't repeat the card grids of Features/Why above it.
 */
export default async function ReportAudience() {
  const t = await getTranslations("reportLanding.audience");

  return (
    <section className="relative isolate overflow-hidden border-y border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/40">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 [background:radial-gradient(65%_85%_at_0%_0%,rgba(241,71,44,0.07),transparent_62%)]"
      />

      <div className="mx-auto w-full max-w-7xl px-4 py-14 md:py-20 lg:px-6">
        <div className="grid gap-9 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
          <Reveal className="lg:h-full">
            <div className="lg:flex lg:h-full lg:flex-col">
              <p className="mb-3 flex items-center gap-2.5 text-[11px] font-semibold uppercase text-primary">
                <span
                  aria-hidden="true"
                  className="h-px w-6 bg-primary/45"
                />
                {t("eyebrow")}
              </p>

              <ReportHeading align="left" heading={t("heading")} />

              {/* Verified-stamp motif — anchors the column beside the list. */}
              <span
                aria-hidden="true"
                className="relative mt-10 hidden h-32 w-32 -rotate-6 place-items-center rounded-full border border-dashed border-primary/30 text-primary/60 lg:mt-auto lg:grid"
              >
                <span className="absolute inset-2 rounded-full border border-primary/15" />
                <CheckIcon className="h-10 w-10" />
              </span>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <ol className="divide-y divide-neutral-200 border-y border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
              {AUDIENCE_KEYS.map((k) => (
                <li
                  key={k}
                  className="group flex items-start gap-4 py-4 md:gap-5 md:py-5"
                >
                  <span className="mt-px grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-primary ring-1 ring-primary/25 transition-colors duration-200 group-hover:bg-primary group-hover:text-white group-hover:ring-primary dark:bg-neutral-900">
                    <CheckIcon className="h-3.5 w-3.5" />
                  </span>
                  <p className="text-[14px] leading-relaxed text-neutral-700 transition-colors duration-200 group-hover:text-neutral-900 md:text-[15px] dark:text-neutral-300 dark:group-hover:text-neutral-100">
                    {t(`items.${k}`)}
                  </p>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
