import { getTranslations } from "next-intl/server";

type IconName = "japan" | "korea" | "auction" | "ready" | "report" | "custom";

const ITEMS: { key: IconName }[] = [
  { key: "japan" },
  { key: "korea" },
  { key: "auction" },
  { key: "ready" },
  { key: "report" },
  { key: "custom" },
];

export default async function ServicesList() {
  const t = await getTranslations("about.services");

  return (
    <section className="border-b border-neutral-100 dark:border-neutral-900">
      <div className="mx-auto w-full max-w-7xl px-4 py-14 md:py-20">
        <div className="mb-8 max-w-2xl md:mb-10">
          <span className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            {t("eyebrow")}
          </span>
          <h2 className="mt-2 text-2xl font-semibold text-neutral-900 md:text-3xl dark:text-neutral-100">
            {t("heading")}
          </h2>
          <p className="mt-3 text-sm text-neutral-600 md:text-base dark:text-neutral-400">
            {t("subheading")}
          </p>
        </div>

        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ITEMS.map(({ key }) => (
            <li
              key={key}
              className="group relative flex flex-col rounded-xl border border-neutral-200 bg-white p-5 transition-colors duration-200 hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-700"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
                <ServiceIcon name={key} className="h-4.5 w-4.5" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-neutral-900 md:text-lg dark:text-neutral-100">
                {t(`items.${key}.title`)}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                {t(`items.${key}.body`)}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ServiceIcon({
  name,
  className,
}: {
  name: IconName;
  className?: string;
}) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: className ?? "h-4 w-4",
  };
  switch (name) {
    case "japan":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="3.5" fill="currentColor" stroke="none" />
        </svg>
      );
    case "korea":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M5 12c2-3 5-3 7 0s5 3 7 0" />
        </svg>
      );
    case "auction":
      return (
        <svg {...common}>
          <path d="M14 6l4 4M11 9l4 4M7 13l4 4" />
          <path d="M3 21h10" />
          <path d="M12 14l-9 7" />
        </svg>
      );
    case "ready":
      return (
        <svg {...common}>
          <path d="M3 13l2-6h14l2 6" />
          <path d="M3 13v6h2v-2h14v2h2v-6H3z" />
          <circle cx="7" cy="16" r="1.2" fill="currentColor" />
          <circle cx="17" cy="16" r="1.2" fill="currentColor" />
        </svg>
      );
    case "report":
      return (
        <svg {...common}>
          <path d="M7 3h7l5 5v13H7z" />
          <path d="M14 3v5h5" />
          <path d="M10 13h6M10 16h4" />
        </svg>
      );
    case "custom":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19 12a7 7 0 0 0-.14-1.4l1.65-1.27-2-3.46-1.94.78a7 7 0 0 0-2.4-1.39L13.8 3h-3.6l-.37 2.26a7 7 0 0 0-2.4 1.39l-1.94-.78-2 3.46L5.14 10.6A7 7 0 0 0 5 12c0 .47.05.94.14 1.4l-1.65 1.27 2 3.46 1.94-.78c.7.58 1.51 1.05 2.4 1.39L10.2 21h3.6l.37-2.26a7 7 0 0 0 2.4-1.39l1.94.78 2-3.46-1.65-1.27c.09-.46.14-.93.14-1.4z" />
        </svg>
      );
  }
}
