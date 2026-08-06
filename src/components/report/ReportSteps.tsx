import Image from "next/image";
import { getTranslations } from "next-intl/server";
import SectionHeading from "@/components/ui/SectionHeading";
import Reveal from "@/components/ui/Reveal";

type IconProps = React.SVGProps<SVGSVGElement>;

const iconBase = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** A text field with a caret — "type your VIN". */
function VinIcon(props: IconProps) {
  return (
    <svg {...iconBase} {...props}>
      <rect x="2.5" y="7" width="19" height="10" rx="2.5" />
      <path d="M6.5 10v4" />
      <path d="M10 12h5.5" />
    </svg>
  );
}

function PayIcon(props: IconProps) {
  return (
    <svg {...iconBase} {...props}>
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="M2.5 10h19" />
      <path d="M6 14.5h3.5" />
    </svg>
  );
}

function PdfIcon(props: IconProps) {
  return (
    <svg {...iconBase} {...props}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M12 11.5V17" />
      <path d="m9.5 14.5 2.5 2.5 2.5-2.5" />
    </svg>
  );
}

const STEPS = [
  { key: "enter", Icon: VinIcon },
  { key: "pay", Icon: PayIcon },
  { key: "receive", Icon: PdfIcon },
] as const;

export default async function ReportSteps({ price }: { price: number }) {
  const t = await getTranslations("reportLanding.steps");

  return (
    <section id="report-steps" className="mx-auto w-full max-w-7xl px-4 py-14 md:py-20 lg:px-6">
      <SectionHeading heading={t("heading")} />

      <Reveal className="mt-10 md:mt-12">
        <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-50 p-6 md:p-10 dark:border-neutral-800 dark:bg-neutral-900/60">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 [background:radial-gradient(120%_80%_at_50%_0%,rgba(241,71,44,0.05),transparent_65%)]"
          />

          <ol className="relative grid gap-8 md:grid-cols-3 md:gap-6">
            {STEPS.map(({ key, Icon }, i) => (
              <li key={key} className="relative flex gap-4 md:block">
                {/* Rail reaching from this node's edge to the next node's edge:
                    vertical below md (node is 48px, row gap 32px), horizontal
                    on md (node is 56px, column gap 24px). */}
                {i < STEPS.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-8 left-6 top-12 w-px -translate-x-1/2 bg-linear-to-b from-primary/35 via-primary/15 to-primary/35 md:bottom-auto md:left-14 md:-right-6 md:top-7 md:h-px md:w-auto md:-translate-y-1/2 md:translate-x-0 md:bg-linear-to-r"
                  />
                ) : null}

                <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-primary shadow-[0_1px_2px_rgba(15,23,42,0.06)] ring-1 ring-primary/20 md:h-14 md:w-14 dark:bg-neutral-900 dark:ring-primary/25">
                  <Icon className="h-5 w-5 md:h-6 md:w-6" />
                </span>

                <div className="min-w-0 md:mt-5">
                  <p className="text-[11px] font-semibold uppercase text-primary">
                    {t("stepLabel", { n: String(i + 1).padStart(2, "0") })}
                  </p>
                  <h3 className="mt-1.5 text-[15.5px] font-semibold text-neutral-900 dark:text-neutral-50">
                    {t(`items.${key}.title`)}
                  </h3>
                  {/* Only the `pay` body carries {price}; ICU ignores the
                      value for the two that don't. */}
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-neutral-600 dark:text-neutral-400">
                    {t(`items.${key}.body`, { price })}
                  </p>
                  {key === "pay" ? (
                    <span className="mt-3 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white py-1 pl-1 pr-3 text-[12px] font-medium text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                      <Image
                        src="/images/qpay_logo.jpeg"
                        alt="QPay"
                        width={40}
                        height={40}
                        className="h-5 w-5 rounded-md"
                      />
                      {t("payMethod")}
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Reveal>
    </section>
  );
}
