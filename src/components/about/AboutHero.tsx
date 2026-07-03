import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Globe from "@/components/Globe";

export default async function AboutHero() {
  const t = await getTranslations("about.hero");
  const tRoute = await getTranslations("homeHero.route");

  return (
    <section className="relative isolate overflow-hidden border-b border-neutral-100 dark:border-neutral-900">
      <div
        aria-hidden="true"
        className="hero-bg pointer-events-none absolute inset-0 -z-10 opacity-60"
      >
        <div className="hero-glow" />
      </div>

      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 px-4 pb-14 pt-12 md:gap-14 md:pb-20 md:pt-20 lg:grid-cols-12 lg:gap-8">
        <div className="relative lg:col-span-6">
          <div className="hero-reveal" style={{ animationDelay: "0ms" }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/70 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-600 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/60 dark:text-neutral-400">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {t("eyebrow")}
            </span>
          </div>

          <h1
            className="hero-reveal mt-5 text-3xl font-semibold leading-[1.1] tracking-tight text-neutral-900 sm:text-4xl md:text-5xl dark:text-neutral-50"
            style={{ animationDelay: "120ms" }}
          >
            {t("title")}
          </h1>

          <p
            className="hero-reveal mt-5 max-w-xl text-[15px] leading-relaxed text-neutral-600 md:text-base dark:text-neutral-400"
            style={{ animationDelay: "220ms" }}
          >
            {t("subtitle")}
          </p>

          <div
            className="hero-reveal mt-7 flex flex-wrap items-center gap-3"
            style={{ animationDelay: "340ms" }}
          >
            <Link
              href="/cars"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-neutral-900 px-5 text-[13.5px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
            >
              {t("cta.primary")}
              <ArrowIcon className="h-3.5 w-3.5" />
            </Link>
            <a
              href="tel:+97675115888"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-neutral-300 bg-white/70 px-5 text-[13.5px] font-semibold text-neutral-900 backdrop-blur transition-colors duration-200 hover:border-neutral-900 hover:bg-white dark:border-neutral-700 dark:bg-neutral-900/60 dark:text-neutral-100 dark:hover:border-neutral-100"
            >
              {t("cta.secondary")}
            </a>
          </div>
        </div>

        <div className="relative lg:col-span-6">
          <Globe
            labels={{
              japan: tRoute("japan"),
              korea: tRoute("korea"),
              mongolia: tRoute("mongolia"),
            }}
          />
        </div>
      </div>
    </section>
  );
}

function ArrowIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
