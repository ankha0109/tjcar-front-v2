"use client";

import { Typography } from "antd";
import { useTranslations } from "next-intl";
import AuctionSchedule, { type AuctionScheduleTimes } from "./AuctionSchedule";

type Props = {
  /** Japan + Ulaanbaatar clocks for the lot's AUCTION_DATE, formatted server-side. */
  schedule: AuctionScheduleTimes | null;
  /** Auction house / venue (AUCTION). */
  auctionLocation: string;
  /** Location town/region (TOWN) — often empty; shown only when present. */
  town?: string;
  /** Lot number (LOT). */
  lot: string;
};

/**
 * Everything you need to know about the SALE rather than the car: both clocks,
 * then venue, lot number and town. Grouped away from the car specs because
 * these describe the auction, and shared by the bid panel (upcoming lots) and
 * the result panel (finished ones) so one lot reads the same either side of the
 * hammer. Always visible, even to guests.
 */
export default function AuctionMeta({
  schedule,
  auctionLocation,
  town,
  lot,
}: Props) {
  const tSpecs = useTranslations("carDetail.specs");

  return (
    <div className="flex flex-col gap-3">
      <AuctionSchedule schedule={schedule} />
      {/* Same label/value recipe as the quick specs above: 11px uppercase
          label, 13px semibold value, gap-0 + leading-normal, value truncates. */}
      <dl className="grid grid-cols-2 gap-x-3 gap-y-4">
        <div className="flex min-w-0 flex-col gap-0 leading-normal">
          <dt className="text-[11px] font-medium uppercase text-neutral-400 dark:text-neutral-500">
            {tSpecs("auction")}
          </dt>
          <dd className="truncate text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
            {auctionLocation || "-"}
          </dd>
        </div>
        <div className="flex min-w-0 flex-col gap-0 leading-normal">
          <dt className="text-[11px] font-medium uppercase text-neutral-400 dark:text-neutral-500">
            {tSpecs("lot")}
          </dt>
          <dd className="flex items-center gap-1 text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
            <span className="truncate">{lot || "-"}</span>
            {/* Bare antd copy control — the number keeps its own typography and
                only the button comes from antd. Its tooltip ("Хуулбарлах" /
                "Хуулсан") ships with the ConfigProvider locale, so mn/en/ru all
                read correctly without extra message keys. */}
            {lot ? <Typography.Text copyable={{ text: lot }} /> : null}
          </dd>
        </div>
        {town && (
          <div className="flex min-w-0 flex-col gap-0 leading-normal">
            <dt className="text-[11px] font-medium uppercase text-neutral-400 dark:text-neutral-500">
              {tSpecs("location")}
            </dt>
            <dd className="truncate text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
              {town}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}
