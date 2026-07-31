"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { BorderBeam, Button, Input, Segmented } from "antd";
import type { BorderBeamGradient } from "antd";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/utils";
import {
  normalizeFor,
  validate,
  type SearchError,
  type SearchMode,
} from "@/lib/reportSearch";
import SampleReportModal from "./SampleReportModal";
import soyombo from "../../../public/images/32px-Soyombo_red.png";

// Brand-warm gradient for the lookup card's BorderBeam.
const CHECK_BEAM_COLOR: BorderBeamGradient = [
  { color: "#f1472c", percent: 0 },
  { color: "#ff8f66", percent: 52 },
  { color: "#ffcdb8", percent: 100 },
];

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export default function ReportHero() {
  const t = useTranslations("reportLanding.hero");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<SearchMode>("plate");
  const [value, setValue] = useState("");
  const [error, setError] = useState<SearchError>(null);
  const [sampleOpen, setSampleOpen] = useState(false);

  // Prefill from ?vin= (pushed by the home CarSearchSection). Read from
  // window instead of useSearchParams so the page can stay fully static.
  useEffect(() => {
    const vin = new URLSearchParams(window.location.search).get("vin");
    if (!vin) return;
    // One-time URL sync after hydration; useSearchParams would force a
    // Suspense/CSR bailout and make the page dynamic.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMode("vin");
    setValue(normalizeFor("vin", vin));
  }, []);

  function switchMode(next: SearchMode) {
    setMode(next);
    setValue("");
    setError(null);
  }

  /**
   * The hero only validates and hands off — the lookup itself runs on
   * /report/check so the result is refreshable and shareable, and so the
   * plate → VIN → report chain has somewhere to show its intermediate states.
   */
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate(mode, value);
    setError(err);
    if (err) return;

    const query = mode === "plate" ? { plate: value } : { vin: value };
    startTransition(() => {
      router.push({ pathname: "/report/check", query });
    });
  }

  return (
    <section
      id="report-hero"
      className="relative isolate overflow-hidden border-b border-neutral-200/70 bg-white dark:border-neutral-800/70 dark:bg-neutral-950"
    >
      {/* dot grid + soft shapes instead of a photo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.05)_1px,transparent_0)] [background-size:22px_22px] dark:[background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)]" />
        <div className="absolute inset-x-0 top-0 h-[360px] [background:radial-gradient(55%_70%_at_50%_0%,rgba(241,71,44,0.08),transparent_70%)]" />
        <div className="absolute -left-28 top-1/4 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full border border-neutral-200/80 dark:border-neutral-800/80" />
        <div className="absolute -right-6 top-28 h-36 w-36 rounded-full border border-primary/15" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-14 md:py-18 lg:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h1
            className="hero-reveal text-balance text-[30px] font-semibold leading-[1.1] text-neutral-900 sm:text-[38px] md:text-[44px] dark:text-neutral-50"
            style={{ animationDelay: "0ms" }}
          >
            {t("headingLine1")}{" "}
            <span className="shiny-text-primary relative whitespace-nowrap">
              {t("headingAccent")}
              <span
                aria-hidden="true"
                className="absolute inset-x-0 -bottom-1 h-2 -skew-x-6 rounded bg-primary/15"
              />
            </span>{" "}
            {t("headingLine2")}
          </h1>

          <p
            className="hero-reveal mx-auto mt-4 max-w-xl text-[13.5px] leading-relaxed text-neutral-600 md:text-[15px] dark:text-neutral-400"
            style={{ animationDelay: "120ms" }}
          >
            {t("subheading")}
          </p>

          {/* Lookup form — the hero's focal point */}
          <form
            id="report-check"
            onSubmit={handleSubmit}
            noValidate
            className="hero-reveal mx-auto mt-8 w-full max-w-lg scroll-mt-24"
            style={{ animationDelay: "220ms" }}
          >
            <Segmented<SearchMode>
              value={mode}
              onChange={switchMode}
              options={[
                { label: t("form.modePlate"), value: "plate" },
                { label: t("form.modeVin"), value: "vin" },
              ]}
              className="mb-3"
            />
            <label htmlFor="report-vin-input" className="sr-only">
              {mode === "plate" ? t("form.plateLabel") : t("form.label")}
            </label>
            {/* duration/size need antd >= 6.5. Keep `size` shorter than the
                card's side edge — a longer segment wraps both corners of the
                low card at once and reads as two separate beams. */}
            <BorderBeam
              color={CHECK_BEAM_COLOR}
              outset={0}
              duration={3}
              size={70}
            >
              <div
                className={cn(
                  "relative flex flex-col gap-2 overflow-hidden rounded-2xl border bg-white p-2 shadow-[0_24px_55px_-28px_rgba(0,0,0,0.28)] transition-colors sm:flex-row sm:items-center dark:bg-neutral-900",
                  error
                    ? "border-red/60"
                    : "border-neutral-200 focus-within:border-primary/50 dark:border-neutral-800 dark:focus-within:border-primary/50",
                )}
              >
                <Input
                  id="report-vin-input"
                  size="large"
                  variant="borderless"
                  value={value}
                  prefix={
                    mode === "plate" ? (
                      <Image
                        src={soyombo}
                        alt=""
                        aria-hidden="true"
                        className="mr-1 h-5 w-auto"
                      />
                    ) : (
                      <SearchIcon
                        aria-hidden="true"
                        className="mr-1 h-4 w-4 text-neutral-400"
                      />
                    )
                  }
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? "report-vin-error" : undefined}
                  onChange={(e) => {
                    setValue(normalizeFor(mode, e.target.value));
                    if (error) setError(null);
                  }}
                  placeholder={
                    mode === "plate"
                      ? t("form.platePlaceholder")
                      : t("form.placeholder")
                  }
                  className="min-h-11! flex-1"
                  allowClear
                />
                <Button
                  color="default"
                  variant="solid"
                  size="large"
                  htmlType="submit"
                  loading={isPending}
                  className="min-h-12! w-full rounded-xl! px-6! font-semibold! sm:w-auto"
                >
                  {t("form.submit")}
                </Button>
              </div>
            </BorderBeam>
            {error ? (
              <p
                id="report-vin-error"
                role="alert"
                className="mt-2.5 text-[12.5px] font-medium text-red"
              >
                {t(`form.errors.${error}`)}
              </p>
            ) : null}
          </form>

          <div
            className="hero-reveal mt-6 flex flex-wrap items-center justify-center gap-3"
            style={{ animationDelay: "320ms" }}
          >
            <button
              type="button"
              onClick={() => setSampleOpen(true)}
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-neutral-200 bg-white px-4.5 py-2 text-[13px] font-medium text-neutral-700 shadow-sm transition-colors hover:border-primary hover:text-primary dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3.5 w-3.5 text-primary"
              >
                <path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12Z" />
                <circle cx="12" cy="12" r="2.5" />
              </svg>
              {t("form.secondaryCta")}
            </button>
            <SampleReportModal
              open={sampleOpen}
              onClose={() => setSampleOpen(false)}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
