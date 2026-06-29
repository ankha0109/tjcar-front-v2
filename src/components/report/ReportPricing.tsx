"use client";

import { useTranslations } from "next-intl";
import { Button } from "antd";
import ReportHeading from "./ReportHeading";

const INCLUDE_KEYS = ["i1", "i2", "i3", "i4", "i5"] as const;

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

export default function ReportPricing() {
  const t = useTranslations("reportLanding.pricing");

  function handleOrder() {
    // TODO: replace with real order/checkout once the /reports flow + payment exist.
    // For now, return the user to the hero lookup to start an order.
    document
      .getElementById("report-hero")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section
      id="report-pricing"
      className="mx-auto w-full max-w-7xl px-4 py-12 md:px-8 md:py-16"
    >
      <ReportHeading
        eyebrow={t("eyebrow")}
        heading={t("heading")}
        align="center"
      />

      <div className="mx-auto mt-8 max-w-md">
        <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-7 shadow-[0_24px_60px_-32px_rgba(0,0,0,0.4)] dark:border-neutral-800 dark:bg-neutral-900">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-2xl"
          />
          <div className="flex items-end gap-1">
            <span className="text-[40px] font-bold leading-none tracking-tight text-neutral-900 dark:text-neutral-50">
              {t("price")}
            </span>
            <span className="pb-1 text-sm text-neutral-500 dark:text-neutral-400">
              {t("period")}
            </span>
          </div>

          <ul className="mt-6 flex flex-col gap-3">
            {INCLUDE_KEYS.map((k) => (
              <li key={k} className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <CheckIcon className="h-3 w-3" />
                </span>
                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                  {t(`includes.${k}`)}
                </span>
              </li>
            ))}
          </ul>

          <Button
            type="primary"
            size="large"
            block
            onClick={handleOrder}
            className="mt-7 rounded-full! font-semibold!"
          >
            {t("cta")}
          </Button>

          <p className="mt-3 text-center text-xs text-neutral-500 dark:text-neutral-400">
            {t("note")}
          </p>
        </div>
      </div>
    </section>
  );
}
