"use client";

import { Tooltip } from "antd";
import { useTranslations } from "next-intl";
import { formatMnt } from "@/lib/bidConfig";
import type { CostLine, VehicleCost, VehicleCostResult } from "@/types/vehicleCost";

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

const CURRENCY_SUFFIX: Record<CostLine["currency"], string> = {
  MNT: "₮",
  KRW: "₩",
  JPY: "¥",
};

function formatLine(line: CostLine): string {
  if (line.currency === "MNT") return formatMnt(line.amount);

  return (
    new Intl.NumberFormat("en-US").format(line.amount) +
    CURRENCY_SUFFIX[line.currency]
  );
}

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
 * `"use client"` survives only for the per-row {@link Hint} tooltip.
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

      {result?.ok && <Breakdown cost={result.cost} />}

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

function Breakdown({ cost }: { cost: VehicleCost }) {
  return (
    <>
      <dl className="mt-3 space-y-2.5">
        {cost.lines.map((line) => (
          <div key={line.code} className="flex items-baseline justify-between gap-4">
            <dt className="flex items-center text-[13px] text-neutral-500 dark:text-neutral-400">
              {line.label}
              {line.hint && <Hint text={line.hint} />}
            </dt>
            <dd className="shrink-0 text-[13px] font-medium tabular-nums text-neutral-800 dark:text-neutral-100">
              {formatLine(line)}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-3 flex items-baseline justify-between gap-4 border-t border-neutral-200 pt-3 dark:border-neutral-800">
        <span className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
          {cost.total.label}
        </span>
        <span className="shrink-0 text-[22px] font-extrabold leading-tight tabular-nums text-neutral-900 dark:text-neutral-100">
          {formatMnt(cost.total.amount)}
        </span>
      </div>
    </>
  );
}

/**
 * The `?` affordance next to a row; `hint` text is built by the API. `click` is
 * in the trigger list beside `hover`/`focus` because most of this card's traffic
 * is touch, where a hover-only tooltip never opens.
 */
function Hint({ text }: { text: string }) {
  const t = useTranslations("carDetail.koreaLanded");

  return (
    <Tooltip
      title={text}
      placement="top"
      trigger={["hover", "focus", "click"]}
      mouseEnterDelay={0.2}
    >
      <button
        type="button"
        aria-label={t("hintLabel")}
        className="ml-1 flex h-4 w-4 items-center justify-center rounded-full border border-neutral-300 text-[10px] leading-none text-neutral-400 transition hover:border-neutral-400 hover:text-neutral-600 dark:border-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300"
      >
        ?
      </button>
    </Tooltip>
  );
}
