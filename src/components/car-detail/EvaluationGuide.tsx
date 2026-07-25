"use client";

import { useState } from "react";
import { Modal } from "antd";
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
 * (A1, W2, S1, XX…) an inspector writes on the auction evaluation sheet. Rendered
 * as a compact button (sitting in the evaluation section header) that opens a
 * modal with the code → meaning grid, so it never competes with the sheet + AI
 * assistant for vertical space.
 */
export default function EvaluationGuide() {
  const t = useTranslations("carDetail.evaluationGuide");
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-1.5 text-[12px] font-medium text-neutral-600 transition hover:bg-neutral-50 hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0"
          aria-hidden
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
        {t("title")}
      </button>

      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        title={t("title")}
        centered
      >
        <p className="mb-4 text-[13px] text-neutral-500 dark:text-neutral-400">
          {t("subtitle")}
        </p>
        <ul className="grid grid-cols-1 gap-x-4 gap-y-2.5 sm:grid-cols-2">
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
      </Modal>
    </>
  );
}
