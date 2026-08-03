"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { formatMnt } from "@/lib/bidConfig";
import type { CostLine, VehicleCost, VehicleCostResult } from "@/types/vehicleCost";

type Props = {
  /**
   * What the server priced this listing at, or `null` when its fuel type maps
   * to no excise class — see `@/lib/powertrain`.
   */
  result: VehicleCostResult | null;
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
export default function KoreaLandedPriceCard({ result }: Props) {
  const t = useTranslations("carDetail.koreaLanded");

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

      <p className="mt-4 border-t border-neutral-200 pt-3 text-[11px] leading-relaxed text-neutral-400 dark:border-neutral-800 dark:text-neutral-500">
        {t("disclaimer")}
      </p>
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

/** The `?` affordance next to a row; `hint` text is built by the API. */
function Hint({ text }: { text: string }) {
  const t = useTranslations("carDetail.koreaLanded");
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label={t("hintLabel")}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
        className="ml-1 flex h-4 w-4 items-center justify-center rounded-full border border-neutral-300 text-[10px] leading-none text-neutral-400 transition hover:border-neutral-400 hover:text-neutral-600 dark:border-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300"
      >
        ?
      </button>

      {open && (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 z-10 mb-1.5 w-max max-w-[15rem] -translate-x-1/2 rounded-md bg-neutral-800 px-2.5 py-1.5 text-[11px] font-normal text-white shadow-lg dark:bg-neutral-700"
        >
          {text}
        </span>
      )}
    </span>
  );
}
