"use client";

import { useState } from "react";
import { Modal } from "antd";
import { useTranslations } from "next-intl";
import PriceTile from "./PriceTile";

type Props = {
  /** Landed MNT price from `GET /japan/{id}` (`PRICE_MNT`); null when unpriceable. */
  priceMnt?: number | null;
};

/**
 * "Гар дээр ирэх дундаж үнэ" — the estimated MNT price to land the car in
 * Mongolia (auction + Japan fees + shipping + import taxes). {@link PriceTile}
 * paired with {@link RateCard}; a help icon opens the breakdown explanation. On
 * the Japan auction page the JPY start price is hidden, so this is the headline
 * number a buyer anchors their bid to. `/garage/{id}` prints its asking price
 * through the same tile, so the two pages cannot drift apart.
 *
 * The figure arrives with the lot payload. It used to be fetched here with
 * `POST /calculator`, which put a spinner on the page's headline number and
 * cost a ~300ms upstream lookup after paint; the API computes it on the same
 * basis now, so the value is unchanged and the request is gone.
 */
export default function LandedPriceCard({ priceMnt }: Props) {
  const t = useTranslations("carDetail.landed");
  const [open, setOpen] = useState(false);

  const average = priceMnt ?? 0;

  const paragraphs = (t.raw("infoParagraphs") as string[]) ?? [];

  return (
    <PriceTile
      label={t("title")}
      action={
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t("infoTitle")}
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
      }
      amount={average > 0 ? average : null}
      fallback={t("unknown")}
    >
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
    </PriceTile>
  );
}
