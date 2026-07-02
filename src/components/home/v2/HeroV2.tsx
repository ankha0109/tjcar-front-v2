"use client";

import type { CSSProperties, SVGProps } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { JapanIcon, KoreaIcon, MongoliaIcon } from "@/components/icons";

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

function PlayIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <polygon points="8 5 19 12 8 19 8 5" />
    </svg>
  );
}

/** A flag chip node on the route diagram. */
function FlagNode({
  flag,
  label,
  left,
  top,
  delay,
  destination = false,
}: {
  flag: React.ReactNode;
  label: string;
  left: string;
  top: string;
  delay: string;
  destination?: boolean;
}) {
  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left, top }}
    >
      <div className="hv-float" style={{ animationDelay: delay }}>
        <div
          className={
            destination
              ? "relative flex items-center gap-2 rounded-2xl border border-primary/30 bg-primary px-4 py-3 text-white shadow-[0_18px_40px_-16px_rgba(241,71,44,0.8)]"
              : "relative flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white/95 px-3.5 py-2.5 shadow-[0_16px_36px_-20px_rgba(0,0,0,0.5)] backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/90"
          }
        >
          {destination && (
            <span className="hv-pulse absolute inset-0 -z-10 rounded-2xl bg-primary/40" />
          )}
          <span className="inline-flex h-5 w-7 shrink-0 overflow-hidden rounded-[3px] ring-1 ring-black/10">
            {flag}
          </span>
          <span
            className={
              destination
                ? "text-[14px] font-semibold"
                : "text-[13px] font-medium text-neutral-800 dark:text-neutral-100"
            }
          >
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}

const reveal = (ms: number): CSSProperties => ({ animationDelay: `${ms}ms` });

export default function HeroV2() {
  const t = useTranslations("homeV2.hero");
  const flagClass = "h-full w-full";

  return (
    <section className="relative isolate overflow-hidden">
      <div aria-hidden className="hero-bg pointer-events-none absolute inset-0 -z-10">
        <div className="hero-glow" />
      </div>

      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 px-4 pb-14 pt-12 md:pt-16 lg:grid-cols-2 lg:gap-10 lg:pb-24 lg:pt-24">
        {/* copy */}
        <div className="relative">
          <div className="hero-reveal" style={reveal(0)}>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 py-1.5 pl-2.5 pr-3.5 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-primary">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              {t("badge")}
            </span>
          </div>

          <h1
            className="hero-reveal mt-5 text-balance text-[34px] font-semibold leading-[1.05] tracking-tight text-neutral-900 sm:text-[42px] md:text-[52px] dark:text-neutral-50"
            style={reveal(80)}
          >
            {t("titleLead")}{" "}
            <span className="relative whitespace-nowrap text-primary">
              {t("titleAccent")}
              <span className="absolute inset-x-0 -bottom-1 h-2 -skew-x-6 rounded bg-primary/15" />
            </span>
          </h1>

          <p
            className="hero-reveal mt-5 max-w-md text-[14.5px] leading-relaxed text-neutral-600 md:text-[15.5px] dark:text-neutral-400"
            style={reveal(160)}
          >
            {t("subtitle")}
          </p>

          <div
            className="hero-reveal mt-7 flex flex-wrap items-center gap-3"
            style={reveal(240)}
          >
            <Link
              href="/cars"
              className="group inline-flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-3 text-[13.5px] font-medium text-white transition-all duration-300 hover:gap-3 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
            >
              {t("ctaPrimary")}
              <span className="grid h-5 w-5 place-items-center rounded-full bg-primary text-white">
                <ArrowIcon className="h-3 w-3" />
              </span>
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-5 py-3 text-[13.5px] font-medium text-neutral-700 transition-colors hover:border-primary hover:text-primary dark:border-neutral-800 dark:text-neutral-200"
            >
              <PlayIcon className="h-3 w-3 text-primary" />
              {t("ctaSecondary")}
            </Link>
          </div>

          <dl
            className="hero-reveal mt-9 flex flex-wrap items-center gap-x-8 gap-y-4"
            style={reveal(320)}
          >
            {(["s1", "s2", "s3"] as const).map((s) => (
              <div key={s}>
                <dt className="font-mono text-[20px] font-semibold tabular-nums tracking-tight text-neutral-900 dark:text-neutral-50">
                  {t(`${s}.value`)}
                </dt>
                <dd className="text-[12px] text-neutral-500 dark:text-neutral-400">
                  {t(`${s}.label`)}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* route diagram */}
        <div className="hero-reveal relative" style={reveal(220)}>
          <div className="relative mx-auto aspect-square w-full max-w-[460px]">
            {/* card surface */}
            <div className="absolute inset-0 rounded-[28px] border border-neutral-200/70 bg-white/40 shadow-[0_40px_90px_-50px_rgba(0,0,0,0.5)] backdrop-blur-sm dark:border-neutral-800/70 dark:bg-neutral-950/30">
              <div className="absolute inset-0 rounded-[28px] [background-image:radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.05)_1px,transparent_0)] [background-size:22px_22px] dark:[background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)]" />
            </div>

            {/* flowing routes */}
            <svg
              aria-hidden
              viewBox="0 0 400 400"
              className="absolute inset-0 h-full w-full"
              fill="none"
            >
              <path
                d="M 100 116 Q 240 120 300 196"
                className="hv-arc"
                stroke="var(--color-primary)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M 100 284 Q 240 280 300 204"
                className="hv-arc"
                style={{ animationDelay: "-2.2s" }}
                stroke="var(--color-primary)"
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity={0.85}
              />
            </svg>

            <FlagNode
              flag={<JapanIcon className={flagClass} />}
              label={t("routeFrom1")}
              left="25%"
              top="29%"
              delay="0s"
            />
            <FlagNode
              flag={<KoreaIcon className={flagClass} />}
              label={t("routeFrom2")}
              left="25%"
              top="71%"
              delay="-2.7s"
            />
            <FlagNode
              flag={<MongoliaIcon className={flagClass} />}
              label={t("routeTo")}
              left="75%"
              top="50%"
              delay="-1.3s"
              destination
            />

            {/* delivery note chip */}
            <div
              className="absolute left-1/2 top-[12%] -translate-x-1/2"
              style={{ left: "54%" }}
            >
              <div className="hv-float" style={{ animationDelay: "-1.8s" }}>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white/95 px-3 py-1 font-mono text-[11px] text-neutral-600 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/90 dark:text-neutral-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {t("routeNote")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
