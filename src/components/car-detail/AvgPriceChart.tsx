"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMnt } from "@/lib/priceHistory";

type Props = {
  /**
   * Comma-separated average auction prices in thousands of yen
   * (e.g. "2085,1718,1747" → ¥2,085,000, ¥1,718,000, …). May be empty.
   */
  avgString: string;
  /** Live JPY → MNT rate (from /config), the same one the bid panel uses. */
  jpyRate: number;
};

const BRAND = "#F1472C";

/** "2085,1718,,x,1747" → [2085000, 1718000, 1747000] (skips blanks / non-numbers). */
function parseAvgString(avgString: string): number[] {
  return avgString
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((n) => Number.isFinite(n) && n > 0)
    .map((n) => n * 1000);
}

/** Round to the nearest `step` (keeps the ₮ figures visually clean). */
const roundTo = (value: number, step: number) =>
  Math.round(value / step) * step;

export default function AvgPriceChart({ avgString, jpyRate }: Props) {
  const t = useTranslations("carDetail.avgPrice");

  const jpyValues = useMemo(() => parseAvgString(avgString), [avgString]);
  // Convert each yen average to MNT with the live rate (₮ = ¥ × jpyRate).
  const chartData = useMemo(
    () => jpyValues.map((jpy, i) => ({ i, mnt: roundTo(jpy * jpyRate, 1000) })),
    [jpyValues, jpyRate],
  );

  // A trend needs at least two points; also skip if the rate is unavailable.
  if (jpyValues.length < 2 || jpyRate <= 0) return null;

  const mean = roundTo(
    chartData.reduce((a, b) => a + b.mnt, 0) / chartData.length,
    1000,
  );

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-100">
            {t("title")}
          </h2>
          <p className="mt-0.5 text-[12px] text-neutral-500 dark:text-neutral-400">
            {t("unit")} · {jpyValues.length}
          </p>
        </div>
        <div className="text-right text-xl font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
          {formatMnt(mean)}
        </div>
      </div>

      <div className="h-32 w-full sm:h-36">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 6, right: 6, bottom: 0, left: 6 }}
          >
            <defs>
              <linearGradient id="avgPriceFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={BRAND} stopOpacity={0.28} />
                <stop offset="100%" stopColor={BRAND} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="i" hide />
            <YAxis
              hide
              domain={([min, max]) => [
                Math.floor(min * 0.96),
                Math.ceil(max * 1.04),
              ]}
            />
            <Tooltip
              cursor={{ stroke: BRAND, strokeWidth: 1, strokeOpacity: 0.4 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const mnt = payload[0].payload.mnt as number;
                return (
                  <div className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-[12px] shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
                    <div className="tabular-nums font-semibold text-neutral-900 dark:text-neutral-100">
                      {formatMnt(mnt)}
                    </div>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="mnt"
              stroke={BRAND}
              strokeWidth={2}
              fill="url(#avgPriceFill)"
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
