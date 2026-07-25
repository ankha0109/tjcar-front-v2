"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { parseJapanAuctionDate } from "@/utils/auctionTime";

type Props = {
  /** Auction start datetime string in Japan time (GMT+9). */
  auctionDate: string;
  /**
   * "boxes" (default) renders the prominent 4-segment timer; "inline" renders a
   * compact, muted single-line countdown for tight spots like a card header.
   */
  variant?: "boxes" | "inline";
};

type Remaining = { days: number; hours: number; mins: number; secs: number };

function diff(target: number, now: number): Remaining | null {
  const ms = target - now;
  if (ms <= 0) return null;
  const total = Math.floor(ms / 1000);
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    mins: Math.floor((total % 3600) / 60),
    secs: total % 60,
  };
}

/**
 * Live countdown to the auction start ("Дуудлага худалдаа эхлэхэд"). The raw
 * AUCTION_DATE is Japan time (GMT+9); {@link parseJapanAuctionDate} anchors it so
 * the countdown is correct for any viewer. The scheduled instant itself is shown
 * by {@link AuctionSchedule} (Japan + Ulaanbaatar clocks). Client-only ticking
 * (state stays null until mount) keeps server and first client render in
 * agreement — no hydration mismatch.
 */
export default function AuctionCountdown({
  auctionDate,
  variant = "boxes",
}: Props) {
  const t = useTranslations("carDetail.countdown");
  const target = parseJapanAuctionDate(auctionDate);
  const [remaining, setRemaining] = useState<Remaining | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!target) return;
    const targetMs = target.getTime();
    const update = () => setRemaining(diff(targetMs, Date.now()));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auctionDate]);

  // Compact, understated single line — used in the bid card header on desktop.
  if (variant === "inline") {
    const cls =
      "inline-flex items-center gap-1.5 text-[12px] font-medium text-neutral-500 dark:text-neutral-400";
    if (!target) return <span className={cls}>{t("unknown")}</span>;
    if (mounted && !remaining) return <span className={cls}>{t("started")}</span>;
    return (
      <span className={cls}>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0"
          aria-hidden
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
        {mounted && remaining ? (
          <span className="tabular-nums">
            {remaining.days > 0 ? `${remaining.days} ${t("days")} ` : ""}
            {String(remaining.hours).padStart(2, "0")}:
            {String(remaining.mins).padStart(2, "0")}:
            {String(remaining.secs).padStart(2, "0")}
          </span>
        ) : (
          <span
            className="inline-block h-3.5 w-20 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700"
            aria-hidden
          />
        )}
      </span>
    );
  }

  const label = (
    <div className="text-[11px] font-semibold uppercase text-neutral-500 dark:text-neutral-400">
      {t("label")}
    </div>
  );

  // Time not scheduled, or the auction has already started/passed.
  if (!target || (mounted && !remaining)) {
    return (
      <div className="flex flex-col gap-1">
        {label}
        <div className="text-[15px] font-semibold text-neutral-500 dark:text-neutral-400">
          {!target ? t("unknown") : t("started")}
        </div>
      </div>
    );
  }

  const segs: Array<{ value: number; unit: string }> = remaining
    ? [
        { value: remaining.days, unit: t("days") },
        { value: remaining.hours, unit: t("hours") },
        { value: remaining.mins, unit: t("mins") },
        { value: remaining.secs, unit: t("secs") },
      ]
    : [];

  return (
    <div className="flex flex-col gap-1.5">
      {label}
      {mounted ? (
        <div className="flex w-full items-stretch gap-2">
          {segs.map((s) => (
            <div
              key={s.unit}
              className="flex flex-1 flex-col items-center rounded-lg bg-neutral-900 px-1 py-2 dark:bg-neutral-800"
            >
              <span className="text-xl font-bold leading-none tabular-nums text-white">
                {String(s.value).padStart(2, "0")}
              </span>
              <span className="mt-1 text-[9px] font-medium uppercase tracking-wide text-neutral-400">
                {s.unit}
              </span>
            </div>
          ))}
        </div>
      ) : (
        // Pre-mount placeholder keeps layout stable before the timer starts.
        <div className="h-[54px] w-full animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800" />
      )}
    </div>
  );
}
