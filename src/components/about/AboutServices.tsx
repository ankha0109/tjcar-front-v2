import { getTranslations } from "next-intl/server";
import Globe from "@/components/Globe";
import Reveal from "@/components/ui/Reveal";

type IconName = "japan" | "korea" | "global" | "ready" | "report" | "custom";

const ITEMS: IconName[] = [
  "japan",
  "korea",
  "global",
  "ready",
  "report",
  "custom",
];

/**
 * What we do. Carries the dotted globe (Japan/Korea → Mongolia routes) that used
 * to sit in the hero — the service copy is what the arcs are actually about, so
 * it reads better next to the card grid than above it.
 */
export default async function AboutServices() {
  const t = await getTranslations("about.services");
  const tRoute = await getTranslations("homeHero.route");

  return (
    <section className="relative isolate overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] [background:radial-gradient(60%_70%_at_50%_0%,rgba(241,71,44,0.06),transparent_70%)]"
      />

      <div className="mx-auto w-full max-w-7xl px-4 py-14 md:py-20 lg:px-6">
        <div className="max-w-2xl">
          <p className="mb-3 flex items-center gap-2.5 text-[11px] font-semibold uppercase text-primary">
            <span aria-hidden="true" className="h-px w-6 bg-primary/45" />
            {t("eyebrow")}
          </p>
          <h2 className="text-balance text-[26px] font-semibold leading-[1.15] text-neutral-900 md:text-[34px] dark:text-neutral-50">
            {t("heading")}
          </h2>
          <p className="mt-3 text-[13.5px] leading-relaxed text-neutral-600 md:text-[14.5px] dark:text-neutral-400">
            {t("subheading")}
          </p>
        </div>

        {/* Globe first in the DOM so it leads on phones; on lg it takes the left
            column and the six cards fill the right one — 3 rows of cards is
            about as tall as the globe, so neither side leaves a void. */}
        <div className="mt-10 grid grid-cols-1 items-center gap-10 md:mt-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <Globe
              labels={{
                japan: tRoute("japan"),
                korea: tRoute("korea"),
                mongolia: tRoute("mongolia"),
              }}
            />
          </div>

          <Reveal className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
            {ITEMS.map((key) => (
              <article
                key={key}
                className="group rounded-2xl border border-neutral-200 bg-white p-5 transition-colors hover:border-primary/30 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-primary/30"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                  <ServiceIcon name={key} className="h-5 w-5" />
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
    case "global":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18" />
          <path d="M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9s1.3-6.4 3.8-9z" />
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
    default:
      return null;
  }
}
