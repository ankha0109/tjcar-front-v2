"use client";

import { useState } from "react";
import { Modal } from "antd";
import { useTranslations } from "next-intl";
import { cn } from "@/utils";
import { getGradeInfo, type GradeTier } from "@/utils/auctionGrade";

type Props = {
  /** Overall inspection grade (e.g. "S", "5", "4.5", "R"). */
  rate: string;
  /** Localized "RATE" label. */
  label: string;
};

/**
 * Overall auction grades, best → worst, shown in the info modal legend.
 * `key` is the (dot-free) message key — next-intl forbids "." in keys — while
 * `code` is what the badge displays. `matches` lists every raw RATE the row
 * stands for, which is how the current lot's grade is highlighted: the houses
 * spell the same verdict several ways (`RB`/`RC` are still repair history,
 * `99`/`X`/`***` are all "grounded").
 */
const RATE_GRADES = [
  { code: "S", key: "S", matches: ["S"] },
  { code: "6", key: "6", matches: ["6"] },
  { code: "5", key: "5", matches: ["5"] },
  { code: "4.5", key: "4_5", matches: ["4.5"] },
  { code: "4", key: "4", matches: ["4"] },
  { code: "3.5", key: "3_5", matches: ["3.5"] },
  { code: "3", key: "3", matches: ["3"] },
  { code: "2", key: "2", matches: ["2"] },
  { code: "1", key: "1", matches: ["1"] },
  { code: "RA", key: "RA", matches: ["RA"] },
  { code: "R", key: "R", matches: ["R", "RB", "RC", "R1", "R2", "R?", "A"] },
  {
    code: "99",
    key: "grounded",
    matches: ["99", "X", "XX", "0", "*", "**", "***"],
  },
] as const;

/** Legend badge fill per tier — the key to the colours the card itself uses. */
const LEGEND_BADGE: Record<GradeTier, string> = {
  pristine: "bg-emerald-600",
  good: "bg-emerald-600",
  average: "bg-amber-500",
  poor: "bg-rose-500",
  repaired: "bg-orange-500",
  damaged: "bg-red-600",
  unknown: "bg-neutral-400",
};

/**
 * Standalone square card for the auction inspection grade (RATE) — the single
 * most important quality signal, so it gets its own tile. The colour comes from
 * {@link getGradeInfo}, the same helper the list badges use, so one lot never
 * reads emerald here and black on the card it came from. An info button opens a
 * modal legend that decodes every grade.
 */
export default function RateCard({ rate, label }: Props) {
  const t = useTranslations("carDetail.rateInfo");
  const [open, setOpen] = useState(false);

  const value = rate?.trim() || "-";
  const current = value.toUpperCase();
  const info = getGradeInfo(value);
  const grades = t.raw("grades") as Record<string, string>;

  return (
    <div className="flex flex-col justify-between gap-2 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-start justify-between gap-1">
        <div className="text-[11px] font-semibold uppercase text-neutral-500 dark:text-neutral-400">
          {label}
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t("title")}
          className="-mr-1 -mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-200/60 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <path d="M12 17h.01" />
          </svg>
        </button>
      </div>

      <div
        className={cn(
          "text-[22px] font-extrabold leading-tight",
          info?.classes.text ?? "text-neutral-500 dark:text-neutral-400",
        )}
      >
        {value}
      </div>

      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        title={t("title")}
        centered
      >
        <p className="mb-4 text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-300">
          {t("intro")}
        </p>
        <ul className="flex flex-col gap-1.5">
          {RATE_GRADES.map(({ code, key, matches }) => {
            const active = (matches as readonly string[]).includes(current);
            const tier = getGradeInfo(code)?.tier ?? "unknown";
            return (
              <li
                key={key}
                className={cn(
                  "flex items-start gap-2.5 rounded-lg px-2 py-1.5",
                  // Neutral, never emerald: the highlighted row is just as often
                  // the worst grade on the list as the best one.
                  active &&
                    "bg-neutral-100 ring-1 ring-neutral-300 dark:bg-neutral-800 dark:ring-neutral-600",
                )}
              >
                <span
                  className={cn(
                    "mt-px inline-flex min-w-9 justify-center rounded-md px-1.5 py-0.5 text-[12px] font-bold text-white",
                    LEGEND_BADGE[tier],
                  )}
                >
                  {code}
                </span>
                <span className="text-[12.5px] leading-snug text-neutral-600 dark:text-neutral-300">
                  {grades[key]}
                </span>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 text-[12px] leading-relaxed text-neutral-400 dark:text-neutral-500">
          {t("note")}
        </p>
      </Modal>
    </div>
  );
}
