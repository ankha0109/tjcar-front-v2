"use client";

import { useTranslations } from "next-intl";
import { ArrowIcon, CheckIcon } from "./authIcons";

type Props = {
  heading: string;
  subheading: string;
  benefits: string[];
};

const AuthBrandPanel = ({ heading, subheading, benefits }: Props) => {
  const th = useTranslations("homeHero");
  const route = [th("route.japan"), th("route.korea"), th("route.mongolia")];

  return (
    <div className="relative hidden flex-col justify-between overflow-hidden bg-neutral-950 p-10 text-neutral-100 lg:flex">
      {/* red glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 15% 0%, rgba(241,71,44,0.35), transparent 60%), radial-gradient(ellipse 80% 60% at 90% 100%, rgba(241,71,44,0.18), transparent 65%)",
        }}
      />
      {/* dotted texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.10) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          maskImage:
            "radial-gradient(ellipse 80% 80% at 50% 30%, #000 30%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 80% at 50% 30%, #000 30%, transparent 75%)",
        }}
      />

      <div className="relative">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 py-1.5 pl-2.5 pr-3.5 text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-200 backdrop-blur">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/70" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
          </span>
          {th("eyebrow")}
          <span className="h-3 w-px bg-white/15" />
          <span className="normal-case tracking-normal text-neutral-400">
            {th("eyebrowSub")}
          </span>
        </div>

        <h2 className="mt-8 max-w-sm text-[34px] font-semibold leading-[1.08] tracking-tight">
          {heading}
        </h2>
        <p className="mt-4 max-w-sm text-[14.5px] leading-relaxed text-neutral-400">
          {subheading}
        </p>

        <ul className="mt-8 space-y-3.5">
          {benefits.map((benefit) => (
            <li
              key={benefit}
              className="flex items-center gap-3 text-[14px] text-neutral-200"
            >
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary ring-1 ring-inset ring-primary/30">
                <CheckIcon className="h-3.5 w-3.5" />
              </span>
              {benefit}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative mt-10">
        {/* shipping route — echoes the hero globe arc */}
        <div className="flex items-center gap-2 text-[12.5px] font-medium text-neutral-300">
          {route.map((place, i) => (
            <span key={place} className="flex items-center gap-2">
              {i > 0 && <ArrowIcon className="h-3.5 w-3.5 text-primary" />}
              <span>{place}</span>
            </span>
          ))}
        </div>
        <div className="mt-5 flex items-center gap-6 border-t border-white/10 pt-5">
          <div>
            <div className="text-[20px] font-bold tabular-nums text-white">
              {th("stats.cars")}
            </div>
            <div className="text-[12px] text-neutral-400">
              {th("stats.carsLabel")}
            </div>
          </div>
          <span className="h-8 w-px bg-white/10" />
          <div>
            <div className="text-[20px] font-bold tabular-nums text-white">
              {th("stats.years")}
            </div>
            <div className="text-[12px] text-neutral-400">
              {th("stats.yearsLabel")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthBrandPanel;
