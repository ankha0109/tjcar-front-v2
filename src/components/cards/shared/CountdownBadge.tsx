"use client";

import { useTranslations } from "next-intl";
import { Tooltip } from "antd";
import type { CarSource } from "@/types/car";
import {
  formatAuctionTime,
  formatCountdownLabel,
  type Countdown,
} from "@/utils/carCountdown";
import { cn } from "@/utils";

type Props = {
  countdown: Countdown;
  /** Pass auction.date + car.source to enable tooltip with full GMT+8 time. */
  rawDate?: string;
  source?: CarSource;
  /** Visual size: "sm" for table cells, "md" for cards. */
  size?: "sm" | "md";
};

export function CountdownBadge({
  countdown,
  rawDate,
  source,
  size = "md",
}: Props) {
  const t = useTranslations("car.card");
  if (!countdown) return null;

  const label = formatCountdownLabel(countdown, t);
  const tooltip = rawDate && source ? formatAuctionTime(rawDate, source) : null;
  const urgent = countdown.urgent && !countdown.passed;

  const pill = (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full ring-1",
        size === "sm"
          ? "px-2 py-0.5 text-[11px] font-semibold"
          : "px-2 py-0.5 text-[11px] font-medium",
        urgent
          ? "bg-red-50 text-red-600 ring-red-200 dark:bg-red-900/30 dark:text-red-300 dark:ring-red-800"
          : "bg-neutral-100 text-neutral-600 ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-700",
      )}
    >
      {!countdown.passed && (
        <span className="relative flex h-1.5 w-1.5">
          {urgent && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
          )}
          <span
            className={cn(
              "relative inline-flex h-1.5 w-1.5 rounded-full",
              urgent ? "bg-red-500" : "bg-neutral-400",
            )}
          />
        </span>
      )}
      {label}
    </span>
  );

  if (tooltip) {
    return (
      <Tooltip title={tooltip} placement="top" mouseEnterDelay={0.2}>
        {pill}
      </Tooltip>
    );
  }
  return pill;
}
