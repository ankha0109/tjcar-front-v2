"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

/**
 * Inspection-sheet mark codes, in the order the Japanese auction sheets use
 * them. Descriptions are localized under `carDetail.evaluationGuide.marks.*`.
 */
const MARK_CODES = [
  "A1", "A2", "A3",
  "E1", "E2", "E3",
  "U1", "U2", "U3",
  "W1", "W2", "W3",
  "S1", "S2",
  "C1", "C2",
  "P", "H", "XX",
  "B1", "B2", "B3",
  "Y1", "Y2", "Y3",
  "X1", "R", "RX", "G",
] as const;

/**
 * "Үнэлгээний хуудасны заавар" — the legend that decodes the shorthand marks
 * (A1, W2, S1, XX…) an inspector writes on the auction evaluation sheet. Notes
 * on the sheet are decisive when reading a lot, so this collapses by default and
 * expands into a scannable code → meaning grid.
 */
export default function EvaluationGuide() {
  const t = useTranslations("carDetail.evaluationGuide");
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="flex flex-col">
          <span className="text-[14px] font-semibold text-neutral-900 dark:text-neutral-100">
            {t("title")}
          </span>
          <span className="text-[12px] text-neutral-500 dark:text-neutral-400">
            {t("subtitle")}
          </span>
        </span>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul className="grid grid-cols-1 gap-x-4 gap-y-2.5 border-t border-neutral-100 px-4 py-4 sm:grid-cols-2 lg:grid-cols-3 dark:border-neutral-800">
          {MARK_CODES.map((code) => (
            <li key={code} className="flex items-start gap-2.5">
              <span className="mt-px inline-flex min-w-[30px] justify-center rounded-md bg-neutral-900 px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-white dark:bg-neutral-700">
                {code}
              </span>
              <span className="text-[12.5px] leading-snug text-neutral-600 dark:text-neutral-300">
                {t(`marks.${code}`)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
