"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Button, Input } from "antd";
import heroBg from "../../../public/images/tjreport_bg.webp";

const CHIP_KEYS = ["auto", "fast", "price"] as const;

export default function ReportHero() {
  const t = useTranslations("reportLanding.hero");
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: wire to the /reports lookup endpoint + payment (20,000₮).
    // No backend yet — for now we guide the user to the pricing/order section.
    document
      .getElementById("report-pricing")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section id="report-hero" className="relative isolate overflow-hidden">
      {/* Background image + legibility overlays */}
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <Image
          src={heroBg}
          alt=""
          fill
          priority
          sizes="100vw"
          placeholder="blur"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-950/90 via-neutral-950/75 to-neutral-900/55" />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-16 md:px-8 md:pb-24 md:pt-24">
        <div className="max-w-2xl">
          <div
            className="hero-reveal inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 py-1.5 pl-2.5 pr-3.5 text-[11.5px] font-medium uppercase tracking-[0.14em] text-white/90 backdrop-blur"
            style={{ animationDelay: "0ms" }}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            {t("eyebrow")}
          </div>

          <h1
            className="hero-reveal mt-5 text-[34px] font-semibold leading-[1.06] tracking-tight text-white sm:text-[46px] md:text-[58px]"
            style={{ animationDelay: "120ms" }}
          >
            {t("headingLine1")}{" "}
            <span className="text-primary">{t("headingAccent")}</span>{" "}
            <span className="text-white/55">{t("headingLine2")}</span>
          </h1>

          <p
            className="hero-reveal mt-5 max-w-xl text-[15px] leading-relaxed text-white/75 md:text-base"
            style={{ animationDelay: "220ms" }}
          >
            {t("subheading")}
          </p>

          <form
            onSubmit={handleSubmit}
            className="hero-reveal mt-7 flex w-full max-w-lg flex-col gap-3 sm:flex-row"
            style={{ animationDelay: "320ms" }}
          >
            <Input
              size="large"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={t("inputPlaceholder")}
              aria-label={t("inputPlaceholder")}
              className="flex-1"
              allowClear
            />
            <Button
              type="primary"
              size="large"
              htmlType="submit"
              className="rounded-full! px-7! font-semibold! sm:w-auto"
            >
              {t("cta")}
            </Button>
          </form>

          <div
            className="hero-reveal mt-6 flex flex-wrap gap-2"
            style={{ animationDelay: "440ms" }}
          >
            {CHIP_KEYS.map((k) => (
              <span
                key={k}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[12.5px] font-medium text-white/85 backdrop-blur"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {t(`chips.${k}`)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
