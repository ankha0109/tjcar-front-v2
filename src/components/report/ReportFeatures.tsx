import { getTranslations } from "next-intl/server";
import ReportHeading from "./ReportHeading";
import Reveal from "./Reveal";

type IconProps = React.SVGProps<SVGSVGElement>;

const iconBase = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function KmIcon(props: IconProps) {
  return (
    <svg {...iconBase} {...props}>
      <path d="M4 16a8 8 0 0 1 16 0" />
      <path d="M12 16l3.5-3.5" />
      <circle cx="12" cy="16" r="1" />
    </svg>
  );
}

function PhotosIcon(props: IconProps) {
  return (
    <svg {...iconBase} {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8.5" cy="10" r="1.5" />
      <path d="m21 16-4.5-4.5L7 21" />
    </svg>
  );
}

function GradeIcon(props: IconProps) {
  return (
    <svg {...iconBase} {...props}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 7h6" />
      <path d="M9 11h6" />
      <path d="m9 15.5 1.5 1.5 3-3" />
    </svg>
  );
}

function HistoryIcon(props: IconProps) {
  return (
    <svg {...iconBase} {...props}>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 4v4h4" />
      <path d="M12 8v4l3 2" />
    </svg>
  );
}

function StatusIcon(props: IconProps) {
  return (
    <svg {...iconBase} {...props}>
      <path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8 8a2 2 0 0 0 2.8 0l7.2-7.2a2 2 0 0 0 0-2.8l-8-8Z" />
      <circle cx="7.5" cy="7.5" r="1" />
    </svg>
  );
}

function QrIcon(props: IconProps) {
  return (
    <svg {...iconBase} {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h3v3h-3z" />
      <path d="M21 14v.01" />
      <path d="M14 21v.01" />
      <path d="M21 18v.01" />
      <path d="M18 21v.01" />
    </svg>
  );
}

const FEATURES = [
  { key: "km", Icon: KmIcon },
  { key: "photos", Icon: PhotosIcon },
  { key: "grade", Icon: GradeIcon },
  { key: "participation", Icon: HistoryIcon },
  { key: "status", Icon: StatusIcon },
  { key: "qr", Icon: QrIcon },
] as const;

export default async function ReportFeatures() {
  const t = await getTranslations("reportLanding.features");

  return (
    <section className="relative">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] [background:radial-gradient(60%_70%_at_50%_0%,rgba(241,71,44,0.06),transparent_70%)]"
      />
      <div className="mx-auto w-full max-w-7xl px-4 py-14 md:py-20 lg:px-6">
        <ReportHeading
          heading={t("heading")}
          subheading={t("subheading")}
        />

        <Reveal className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 md:mt-12">
          {FEATURES.map(({ key, Icon }) => (
            <article
              key={key}
              className="group rounded-2xl border border-neutral-200 bg-white p-5 transition-colors hover:border-primary/30 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-primary/30"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-[15px] font-semibold text-neutral-900 dark:text-neutral-50">
                {t(`items.${key}.title`)}
              </h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-neutral-600 dark:text-neutral-400">
                {t(`items.${key}.body`)}
              </p>
            </article>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
