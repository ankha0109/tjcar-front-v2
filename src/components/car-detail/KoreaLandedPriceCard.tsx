"use client";

import { useTranslations } from "next-intl";
import CostBreakdown, { CURRENCY_SUFFIX } from "./CostBreakdown";
import type { VehicleCostResult } from "@/types/vehicleCost";

type Props = {
  /**
   * What the server priced this listing at, or `null` when its fuel type maps
   * to no excise class — see `@/lib/powertrain`.
   */
  result: VehicleCostResult | null;
  /**
   * Encar's factory (new-car) KRW price. Not a cost component — it is what the
   * same car sold for new in Korea, so it renders in the footnote block under
   * the total rather than as a breakdown row.
   */
  newPriceKrw?: number | null;
};

/**
 * "Монголд ирэх нийт өртөг" for a Korean listing — the Encar asking price plus
 * shipping and every Mongolian import tax, itemised.
 *
 * Every figure and label comes from `POST /v1/vehicle-cost/calculate`; nothing
 * is computed here. The MNT rows sum to the total by construction, so the card
 * renders `total` as sent rather than re-adding the rows.
 *
 * The page prices the car server-side, so the number is in the first paint and
 * this asks the buyer nothing. It used to make a hybrid pick HEV/PHEV/MHEV
 * before it could quote anything; since the 2026-08-03 ruling put every class
 * but petrol and diesel on one excise grid, there is nothing left to pick.
 * `"use client"` survives only for {@link CostBreakdown}'s per-row tooltip.
 *
 * `verification.warnings` is not rendered. Korea has no VIN decoder, so the
 * only warning it ever carried said exactly that — a fact about our tooling,
 * not about this price. Verification belongs in its own section.
 */
export default function KoreaLandedPriceCard({ result, newPriceKrw }: Props) {
  const t = useTranslations("carDetail.koreaLanded");
  const tEncar = useTranslations("carDetail.encar");

  return (
    <section className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/60">
      <h2 className="text-[11px] font-semibold uppercase leading-tight text-neutral-500 dark:text-neutral-400">
        {t("title")}
      </h2>

      {result === null && (
        <p className="mt-3 text-[13px] leading-relaxed text-neutral-500 dark:text-neutral-400">
          {t("unknownPowertrain")}
        </p>
      )}

      {result?.ok && (
        <CostBreakdown cost={result.cost} hintLabel={t("hintLabel")} />
      )}

      {result && !result.ok && (
        <p className="mt-3 text-[13px] leading-relaxed text-amber-600 dark:text-amber-500">
          {t.has(`error.${result.code}`)
            ? t(`error.${result.code}`)
            : result.message}
        </p>
      )}

      {/* Footnotes under the total: the new-car reference price first, then the
          standing disclaimer. Both sit below the divider so neither reads as a
          row that was added into the total. */}
      <div className="mt-4 border-t border-neutral-200 pt-3 dark:border-neutral-800">
        {newPriceKrw ? (
          <div className="mb-2.5 flex items-baseline justify-between gap-4 text-[12px] text-neutral-500 dark:text-neutral-400">
            <span>{tEncar("newPriceLabel")}</span>
            <span className="shrink-0 font-medium tabular-nums">
              {new Intl.NumberFormat("en-US").format(newPriceKrw)}
              {CURRENCY_SUFFIX.KRW}
            </span>
          </div>
        ) : null}
        <p className="text-[11px] leading-relaxed text-neutral-400 dark:text-neutral-500">
          {t("disclaimer")}
        </p>
      </div>
    </section>
  );
}
