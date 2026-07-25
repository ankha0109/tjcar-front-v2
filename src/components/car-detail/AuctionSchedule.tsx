"use client";

import { useTranslations } from "next-intl";
import type { ZonedAuctionTime } from "@/utils/auctionTime";

export type AuctionScheduleTimes = {
  japan: ZonedAuctionTime;
  ulaanbaatar: ZonedAuctionTime;
};

type Props = {
  /** Both clocks, formatted by `auctionSchedule`. Null = not scheduled yet. */
  schedule: AuctionScheduleTimes | null;
};

/**
 * The auction start instant shown on both clocks side by side: the auction
 * house's own Japan time (GMT+9, what the raw AUCTION_DATE is in) and the
 * Ulaanbaatar time the bidder actually plans around (GMT+8 — always Japan − 1h).
 * Each column carries its own date, because a late-evening Japan slot falls on
 * the previous day in Ulaanbaatar.
 */
export default function AuctionSchedule({ schedule }: Props) {
  const t = useTranslations("carDetail.schedule");

  if (!schedule) {
    return (
      <div className="text-[13px] text-neutral-500 dark:text-neutral-400">
        {t("title")}: {t("notSet")}
      </div>
    );
  }

  const zones: Array<{
    label: string;
    value: ZonedAuctionTime;
    local: boolean;
  }> = [
    { label: t("japan"), value: schedule.japan, local: false },
    { label: t("ulaanbaatar"), value: schedule.ulaanbaatar, local: true },
  ];

  return (
    // No section title: the two zone labels already say what the times are,
    // and the block sits directly under the panel heading + countdown.
    <div className="grid grid-cols-2">
      {zones.map((zone) => (
        <div
          key={zone.label}
          // A single hairline between the two clocks — no card, no fill.
          // Label/value stacking follows the quick-spec recipe: gap-0 with
          // leading-normal, so every label sits the same distance above its
          // value across the whole bid panel.
          className={`flex min-w-0 flex-col gap-0 leading-normal ${
            zone.local
              ? "border-l border-neutral-200 pl-3 dark:border-neutral-800"
              : "pr-3"
          }`}
        >
          <span
            className={`truncate text-[11px] font-medium uppercase ${
              // The local clock keeps the brand accent — it is the one a
              // bidder plans around; otherwise the muted quick-spec grey.
              zone.local
                ? "text-primary"
                : "text-neutral-400 dark:text-neutral-500"
            }`}
          >
            {zone.label}
          </span>
          {/* One "2026/07/25 07:08" line, kept at the panel's headline size —
                the auction start is the number the page is built around. */}
          <span className="truncate text-[18px] font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
            {zone.value.date} {zone.value.time}
          </span>
        </div>
      ))}
    </div>
  );
}
