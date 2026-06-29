"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { Segmented } from "antd";
import { useTranslations } from "next-intl";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/utils";
import { formatJpy, formatMnt, type ComparableSale } from "@/lib/priceHistory";

type Metric = "jpy" | "mnt";

type Props = {
  data: ComparableSale[];
  specLabel: string;
  locale: string;
};

const BRAND = "#F1472C";

/** Read the app's dark-mode flag (`data-theme="dark"`) and track live changes. */
function subscribeTheme(onChange: () => void): () => void {
  const obs = new MutationObserver(onChange);
  obs.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => obs.disconnect();
}
const getDarkSnapshot = () =>
  document.documentElement.dataset.theme === "dark";
const getDarkServerSnapshot = () => false;

/** Parse a date-only ISO string at UTC noon (avoids timezone day shifts). */
function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1, 12));
}

/** Short axis label, e.g. "6/20". */
function shortDate(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${m}/${d}`;
}

/** Full label, e.g. "6 сарын 10" (mn) / "Jun 10" (en) / "10 июн." (ru). */
function longDate(iso: string, locale: string): string {
  const [, m, d] = iso.split("-").map(Number);
  if (locale === "mn") return `${m} сарын ${d}`;
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(parseIsoDate(iso));
}

/** Compact axis tick for the active metric. */
function compactValue(value: number, metric: Metric, locale: string): string {
  if (metric === "jpy") {
    return value >= 1_000_000
      ? `¥${(value / 1_000_000).toFixed(1)}M`
      : `¥${Math.round(value / 1_000)}k`;
  }
  const millions = value / 1_000_000;
  return locale === "mn"
    ? `${Math.round(millions)}сая`
    : `${Math.round(millions)}M`;
}

export default function PriceHistoryChart({ data, specLabel, locale }: Props) {
  const t = useTranslations("carDetail.priceHistory");
  const [metric, setMetric] = useState<Metric>("jpy");
  const isDark = useSyncExternalStore(
    subscribeTheme,
    getDarkSnapshot,
    getDarkServerSnapshot,
  );

  const gridColor = isDark ? "#262626" : "#f0f0f0";
  const axisColor = isDark ? "#737373" : "#a3a3a3";

  const chartData = useMemo(
    () =>
      data.map((s) => ({
        date: s.date,
        jpy: s.jpy,
        mnt: s.mnt,
      })),
    [data],
  );

  if (!data.length) {
    return (
      <section className="mt-6 px-4 lg:px-0">
        <h2 className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-100">
          {t("title")}
        </h2>
        <p className="mt-3 rounded-2xl border border-dashed border-neutral-200 px-4 py-8 text-center text-[13px] text-neutral-400 dark:border-neutral-800">
          {t("noData")}
        </p>
      </section>
    );
  }

  return (
    <section className="mt-6 px-4 lg:px-0">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-100">
              {t("title")}
            </h2>
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
              {t("demoBadge")}
            </span>
          </div>
          <p className="mt-0.5 text-[12px] text-neutral-500 dark:text-neutral-400">
            {specLabel ? `${specLabel} · ${t("subtitle")}` : t("subtitle")}
          </p>
        </div>
        <Segmented<Metric>
          size="small"
          value={metric}
          onChange={(v) => setMetric(v)}
          options={[
            { label: t("jpy"), value: "jpy" },
            { label: t("mnt"), value: "mnt" },
          ]}
        />
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="h-64 w-full sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
            >
              <defs>
                <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={BRAND} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={BRAND} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={gridColor}
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickFormatter={shortDate}
                tick={{ fill: axisColor, fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: gridColor }}
                minTickGap={16}
              />
              <YAxis
                width={52}
                tickFormatter={(v: number) => compactValue(v, metric, locale)}
                tick={{ fill: axisColor, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                domain={([min, max]) => [
                  Math.floor(min * 0.96),
                  Math.ceil(max * 1.04),
                ]}
              />
              <Tooltip
                cursor={{ stroke: BRAND, strokeWidth: 1, strokeOpacity: 0.4 }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const row = payload[0].payload as ComparableSale;
                  return (
                    <div className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-[12px] shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
                      <div className="mb-1 font-semibold text-neutral-900 dark:text-neutral-100">
                        {longDate(row.date, locale)}
                      </div>
                      <div className="tabular-nums text-neutral-700 dark:text-neutral-300">
                        {formatJpy(row.jpy)}
                      </div>
                      <div className="tabular-nums text-primary">
                        {formatMnt(row.mnt)}
                      </div>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey={metric}
                stroke={BRAND}
                strokeWidth={2}
                fill="url(#priceFill)"
                dot={{ r: 2.5, fill: BRAND, strokeWidth: 0 }}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Explicit sales list — guarantees the requested "date · ¥ · ₮" format */}
        <div className="mt-3 border-t border-neutral-100 pt-3 dark:border-neutral-800">
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            {t("listTitle")}
          </h3>
          <ul className="max-h-44 space-y-1 overflow-y-auto pr-1">
            {[...data].reverse().map((s, idx) => (
              <li
                key={`${s.date}-${idx}`}
                className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-[12.5px] hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
              >
                <span className="text-neutral-500 dark:text-neutral-400">
                  {longDate(s.date, locale)}
                </span>
                <span className="flex items-center gap-2 tabular-nums">
                  <span
                    className={cn(
                      "font-medium",
                      metric === "jpy"
                        ? "text-neutral-900 dark:text-neutral-100"
                        : "text-neutral-400 dark:text-neutral-500",
                    )}
                  >
                    {formatJpy(s.jpy)}
                  </span>
                  <span aria-hidden className="text-neutral-300 dark:text-neutral-600">
                    |
                  </span>
                  <span
                    className={cn(
                      "font-medium",
                      metric === "mnt"
                        ? "text-primary"
                        : "text-neutral-500 dark:text-neutral-400",
                    )}
                  >
                    {formatMnt(s.mnt)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
