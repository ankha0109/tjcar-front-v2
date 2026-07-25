"use client";

import { useState } from "react";
import { Modal } from "antd";
import { useTranslations } from "next-intl";
import { cn } from "@/utils";

type Props = {
  /** Overall inspection grade (e.g. "S", "5", "4.5", "R"). */
  rate: string;
  /** Localized "RATE" label. */
  label: string;
};

/**
 * Overall auction grades, best → worst, shown in the info modal legend.
 * `key` is the (dot-free) message key — next-intl forbids "." in keys — while
 * `code` is what the badge displays and how the current RATE is matched.
 */
const RATE_GRADES = [
  { code: "S", key: "S" },
  { code: "6", key: "6" },
  { code: "5", key: "5" },
  { code: "4.5", key: "4_5" },
  { code: "4", key: "4" },
  { code: "3.5", key: "3_5" },
  { code: "3", key: "3" },
  { code: "2", key: "2" },
  { code: "R", key: "R" },
  { code: "RA", key: "RA" },
] as const;

/**
 * Standalone square card for the auction inspection grade (RATE) — the single
 * most important quality signal, so it gets its own tile. `R`/`RA` (accident or
 * repair history) reads red; everything else reads emerald. An info button opens
 * a modal legend that decodes every grade.
 */
export default function RateCard({ rate, label }: Props) {
  const t = useTranslations("carDetail.rateInfo");
  const [open, setOpen] = useState(false);

  const value = rate?.trim() || "-";
  const current = value.toUpperCase();
  const isRepaired = current === "R" || current === "RA";
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <path d="M12 17h.01" />
          </svg>
        </button>
      </div>

      <div
        className={cn(
          "text-[22px] font-extrabold leading-tight tabular-nums",
          isRepaired
            ? "text-red-600 dark:text-red-500"
            : "text-emerald-600 dark:text-emerald-400",
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
          {RATE_GRADES.map(({ code, key }) => {
            const active = current === code.toUpperCase();
            const repaired = code === "R" || code === "RA";
            return (
              <li
                key={key}
                className={cn(
                  "flex items-start gap-2.5 rounded-lg px-2 py-1.5",
                  active && "bg-emerald-50 dark:bg-emerald-500/10",
                )}
              >
                <span
                  className={cn(
                    "mt-px inline-flex min-w-9 justify-center rounded-md px-1.5 py-0.5 text-[12px] font-bold tabular-nums text-white",
                    repaired
                      ? "bg-red-600 dark:bg-red-600"
                      : "bg-neutral-900 dark:bg-neutral-700",
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
