import Image from "next/image";
import { getTranslations } from "next-intl/server";
import ReportHeading from "./ReportHeading";
import sampleImg from "../../../public/images/tjreport_bg2.webp";

const POINT_KEYS = ["p1", "p2", "p3", "p4"] as const;

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

export default async function ReportSample() {
  const t = await getTranslations("reportLanding.sample");

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 md:px-8 md:py-16">
      <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Sample visual */}
        <div className="relative order-2 overflow-hidden rounded-2xl border border-neutral-200 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.5)] lg:order-1 dark:border-neutral-800">
          <div className="relative aspect-[4/3]">
            <Image
              src={sampleImg}
              alt={t("heading")}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              placeholder="blur"
              className="object-cover"
            />
          </div>
        </div>

        {/* Copy + checklist */}
        <div className="order-1 lg:order-2">
          <ReportHeading
            eyebrow={t("eyebrow")}
            heading={t("heading")}
            subheading={t("body")}
          />
          <ul className="mt-6 flex flex-col gap-3">
            {POINT_KEYS.map((k) => (
              <li key={k} className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <CheckIcon className="h-3 w-3" />
                </span>
                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                  {t(`points.${k}`)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
