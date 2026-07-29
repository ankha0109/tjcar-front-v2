"use client";

import { useTranslations } from "next-intl";
import { Tooltip } from "antd";
import type { AuctionMoment } from "@/utils/auctionMoment";
import { cn } from "@/utils";

type Props = {
  moment: AuctionMoment | null;
  /** Visual size: "sm" for table cells, "md" for cards. */
  size?: "sm" | "md";
};

const NEUTRAL =
  "bg-neutral-100 text-neutral-600 ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-700";

/**
 * Only a lot about to run is live, so only it gets red and the pulsing dot.
 * Everything else — tomorrow, next week, already run — is the same neutral
 * pill; a dimmed "past" variant only read as a rendering glitch.
 */
const TONE: Record<AuctionMoment["kind"], string> = {
  live: "bg-red-50 text-red-600 ring-red-200 dark:bg-red-900/30 dark:text-red-300 dark:ring-red-800",
  upcoming: NEUTRAL,
  past: NEUTRAL,
};

/** Stand-in for the AJES "00:00:00" slots, so every pill reads `MM/DD HH:mm`. */
const TIME_UNKNOWN = "--:--";

export function CountdownBadge({ moment, size = "md" }: Props) {
  const t = useTranslations("car.card");
  if (!moment) return null;

  const isLive = moment.kind === "live";
  const day = isLive ? t("live") : moment.dateLabel;

  const pill = (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full ring-1",
        size === "sm"
          ? "px-2 py-0.5 text-[11px] font-semibold"
          : "px-2 py-0.5 text-[11px] font-medium",
        TONE[moment.kind],
      )}
    >
      {isLive && (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
        </span>
      )}
      <span className="truncate">
        {day}
        <span className="ml-1 font-semibold">
          {moment.timeLabel ?? TIME_UNKNOWN}
        </span>
      </span>
    </span>
  );

  return (
    <Tooltip
      title={moment.timeLabel ? moment.fullLabel : t("timeTba")}
      placement="top"
      mouseEnterDelay={0.2}
    >
      {pill}
    </Tooltip>
  );
}
