"use client";

import { useState } from "react";
import { Modal } from "antd";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { MARK_CODES } from "@/lib/auctionMarks";
import { matchHouse } from "@/lib/auctionSheet/match";

type Props = {
  /** The lot's AJES `AUCTION` name — picks which sheet the full guide opens on. */
  auction?: string;
};

/**
 * "Үнэлгээний хуудасны заавар" — the legend that decodes the shorthand marks
 * (A1, W2, S1, XX…) an inspector writes on the auction evaluation sheet. Rendered
 * as a compact button (sitting in the evaluation section header) that opens a
 * modal with the code → meaning grid, so it never competes with the sheet + AI
 * assistant for vertical space.
 */
export default function EvaluationGuide({ auction }: Props) {
  const t = useTranslations("carDetail.evaluationGuide");
  const [open, setOpen] = useState(false);
  // Honda, NAA and the other houses the guide does not draw resolve to nothing;
  // the link then opens the guide on its default sheet.
  const house = matchHouse(auction);

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
        // Auction houses word the same mark slightly differently — the caveat
        // sits in the footer so it stays visible while the list scrolls.
        footer={
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-left text-[12px] leading-relaxed text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
            <span className="font-semibold">{t("noteLabel")}</span> {t("note")}
          </p>
        }
        title={t("title")}
        centered
        width={760}
        styles={{ body: { maxHeight: "70vh", overflowY: "auto" } }}
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <p className="text-[13px] text-neutral-500 dark:text-neutral-400">
            {t("subtitle")}
          </p>
          {/* The marks are only the diagram; the page explains the whole form. */}
          <Link
            href={house ? `/auction-sheet?auction=${house}` : "/auction-sheet"}
            className="inline-flex shrink-0 items-center gap-1 text-[13px] font-semibold text-primary hover:underline"
          >
            {t("fullGuide")}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
        <ul className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          {MARK_CODES.map((code) => (
            <li key={code} className="flex items-start gap-2.5">
              <span className="inline-flex min-w-9 shrink-0 justify-center rounded-md bg-neutral-900 px-1.5 py-1 text-[14px] font-bold text-white dark:bg-neutral-700">
                {code}
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
                  {t(`marks.${code}.title`)}
                </span>
                <span className="mt-0.5 block text-[12px] leading-snug text-neutral-500 dark:text-neutral-400">
                  {t(`marks.${code}.description`)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </Modal>
    </>
  );
}
