import { getTranslations } from "next-intl/server";
import ReportHeading from "./ReportHeading";

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
      <path d="M12 14a8 8 0 1 0-8 0" transform="translate(8 4)" />
      <path d="M4 16a8 8 0 0 1 16 0" />
      <path d="M12 16l3.5-3.5" />
      <circle cx="12" cy="16" r="1" />
    </svg>
  );
}

function AccidentIcon(props: IconProps) {
  return (
    <svg {...iconBase} {...props}>
      <path d="M10.3 4.3 2.5 18a1.5 1.5 0 0 0 1.3 2.2h16.4a1.5 1.5 0 0 0 1.3-2.2L13.7 4.3a1.5 1.5 0 0 0-2.6 0Z" />
      <path d="M12 10v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function WaterIcon(props: IconProps) {
  return (
    <svg {...iconBase} {...props}>
      <path d="M12 3s6 6.5 6 10.5A6 6 0 0 1 6 13.5C6 9.5 12 3 12 3Z" />
      <path d="M9.5 14a2.5 2.5 0 0 0 2.5 2.5" />
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

function HistoryIcon(props: IconProps) {
  return (
    <svg {...iconBase} {...props}>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 4v4h4" />
      <path d="M12 8v4l3 2" />
    </svg>
  );
}

function GradeIcon(props: IconProps) {
  return (
    <svg {...iconBase} {...props}>
      <path d="m12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.2l1-5.8L3.5 9.2l5.9-.9L12 3Z" />
    </svg>
  );
}

const ITEMS = [
  { key: "km", Icon: KmIcon },
  { key: "accident", Icon: AccidentIcon },
  { key: "water", Icon: WaterIcon },
  { key: "photos", Icon: PhotosIcon },
  { key: "history", Icon: HistoryIcon },
  { key: "grade", Icon: GradeIcon },
] as const;

export default async function ReportContents() {
  const t = await getTranslations("reportLanding.contents");

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 md:px-8 md:py-16">
      <ReportHeading
        eyebrow={t("eyebrow")}
        heading={t("heading")}
        subheading={t("subheading")}
      />

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ITEMS.map(({ key, Icon }) => (
          <div
            key={key}
            className="group flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-6 transition-shadow duration-300 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900 dark:hover:shadow-black/40"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              {t(`items.${key}.title`)}
            </h3>
            <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              {t(`items.${key}.body`)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
