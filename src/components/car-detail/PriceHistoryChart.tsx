"use client";

import { useSyncExternalStore } from "react";
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
  formatMnt,
  formatSaleDate,
  type ComparableSale,
} from "@/lib/priceHistory";
import { withImageSize } from "@/utils/auctionImage";
import { formatMileage } from "@/utils/carFormat";

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

/** Whole-million axis tick, e.g. "31сая" / "31M". */
function compactValue(value: number, locale: string): string {
  const millions = Math.round(value / 1_000_000);
  return locale === "mn" ? `${millions}сая` : `${millions}M`;
}

/**
 * Point label. `compactValue` rounds ₮30.6M and ₮31.4M to the same whole number,
 * which would make ten distinct sales read as one — labels keep one decimal so
 * the differences survive.
 */
function labelValue(value: number, locale: string): string {
  const millions = (value / 1_000_000).toFixed(1);
  return locale === "mn" ? `${millions}сая` : `${millions}M`;
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
 * toComparableSales, in tugrik only.
 *
 * The series is the LANDED price (`PRICE_MNT`, computed server-side from each
 * sale's own hammer price), not the yen figure — the tooltip keeps the
 * Japan-side start/sold prices underneath it as context. The rows are filtered
 * upstream to the viewed car's chassis and rate, so every point is a genuine
 * like-for-like comparable; `specLabel` spells out which grade that is.
 */
export default function PriceHistoryChart({ data, specLabel, locale }: Props) {
  const t = useTranslations("carDetail.priceHistory");
  const tCard = useTranslations("car.card");
  const isDark = useSyncExternalStore(
    subscribeTheme,
    getDarkSnapshot,
    getDarkServerSnapshot,
  );

  const gridColor = isDark ? "#262626" : "#f0f0f0";
  const axisColor = isDark ? "#737373" : "#a3a3a3";

  /**
   * Section heading. Deliberately identical to the one CarEvaluation puts above
   * its section — both are top-level sections of the lot page, so they must read
   * as siblings. Keep the two in step when either changes.
   */
  const heading = (
    <div className="mb-4 lg:mb-5">
      <h2 className="text-[17px] font-semibold tracking-tight text-neutral-900 lg:text-[20px] dark:text-neutral-100">
        {t("title")}
      </h2>
      <p className="mt-1 text-[13px] text-neutral-500 dark:text-neutral-400">
        {specLabel ? `${specLabel} · ${t("subtitle")}` : t("subtitle")}
      </p>
    </div>
  );

  // The sales rows go to recharts as-is: `mnt` is the series key and every
  // other field rides along for the tooltip to read.
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
              tickFormatter={(v: number) => compactValue(v, locale)}
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
                        {row.startMnt != null && (
                          <div className="flex items-baseline justify-between gap-4">
                            <dt className="text-neutral-500 dark:text-neutral-400">
                              {t("colStartPrice")}
                            </dt>
                            <dd className="text-neutral-700 dark:text-neutral-300">
                              {formatMnt(row.startMnt)}
                            </dd>
                          </div>
                        )}
                        {row.hammerMnt != null && (
                          <div className="flex items-baseline justify-between gap-4">
                            <dt className="text-neutral-500 dark:text-neutral-400">
                              {t("colSoldPrice")}
                            </dt>
                            <dd className="text-neutral-700 dark:text-neutral-300">
                              {formatMnt(row.hammerMnt)}
                            </dd>
                          </div>
                        )}
                        <div className="flex items-baseline justify-between gap-4 border-t border-neutral-100 pt-1 dark:border-neutral-800">
                          <dt className="text-neutral-500 dark:text-neutral-400">
                            {t("colLandedPrice")}
                          </dt>
                          <dd className="font-semibold text-primary">
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
              dataKey="mnt"
              stroke={BRAND}
              strokeWidth={2}
              fill="url(#priceFill)"
              dot={{ r: 2.5, fill: BRAND, strokeWidth: 0 }}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            >
              {/* Landed price on every point — the number a bidder is really
                  after, so it should not need a hover to read. Two variants:
                  ten points leave ~27px per label on a phone, which only the
                  whole-million form fits, and far more from `sm` up, where the
                  one-decimal form actually distinguishes the sales. */}
              <LabelList
                dataKey="mnt"
                position="top"
                offset={8}
                className={`${LABEL_CLASS} text-[9px] sm:hidden`}
                formatter={(value) => compactValue(Number(value), locale)}
              />
              <LabelList
                dataKey="mnt"
                position="top"
                offset={8}
                className={`${LABEL_CLASS} hidden text-[10px] sm:block`}
                formatter={(value) => labelValue(Number(value), locale)}
              />
            </Area>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
