"use client";

import Image from "next/image";
import { useCallback, useState, type CSSProperties, type SVGProps } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/utils";
import { SHOWCASE_SERVICES } from "./serviceShowcaseData";

const METRIC_KEYS = ["m1", "m2", "m3"] as const;

function ArrowIcon(props: SVGProps<SVGSVGElement>) {
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

function ChevronIcon({ dir, ...props }: { dir: "left" | "right" } & SVGProps<SVGSVGElement>) {
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
      <polyline points={dir === "left" ? "15 18 9 12 15 6" : "9 18 15 12 9 6"} />
    </svg>
  );
}

function LockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

export default function ServiceShowcase() {
  const t = useTranslations("homeV2");
  const [active, setActive] = useState(0);
  const count = SHOWCASE_SERVICES.length;

  const select = useCallback(
    (index: number, el?: HTMLButtonElement | null) => {
      const next = (index + count) % count;
      setActive(next);
      el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    },
    [count],
  );

  const service = SHOWCASE_SERVICES[active];
  const key = service.key;
  const ActiveIcon = service.Icon;

  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-14 md:pt-20">
      {/* atmosphere */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] [background:radial-gradient(60%_70%_at_50%_0%,rgba(241,71,44,0.08),transparent_70%)]"
      />

      <div className="mx-auto w-full max-w-7xl">
        {/* header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            {t("eyebrow")}
          </span>
          <h2 className="max-w-2xl text-balance text-[26px] font-semibold tracking-tight text-neutral-900 md:text-[34px] dark:text-neutral-50">
            {t("heading")}
          </h2>
          <p className="max-w-xl text-[13.5px] leading-relaxed text-neutral-600 md:text-[14.5px] dark:text-neutral-400">
            {t("subheading")}
          </p>
        </div>

        {/* connectors + tab carousel */}
        <div className="mt-16 flex items-center gap-2 sm:gap-3 lg:mt-20">
          <button
            type="button"
            onClick={() => select(active - 1)}
            aria-label={t("prev")}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-neutral-200 bg-white text-neutral-600 transition-colors hover:border-primary hover:text-primary dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
          >
            <ChevronIcon dir="left" className="h-4 w-4" />
          </button>

          <div className="relative flex flex-1 gap-2 overflow-x-auto py-1 [-ms-overflow-style:none] [scrollbar-width:none] lg:grid lg:grid-cols-8 lg:overflow-visible [&::-webkit-scrollbar]:hidden">
            {/* connector lines — desktop only */}
            <svg
              aria-hidden
              className="pointer-events-none absolute inset-x-0 -top-14 hidden h-14 w-full lg:block"
              viewBox="0 0 1000 100"
              preserveAspectRatio="none"
              fill="none"
            >
              {SHOWCASE_SERVICES.map((s, i) => {
                const x = ((i + 0.5) / count) * 1000;
                const d = `M 500 2 C 500 64 ${x} 28 ${x} 100`;
                const isActive = i === active;
                return (
                  <path
                    key={s.key}
                    d={d}
                    pathLength={1}
                    className={isActive ? "sc-line-active" : "sc-line"}
                    style={isActive ? undefined : { animationDelay: `${i * 70}ms` }}
                    stroke={isActive ? "var(--color-primary)" : "rgba(241,71,44,0.25)"}
                    strokeWidth={isActive ? 2.4 : 1.2}
                    strokeLinecap="round"
                  />
                );
              })}
              <circle cx="500" cy="3" r="3.5" fill="var(--color-primary)" />
            </svg>

            {SHOWCASE_SERVICES.map((s, i) => {
              const Icon = s.Icon;
              const isActive = i === active;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={(e) => select(i, e.currentTarget)}
                  aria-pressed={isActive}
                  className={cn(
                    "group flex shrink-0 min-w-0 items-center justify-center gap-2 rounded-xl border px-4 py-3 transition-all duration-300 lg:shrink",
                    isActive
                      ? "border-primary bg-primary text-white shadow-[0_10px_30px_-12px_rgba(241,71,44,0.6)]"
                      : "border-neutral-200 bg-white text-neutral-600 hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300",
                  )}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  <span className="truncate text-[13px] font-medium">
                    {t(`services.${s.key}.tab`)}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => select(active + 1)}
            aria-label={t("next")}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-neutral-200 bg-white text-neutral-600 transition-colors hover:border-primary hover:text-primary dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
          >
            <ChevronIcon dir="right" className="h-4 w-4" />
          </button>
        </div>

        {/* showcase panel — re-mounts on active change to replay animations */}
        <div
          key={key}
          className="sc-panel-in mt-8 grid grid-cols-1 gap-6 rounded-3xl border border-primary/10 bg-primary/[0.04] p-4 sm:p-6 lg:grid-cols-12 lg:gap-10 lg:p-8 dark:border-primary/15 dark:bg-primary/[0.06]"
        >
          {/* visual — browser frame */}
          <div className="sc-visual-in lg:col-span-7">
            <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-[0_30px_70px_-35px_rgba(0,0,0,0.45)] dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-center gap-2 border-b border-neutral-100 px-4 py-2.5 dark:border-neutral-800">
                <span className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
                </span>
                <span className="mx-auto inline-flex max-w-full items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 font-mono text-[11px] text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                  <LockIcon className="h-3 w-3 shrink-0" />
                  <span className="truncate">{t(`services.${key}.url`)}</span>
                </span>
                <span className="h-2.5 w-2.5 shrink-0" />
              </div>

              <div className="relative aspect-[16/10] bg-neutral-50 dark:bg-neutral-900">
                {service.photo ? (
                  <Image
                    src={service.photo}
                    alt={t(`services.${key}.title`)}
                    fill
                    priority
                    sizes="(min-width: 1024px) 55vw, 100vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent">
                    <div className="absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.05)_1px,transparent_0)] [background-size:18px_18px] dark:[background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)]" />
                    <div className="relative flex h-full flex-col items-center justify-center gap-5 p-8">
                      <span className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-white/85 text-primary shadow-lg backdrop-blur dark:bg-neutral-900/70">
                        <ActiveIcon className="h-10 w-10" />
                      </span>
                      <div className="flex w-full max-w-[14rem] flex-col items-center gap-2">
                        <span className="h-2.5 w-3/4 rounded-full bg-neutral-200/80 dark:bg-neutral-700/60" />
                        <span className="h-2.5 w-1/2 rounded-full bg-neutral-200/60 dark:bg-neutral-700/40" />
                      </div>
                      <div className="flex gap-2">
                        {[0, 1, 2].map((d) => (
                          <span
                            key={d}
                            className="h-6 w-16 rounded-md border border-primary/20 bg-white/60 dark:bg-neutral-900/50"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* details */}
          <div className="flex flex-col justify-center lg:col-span-5">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ActiveIcon className="h-6 w-6" />
            </span>
            <h3 className="mt-4 text-[22px] font-semibold tracking-tight text-neutral-900 md:text-[24px] dark:text-neutral-50">
              {t(`services.${key}.title`)}
            </h3>
            <p className="mt-2.5 text-[14px] leading-relaxed text-neutral-600 dark:text-neutral-400">
              {t(`services.${key}.summary`)}
            </p>

            <div className="mt-6 grid grid-cols-3 gap-3">
              {METRIC_KEYS.map((mk, idx) => (
                <div
                  key={mk}
                  className="sc-stat rounded-xl border border-neutral-200/70 bg-white/70 px-3 py-3 dark:border-neutral-800 dark:bg-neutral-900/50"
                  style={{ "--i": idx } as CSSProperties}
                >
                  <div className="font-mono text-[17px] font-semibold tabular-nums tracking-tight text-neutral-900 dark:text-neutral-50">
                    {t(`services.${key}.${mk}.value`)}
                  </div>
                  <div className="mt-0.5 text-[11px] leading-tight text-neutral-500 dark:text-neutral-400">
                    {t(`services.${key}.${mk}.label`)}
                  </div>
                </div>
              ))}
            </div>

            <Link
              href={service.href}
              className="group mt-7 inline-flex w-fit items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[13.5px] font-medium text-white shadow-[0_12px_30px_-12px_rgba(241,71,44,0.7)] transition-all duration-300 hover:gap-3 hover:brightness-105"
            >
              {t(`services.${key}.cta`)}
              <ArrowIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
