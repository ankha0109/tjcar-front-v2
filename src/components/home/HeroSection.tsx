"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Globe from "@/components/Globe";

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

function PlayIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <polygon points="6 4 20 12 6 20 6 4" />
    </svg>
  );
}

export default function HeroSection() {
  const t = useTranslations("homeHero");

  return (
    <section className="hero-section relative isolate overflow-hidden">
      <div
        aria-hidden="true"
        className="hero-bg pointer-events-none absolute inset-0 -z-10"
      >
        <div className="hero-glow" />
      </div>

      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 px-4 pb-10 pt-12 md:gap-14 md:pb-16 md:pt-20 lg:grid-cols-12 lg:gap-8">
        {/* ── LEFT: editorial copy ───────────────────────── */}
        <div className="relative lg:col-span-6">
          <div className="hero-reveal" style={{ animationDelay: "0ms" }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/70 py-1.5 pl-2.5 pr-3.5 text-[11.5px] font-medium uppercase tracking-[0.14em] text-neutral-700 shadow-[0_1px_0_rgba(0,0,0,0.02)] backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/60 dark:text-neutral-300">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              <span>{t("eyebrow")}</span>
              <span className="h-3 w-px bg-neutral-200 dark:bg-neutral-700" />
              <span className="text-neutral-500 dark:text-neutral-400 normal-case tracking-normal">
                {t("eyebrowSub")}
              </span>
            </div>
          </div>

          <h1
            className="hero-reveal mt-5 text-[40px] font-semibold leading-[1.04] tracking-tight text-neutral-900 sm:text-[52px] md:text-[60px] lg:text-[60px] xl:text-[64px] dark:text-neutral-50"
            style={{ animationDelay: "120ms" }}
          >
            {t("headingLine1")}
            <br className="hidden sm:block" />{" "}
            <span className="relative whitespace-nowrap">
              <span className="relative z-10">{t("headingAccent")}</span>
              <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-[0.08em] -z-0 block h-[0.32em] -skew-x-6 bg-primary/25 dark:bg-primary/40"
              />
            </span>{" "}
            <span className="text-neutral-500 dark:text-neutral-400">
              {t("headingLine2")}
            </span>
          </h1>

          <p
            className="hero-reveal mt-5 max-w-md text-[15px] leading-relaxed text-neutral-600 md:text-base dark:text-neutral-400"
            style={{ animationDelay: "220ms" }}
          >
            {t("subheading")}
          </p>

          <div
            className="hero-reveal mt-6 flex flex-wrap gap-2"
            style={{ animationDelay: "320ms" }}
          >
            {(["japan", "korea", "report"] as const).map((key) => (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white/80 px-3 py-1.5 text-[12.5px] font-medium text-neutral-800 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-200"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {t(`features.${key}`)}
              </span>
            ))}
          </div>

          <div
            className="hero-reveal mt-7 flex flex-wrap items-center gap-3"
            style={{ animationDelay: "440ms" }}
          >
            <Link
              href="/cars"
              className="group inline-flex h-12 items-center gap-2 rounded-full bg-neutral-900 px-5 text-[14px] font-semibold text-white shadow-[0_8px_24px_-12px_rgba(0,0,0,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_-12px_rgba(0,0,0,0.55)] dark:bg-neutral-100 dark:text-neutral-900"
            >
              <span>{t("cta.primary")}</span>
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white transition-transform duration-300 group-hover:translate-x-0.5">
                <ArrowIcon className="h-3.5 w-3.5" />
              </span>
            </Link>
            <Link
              href="/how-it-works"
              className="group inline-flex h-12 items-center gap-2 rounded-full border border-neutral-300 bg-white/70 px-5 text-[14px] font-semibold text-neutral-900 backdrop-blur transition-all duration-300 hover:border-neutral-900 hover:bg-white dark:border-neutral-700 dark:bg-neutral-900/60 dark:text-neutral-100 dark:hover:border-neutral-100 dark:hover:bg-neutral-900"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-neutral-300 text-neutral-700 transition-colors group-hover:border-neutral-900 group-hover:text-neutral-900 dark:border-neutral-600 dark:text-neutral-300 dark:group-hover:border-neutral-100 dark:group-hover:text-neutral-100">
                <PlayIcon className="ml-px h-2.5 w-2.5" />
              </span>
              {t("cta.secondary")}
            </Link>
          </div>

          <div
            className="hero-reveal mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-neutral-500 dark:text-neutral-400"
            style={{ animationDelay: "560ms" }}
          >
            <span className="inline-flex items-baseline gap-1">
              <span className="text-[14px] font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                {t("stats.cars")}
              </span>{" "}
              <span>{t("stats.carsLabel")}</span>
            </span>
            <span className="h-3 w-px bg-neutral-200 dark:bg-neutral-800" />
            <span className="inline-flex items-baseline gap-1">
              <span className="text-[14px] font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                {t("stats.years")}
              </span>{" "}
              <span>{t("stats.yearsLabel")}</span>
            </span>
          </div>
        </div>

        {/* ── RIGHT: dotted globe with country flags ─────── */}
        <div className="relative lg:col-span-6">
          <Globe
            labels={{
              japan: t("route.japan"),
              korea: t("route.korea"),
              mongolia: t("route.mongolia"),
            }}
          />
        </div>
      </div>
    </section>
  );
}
