"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * "Хямдрал дуусахад 6 өдөр 11:24:03" — the promo deadline from
 * `reportPricing().endsAt`, ticking.
 *
 * Renders nothing until the first client tick. The server has no business
 * rendering a clock (it would hydrate as already-stale and, on a cached page,
 * as flatly wrong), and returning `null` on the first paint keeps server and
 * client markup identical. When the deadline passes this disappears on its own;
 * the price itself only reverts on the next server render, which is fine —
 * `getConfig` is an hour-cached read and the backend stays authoritative.
 */
export default function ReportSaleCountdown({ endsAt }: { endsAt: string }) {
  const t = useTranslations("reportPrice");
  const [msLeft, setMsLeft] = useState<number | null>(null);

  useEffect(() => {
    const end = new Date(endsAt).getTime();
    if (Number.isNaN(end)) return;

    const tick = () => setMsLeft(Math.max(0, end - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  if (msLeft === null || msLeft <= 0) return null;

  const days = Math.floor(msLeft / 86_400_000);
  const clock = [
    Math.floor(msLeft / 3_600_000) % 24,
    Math.floor(msLeft / 60_000) % 60,
    Math.floor(msLeft / 1_000) % 60,
  ]
    .map(pad)
    .join(":");

  return (
    <p className="text-[12px] text-neutral-600 dark:text-neutral-400">
      {t("countdownLabel")}{" "}
      <span className="font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
        {days > 0 ? `${t("countdownDays", { days })} ` : ""}
        {clock}
      </span>
    </p>
  );
}
