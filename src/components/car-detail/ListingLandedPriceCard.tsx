"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { CURRENCY_SUFFIX, formatCostLine } from "./CostBreakdown";
import { cn } from "@/utils";
import type { CostLine, VehicleCostResult } from "@/types/vehicleCost";

type Props = {
  /**
   * What the server priced this listing at, or `null` when its fuel type maps
   * to no excise class — see `@/lib/powertrain`.
   */
  result: VehicleCostResult | null;
  /**
   * Encar's factory (new-car) KRW price. Not a cost component — it is what the
   * same car sold for new in Korea, so it renders as a footnote under the
   * breakdown rather than as a row of it.
   */
  newPriceKrw?: number | null;
};

type Row = {
  key: string;
  label: string;
  value: string;
  /** The same amount in the currency it was quoted in. */
  quote?: string;
  /** How the API arrived at the amount, e.g. "4,500,000₩ × 2.48₮". */
  hint?: string;
};

/**
 * The landed price of a Korean listing — the Encar asking price plus shipping,
 * every Mongolian import tax and the brokerage fee the page asks the
 * calculator to add.
 *
 * The total leads. It is the only price the page shows, so it reads first and
 * the rows under it answer "made up of what?" rather than building up to it.
 *
 * Every figure and label comes from `POST /v1/vehicle-cost/calculate`; nothing
 * is computed here. The MNT rows sum to the total by construction, so the card
 * renders `total` as sent rather than re-adding the rows.
 *
 * The API's per-row hints sit behind one "show the calculation" switch instead
 * of a `?` tooltip per row: most of this traffic is touch, where five separate
 * tooltips are five separate taps. `"use client"` is there for that switch.
 *
 * The page prices the car server-side, so the number is in the first paint and
 * this asks the buyer nothing. It used to make a hybrid pick HEV/PHEV/MHEV
 * before it could quote anything; since the 2026-08-03 ruling put every class
 * but petrol and diesel on one excise grid, there is nothing left to pick.
 *
 * `verification.warnings` is not rendered. Korea has no VIN decoder, so the
 * only warning it ever carried said exactly that — a fact about our tooling,
 * not about this price. Verification belongs in its own section.
 */
export default function KoreaLandedPriceCard({ result, newPriceKrw }: Props) {
  const t = useTranslations("carDetail.koreaLanded");
  const tEncar = useTranslations("carDetail.encar");
  const [showCalculation, setShowCalculation] = useState(false);
  const rowsId = useId();

  const cost = result?.ok ? result.cost : null;
  const rows = cost ? toRows(cost.lines) : [];
  const hasHints = rows.some((row) => row.hint);

  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800">
      {cost ? (
        <>
          <div className="px-5 pb-5 pt-4">
            <h2 className="text-[13px] font-medium text-neutral-500 dark:text-neutral-400">
              {cost.total.label}
            </h2>
            <p className="mt-1.5 text-[34px]/none font-bold text-neutral-950 dark:text-white">
              {new Intl.NumberFormat("mn-MN").format(cost.total.amount)}
              <span className="ml-0.5 font-medium text-neutral-500">
                {CURRENCY_SUFFIX.MNT}
              </span>
            </p>
          </div>

          <div className="bg-neutral-50 px-5 py-4 dark:bg-neutral-900/60">
            <dl id={rowsId} className="space-y-3">
              {rows.map((row) => {
                // One caption slot per row. The origin price always fills it
                // with the won figure; opening the calculation swaps that for
                // the fuller formula and fills the other rows' slots too.
                const caption = (showCalculation && row.hint) || row.quote;

                return (
                  <div
                    key={row.key}
                    className="flex items-baseline justify-between gap-4"
                  >
                    <dt className="min-w-0 text-[14px] text-neutral-700 dark:text-neutral-300">
                      {row.label}
                      {caption && (
                        <span className="mt-0.5 block text-[12px] text-neutral-500 dark:text-neutral-400">
                          {caption}
                        </span>
                      )}
                    </dt>
                    <dd className="shrink-0 text-[14px] font-medium text-neutral-900 dark:text-neutral-100">
                      {row.value}
                    </dd>
                  </div>
                );
              })}
            </dl>

            {hasHints && (
              <button
                type="button"
                onClick={() => setShowCalculation((open) => !open)}
                aria-expanded={showCalculation}
                aria-controls={rowsId}
                className="-mb-1.5 mt-2.5 flex items-center gap-1 rounded py-1.5 text-[13px] font-medium text-neutral-500 transition-colors hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 dark:focus-visible:outline-neutral-100"
              >
                {showCalculation ? t("hideCalculation") : t("showCalculation")}
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                  className={cn(
                    "transition-transform motion-reduce:transition-none",
                    showCalculation && "rotate-180",
                  )}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="p-5">
          <h2 className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-100">
            {t("title")}
          </h2>
          <p
            className={cn(
              "mt-2 text-[13px] leading-relaxed",
              result
                ? "text-amber-600 dark:text-amber-500"
                : "text-neutral-500 dark:text-neutral-400",
            )}
          >
            {failureMessage(result, t)}
          </p>
        </div>
      )}

      {/* The new-car reference price. It sits past a rule of its own so it does
          not read as a row that was added into the total. */}
      {newPriceKrw ? (
        <div className="flex items-baseline justify-between gap-4 border-t border-neutral-200 bg-neutral-50 px-5 py-3 text-[12px] text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-400">
          <span>{tEncar("newPriceLabel")}</span>
          <span className="shrink-0 font-medium">
            {new Intl.NumberFormat("en-US").format(newPriceKrw)}
            {CURRENCY_SUFFIX.KRW}
          </span>
        </div>
      ) : null}
    </section>
  );
}

/**
 * One row per cost. The API states the origin price twice — in won, then again
 * in tugrik under `<code>_MNT` — and that pair folds into a single row: the
 * tugrik amount is the value, like every other row's, and the won figure rides
 * along as its caption.
 */
function toRows(lines: CostLine[]): Row[] {
  const rows: Row[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const restated = lines[i + 1];

    if (line.currency !== "MNT" && restated?.code === `${line.code}_MNT`) {
      rows.push({
        key: line.code,
        label: line.label,
        value: formatCostLine(restated),
        quote: formatCostLine(line),
        hint: restated.hint,
      });
      i++;
      continue;
    }

    rows.push({
      key: line.code,
      label: line.label,
      value: formatCostLine(line),
      hint: line.hint,
    });
  }

  return rows;
}

/** Why there is no price: no excise class to price under, or a §15 refusal. */
function failureMessage(
  result: VehicleCostResult | null,
  t: ReturnType<typeof useTranslations<"carDetail.koreaLanded">>,
): string {
  if (result === null) return t("unknownPowertrain");
  if (result.ok) return "";

  return t.has(`error.${result.code}`)
    ? t(`error.${result.code}`)
    : result.message;
}
