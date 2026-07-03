"use client";

import { useState } from "react";
import { Modal } from "antd";
import { useTranslations } from "next-intl";
import { useLandedPrice } from "@/hooks/useLandedPrice";
import { formatMnt } from "@/lib/bidConfig";

type Props = {
  auctionId: string;
  chassis: string;
  engineSize: string;
  year: string;
  rate: string;
  /** Comparable (AVG_PRICE) JPY basis; omit/0 lets the backend estimate. */
  avgPrice?: number;
};

/**
 * "Гар дээр ирэх дундаж үнэ" — the estimated MNT price to land the car in
 * Mongolia (auction + Japan fees + shipping + import taxes). Square tile paired
 * with {@link RateCard}; a help icon opens the breakdown explanation. On the
 * Japan auction page the JPY start price is hidden, so this is the headline
 * number a buyer anchors their bid to.
 */
export default function LandedPriceCard({
  auctionId,
  chassis,
  engineSize,
  year,
  rate,
  avgPrice,
}: Props) {
  const t = useTranslations("carDetail.landed");
  const [open, setOpen] = useState(false);

  const { data: average = 0, isLoading } = useLandedPrice({
    auctionId,
    chassis,
    engineSize,
    year,
    rate,
    price: avgPrice && avgPrice > 0 ? avgPrice : undefined,
  });

  const paragraphs = (t.raw("infoParagraphs") as string[]) ?? [];

  return (
    <div className="flex flex-col justify-between gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/60">
      <div className="flex items-start justify-between gap-1">
        <div className="text-[11px] font-semibold uppercase leading-tight text-neutral-500 dark:text-neutral-400">
          {t("title")}
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t("infoTitle")}
          className="-mr-1 -mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-200/60 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <path d="M12 17h.01" />
          </svg>
        </button>
      </div>

      <div>
        {isLoading ? (
          <div className="h-8 w-28 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
        ) : average > 0 ? (
          <div className="text-[22px] font-extrabold leading-tight tabular-nums text-neutral-900 dark:text-neutral-100">
            {formatMnt(average)}
          </div>
        ) : (
          <div className="text-[15px] font-semibold text-neutral-500 dark:text-neutral-400">
            {t("unknown")}
          </div>
        )}
      </div>

      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => setOpen(false)}
        title={t("infoTitle")}
        okText={t("close")}
        cancelButtonProps={{ style: { display: "none" } }}
        centered
      >
        <div className="flex flex-col gap-3 py-1 text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-300">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </Modal>
    </div>
  );
}
