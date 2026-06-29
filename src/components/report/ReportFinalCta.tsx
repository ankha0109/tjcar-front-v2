"use client";

import { useTranslations } from "next-intl";
import { Button } from "antd";

export default function ReportFinalCta() {
  const t = useTranslations("reportLanding.finalCta");

  function handleClick() {
    document
      .getElementById("report-hero")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-16 pt-4 md:px-8 md:pb-24">
      <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-950 px-6 py-12 text-center md:px-12 md:py-16 dark:border-neutral-800">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 80% at 50% 0%, rgba(241,71,44,0.28), transparent 70%)",
          }}
        />
        <div className="relative">
          <h2 className="mx-auto max-w-2xl text-[24px] font-semibold leading-tight tracking-tight text-white md:text-[32px]">
            {t("heading")}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-white/70 md:text-base">
            {t("subheading")}
          </p>
          <Button
            type="primary"
            size="large"
            onClick={handleClick}
            className="mt-7 rounded-full! px-8! font-semibold!"
          >
            {t("cta")}
          </Button>
        </div>
      </div>
    </section>
  );
}
