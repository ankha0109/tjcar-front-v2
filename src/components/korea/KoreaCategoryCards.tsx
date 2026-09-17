"use client";

import type { SVGProps } from "react";
import { useTranslations } from "next-intl";
import type { KoreaCategory } from "@/types/korea";
import { cn } from "@/utils";

/*
 * Side-profile glyphs on a shared 32×20 grid, both facing right with the
 * wheels on the same axle line, so the pair reads as one set. Duotone like
 * `CarSpecIcons`: a 14 % `currentColor` fill behind the stroke.
 */
const glyph = {
  viewBox: "0 0 32 20",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

function SedanGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...glyph} {...props}>
      {/* The fill stops at the wheel arches so it never shows inside a wheel. */}
      <path
        d="M3 14.25V12.2C3 11.5 3.5 10.9 4.2 10.7L7.6 9.8L10.9 6.2C11.4 5.7 12 5.4 12.7 5.4H18.6C19.3 5.4 20 5.7 20.4 6.3L23.1 9.8L27.6 10.6C28.4 10.8 29 11.5 29 12.3V14.25H25.8A2.9 2.9 0 0 0 20.2 14.25H11.8A2.9 2.9 0 0 0 6.2 14.25Z"
        fill="currentColor"
        stroke="none"
        opacity="0.14"
      />
      <path d="M6.2 15H4C3.45 15 3 14.55 3 14V12.2C3 11.5 3.5 10.9 4.2 10.7L7.6 9.8L10.9 6.2C11.4 5.7 12 5.4 12.7 5.4H18.6C19.3 5.4 20 5.7 20.4 6.3L23.1 9.8L27.6 10.6C28.4 10.8 29 11.5 29 12.3V14C29 14.55 28.55 15 28 15H25.8" />
      <path d="M11.8 15H20.2" />
      <path d="M7.6 9.8H23.1" />
      <path d="M15.6 5.4V9.8" />
      <circle cx="9" cy="15" r="2.3" />
      <circle cx="23" cy="15" r="2.3" />
    </svg>
  );
}

function TruckGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...glyph} {...props}>
      <rect
        x="2.5"
        y="2.5"
        width="17"
        height="8.5"
        rx="1"
        fill="currentColor"
        stroke="none"
        opacity="0.14"
      />
      <rect x="2.5" y="2.5" width="17" height="8.5" rx="1" />
      <path d="M20.5 13V6.5C20.5 5.95 20.95 5.5 21.5 5.5H25C25.5 5.5 25.95 5.75 26.2 6.2L28.8 10.4C28.93 10.6 29 10.85 29 11.1V14C29 14.55 28.55 15 28 15H26.3" />
      <path d="M2.5 15H4.2" />
      <path d="M9.8 15H21.2" />
      <path d="M22.5 7.5H24.6L26.3 10.3H22.5Z" />
      <circle cx="7" cy="15" r="2.3" />
      <circle cx="23.5" cy="15" r="2.3" />
    </svg>
  );
}

const CATEGORIES = [
  { value: "car", labelKey: "categoryCar", Glyph: SedanGlyph },
  { value: "truck", labelKey: "categoryTruck", Glyph: TruckGlyph },
] as const satisfies readonly {
  value: KoreaCategory;
  labelKey: string;
  Glyph: (p: SVGProps<SVGSVGElement>) => React.ReactNode;
}[];

/**
 * The car/truck switch as two icon cards instead of a select: the category
 * decides which catalogue — and which other filters — the panel shows, so it
 * has to read at a glance. Icon over label in the desktop sidebar; icon beside
 * label below `lg`, where it sits above the pill row and every pixel of height
 * pushes the results down.
 */
export default function KoreaCategoryCards({
  value,
  onChange,
}: {
  value: KoreaCategory;
  onChange: (next: KoreaCategory) => void;
}) {
  const tk = useTranslations("korea.filters");

  return (
    <div
      role="group"
      aria-label={tk("category")}
      className="grid grid-cols-2 gap-2"
    >
      {CATEGORIES.map(({ value: v, labelKey, Glyph }) => {
        const active = v === value;
        return (
          <button
            key={v}
            type="button"
            aria-pressed={active}
            // Re-picking the current category would still wipe make/model.
            onClick={() => !active && onChange(v)}
            className={cn(
              "flex min-w-0 items-center justify-center gap-2 rounded-xl border px-2 py-2.5 text-[13px] font-medium transition-colors lg:flex-col lg:gap-1.5 lg:py-3",
              // An outline, not a ring — the ring already draws the selected border.
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
              active
                ? "border-primary bg-primary/5 text-primary ring-1 ring-inset ring-primary dark:bg-primary/10"
                : "border-neutral-200 bg-white text-neutral-600 pointer-fine:hover:border-neutral-300 pointer-fine:hover:text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:pointer-fine:hover:border-neutral-600 dark:pointer-fine:hover:text-neutral-100",
            )}
          >
            <Glyph className="h-5 w-8 shrink-0 lg:h-6 lg:w-9.5" />
            <span className="truncate">{tk(labelKey)}</span>
          </button>
        );
      })}
    </div>
  );
}
