"use client";

import { useState, useSyncExternalStore } from "react";
import { Segmented } from "antd";
import { useTranslations } from "next-intl";
import {
  Area,
  AreaChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  formatJpy,
  formatMnt,
  formatSaleDate,
  type ComparableSale,
} from "@/lib/priceHistory";
import { withImageSize } from "@/utils/auctionImage";
import { formatMileage } from "@/utils/carFormat";

/**
 * Which price the chart plots. Not two views of one number: `mnt` is the landed
 * price (Japan fees, shipping and Mongolian duties in), `jpy` the bare hammer
 * price the auction closed at. A bidder bids the second and pays the first.
 */
type Metric = "jpy" | "mnt";

/** Series key per metric — `hammerJpy` may be missing on a row, `mnt` never is. */
const SERIES_KEY: Record<Metric, "hammerJpy" | "mnt"> = {
  jpy: "hammerJpy",
  mnt: "mnt",
};

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
const getDarkSnapshot = () => document.documentElement.dataset.theme === "dark";
const getDarkServerSnapshot = () => false;

/** Short axis label, e.g. "6/20". */
function shortDate(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${m}/${d}`;
}

/** Whole-million axis tick, e.g. "31сая" / "31M" / "¥1.1M" / "¥850k". */
function compactValue(value: number, metric: Metric, locale: string): string {
  if (metric === "jpy") {
    return value >= 1_000_000
      ? `¥${(value / 1_000_000).toFixed(1)}M`
      : `¥${Math.round(value / 1_000)}k`;
  }
  const millions = Math.round(value / 1_000_000);
  return locale === "mn" ? `${millions}сая` : `${millions}M`;
}

/**
 * Point label. `compactValue` rounds ₮30.6M and ₮31.4M to the same whole number,
 * which would make ten distinct sales read as one — labels keep one decimal so
 * the differences survive. Comparable hammer prices sit tens of thousands of yen
 * apart, an order of magnitude finer, so the ¥ form takes a second decimal.
 */
function labelValue(value: number, metric: Metric, locale: string): string {
  if (metric === "jpy") {
    return value >= 1_000_000
      ? `¥${(value / 1_000_000).toFixed(2)}M`
      : `¥${Math.round(value / 1_000)}k`;
  }
  const millions = (value / 1_000_000).toFixed(1);
  return locale === "mn" ? `${millions}сая` : `${millions}M`;
}

/**
 * A Japan-side price in the currency the chart is showing. The yen figure is the
 * auction's own number; the tugrik one is that yen at the live rate, so it drops
 * out when `GET /config` failed and the rate never arrived.
 */
function japanPrice(
  jpy: number | undefined,
  mnt: number | undefined,
  metric: Metric,
): string | undefined {
  if (metric === "jpy") return jpy != null ? formatJpy(jpy) : undefined;
  return mnt != null ? formatMnt(mnt) : undefined;
}

/**
 * Halo so a label stays readable where it lands on top of the price line: the
 * text is stroked with the page background and painted stroke-first.
 */
const LABEL_CLASS =
  "fill-neutral-500 [paint-order:stroke] [stroke-width:3px] [stroke:var(--background)] dark:fill-neutral-400";

/**
 * Comparable sold-car price trend, so a bidder can size up a competitive offer
 * against what recent cars actually cost to land. The whole comparable-prices
 * section — the chart carries the detail per sale in its tooltip, so no
 * companion table. Fed by `GET /japan/history` (AJES `stats`) via
 * toComparableSales.
 *
 * Two series behind a ¥/₮ switch. ₮ (the default) plots the LANDED price
 * (`PRICE_MNT`, computed server-side from each sale's own hammer price) — what a
 * buyer actually pays. ¥ plots the Japan hammer price — what they have to bid to
 * win. Whichever is not plotted stays in the tooltip as context, so no reading
 * is lost by switching. The rows are filtered upstream to the viewed car's
 * chassis and rate, so every point is a genuine like-for-like comparable;
 * `specLabel` spells out which grade that is.
 */
export default function PriceHistoryChart({ data, specLabel, locale }: Props) {
  const t = useTranslations("carDetail.priceHistory");
  const tCard = useTranslations("car.card");
  const [metric, setMetric] = useState<Metric>("mnt");
  const isDark = useSyncExternalStore(
    subscribeTheme,
    getDarkSnapshot,
    getDarkServerSnapshot,
  );

  const gridColor = isDark ? "#262626" : "#f0f0f0";
  const axisColor = isDark ? "#737373" : "#a3a3a3";

  // The upstream leaves FINISH off rows it never priced. With no hammer figure
  // anywhere there is no ¥ series to switch to, so the control hides rather than
  // offering an empty chart.
  const hasJpy = data.some((sale) => sale.hammerJpy != null);
  const isJpy = metric === "jpy";
  const seriesKey = SERIES_KEY[metric];
  const subtitle = isJpy ? t("subtitleJpy") : t("subtitle");

  /**
   * Section heading. Deliberately identical to the one CarEvaluation puts above
   * its section — both are top-level sections of the lot page, so they must read
   * as siblings. Keep the two in step when either changes.
   */
  const heading = (
    <div className="mb-4 flex items-start justify-between gap-3 lg:mb-5">
      <div className="min-w-0">
        <h2 className="text-[17px] font-semibold tracking-tight text-neutral-900 lg:text-[20px] dark:text-neutral-100">
          {t("title")}
        </h2>
        <p className="mt-1 text-[13px] text-neutral-500 dark:text-neutral-400">
          {specLabel ? `${specLabel} · ${subtitle}` : subtitle}
        </p>
      </div>
      {/* Currency switch, top-right of the heading. `shrink-0` so the long mn
          title wraps under it instead of squeezing it. */}
      {hasJpy && (
        <Segmented<Metric>
          size="small"
          className="shrink-0"
          value={metric}
          onChange={setMetric}
          options={[
            { label: t("jpy"), value: "jpy" },
            { label: t("mnt"), value: "mnt" },
          ]}
        />
      )}
    </div>
  );

  // The sales rows go to recharts as-is: the active metric names the series key
  // and every other field rides along for the tooltip to read.
  if (!data.length) {
    return (
      <div>
        {heading}
        <p className="rounded-2xl border border-dashed border-neutral-200 px-4 py-10 text-center text-[13px] text-neutral-400 dark:border-neutral-800">
          {t("noData")}
        </p>
      </div>
    );
  }

  return (
    <div>
      {heading}

      {/* Heights carry the card's own p-4, so the plot itself still gets the
          224/256/288px it had before the padding moved inside. */}
      <div className="h-64 w-full rounded-2xl border border-neutral-200 p-4 sm:h-72 lg:h-80 dark:border-neutral-800">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            /* Headroom on top so the per-point price labels clear the line, and
               on the right so the last one is not sliced by the plot edge. */
            margin={{ top: 22, right: 30, bottom: 0, left: 8 }}
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
            {/* The chart is the whole section now, so the tooltip carries every
                per-sale detail: photo, date, year, mileage, rate and prices. */}
            <Tooltip
              cursor={{ stroke: BRAND, strokeWidth: 1, strokeOpacity: 0.4 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0].payload as ComparableSale;
                // Japan-side figures follow the selected currency; the landed
                // price is a tugrik-native number and stays in ₮ either way.
                const startPrice = japanPrice(
                  row.startJpy,
                  row.startMnt,
                  metric,
                );
                const soldPrice = japanPrice(
                  row.hammerJpy,
                  row.hammerMnt,
                  metric,
                );
                // Fixed width, not `min-w`: a shrink-to-fit box has no width for
                // the `w-full` photo to resolve against, so the image falls back
                // to its intrinsic 640px and drags the tooltip out with it.
                return (
                  <div className="w-56 overflow-hidden rounded-xl border border-neutral-200 bg-white text-[12px] shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
                    {row.image && (
                      // Full-bleed across the tooltip — a thumbnail was too small
                      // to judge the car by. Sized `&w=320` (not the 640px
                      // original, which the upstream provider does not allow us
                      // to serve); still 4:3, so the box crops nothing.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={withImageSize(row.image, "card")}
                        alt=""
                        className="aspect-4/3 w-full object-cover"
                      />
                    )}
                    <div className="p-3">
                      {/* Date + specs on the left, rate pulled into the empty
                          right half where it has room to be read at a glance —
                          it is the first thing a bidder checks. */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                            {formatSaleDate(row.date, locale)}
                          </div>
                          {/* No size of its own — inherits the tooltip's 12px so
                              the year/mileage line reads at the same weight as
                              the prices below it. */}
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-neutral-500 dark:text-neutral-400">
                            {row.year && <span>{row.year}</span>}
                            {/* The "км" suffix labels itself, so no <dt> needed. */}
                            {formatMileage(row.mileageKm, tCard) && (
                              <span>{formatMileage(row.mileageKm, tCard)}</span>
                            )}
                          </div>
                        </div>
                        {row.rate && (
                          <span className="shrink-0 rounded-lg bg-neutral-100 px-2.5 py-1 text-[18px] font-bold leading-none text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100">
                            {row.rate}
                          </span>
                        )}
                      </div>

                      {/* Japan-side prices first as context, then the landed
                          price — the plotted series and the only figure a buyer
                          pays — set apart by its own rule and the brand colour. */}
                      <dl className="mt-2.5 space-y-1 border-t border-neutral-100 pt-2 dark:border-neutral-800">
                        {startPrice && (
                          <div className="flex items-baseline justify-between gap-4">
                            <dt className="text-neutral-500 dark:text-neutral-400">
                              {t("colStartPrice")}
                            </dt>
                            <dd className="text-neutral-700 dark:text-neutral-300">
                              {startPrice}
                            </dd>
                          </div>
                        )}
                        {soldPrice && (
                          <div className="flex items-baseline justify-between gap-4">
                            <dt className="text-neutral-500 dark:text-neutral-400">
                              {t("colSoldPrice")}
                            </dt>
                            {/* Brand colour marks the plotted figure, so it
                                moves to the sold price in ¥ mode and back down
                                to the landed price in ₮ mode. */}
                            <dd
                              className={
                                isJpy
                                  ? "font-semibold text-primary"
                                  : "text-neutral-700 dark:text-neutral-300"
                              }
                            >
                              {soldPrice}
                            </dd>
                          </div>
                        )}
                        <div className="flex items-baseline justify-between gap-4 border-t border-neutral-100 pt-1 dark:border-neutral-800">
                          <dt className="text-neutral-500 dark:text-neutral-400">
                            {t("colLandedPrice")}
                          </dt>
                          <dd
                            className={
                              isJpy
                                ? "text-neutral-700 dark:text-neutral-300"
                                : "font-semibold text-primary"
                            }
                          >
                            {formatMnt(row.mnt)}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey={seriesKey}
              stroke={BRAND}
              strokeWidth={2}
              fill="url(#priceFill)"
              dot={{ r: 2.5, fill: BRAND, strokeWidth: 0 }}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
              /* Only the ¥ series can have holes (a row the upstream priced but
                 left no FINISH on); bridging them keeps one continuous trend
                 instead of a line that breaks apart mid-chart. */
              connectNulls
            >
              {/* The plotted price on every point — the number a bidder is
                  really after, so it should not need a hover to read. Two
                  variants: ten points leave ~27px per label on a phone, which
                  only the coarse form fits, and far more from `sm` up, where the
                  finer one actually distinguishes the sales. */}
              <LabelList
                dataKey={seriesKey}
                position="top"
                offset={8}
                className={`${LABEL_CLASS} text-[9px] sm:hidden`}
                formatter={(value) =>
                  compactValue(Number(value), metric, locale)
                }
              />
              <LabelList
                dataKey={seriesKey}
                position="top"
                offset={8}
                className={`${LABEL_CLASS} hidden text-[10px] sm:block`}
                formatter={(value) => labelValue(Number(value), metric, locale)}
              />
            </Area>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
