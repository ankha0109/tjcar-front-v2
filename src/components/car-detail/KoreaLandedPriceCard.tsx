"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { formatMnt } from "@/lib/bidConfig";
import { useVehicleCost } from "@/hooks/useVehicleCost";
import type { PowertrainResolution } from "@/lib/powertrain";
import type {
  CostLine,
  Powertrain,
  VehicleCost,
  VehicleCostResult,
} from "@/types/vehicleCost";

type Props = {
  listingId: number;
  /** What Encar's fuel type could be resolved to — see `@/lib/powertrain`. */
  resolution: PowertrainResolution;
  /**
   * Server-computed result, present only when the powertrain was unambiguous.
   * Keeps the headline number in the first paint instead of behind a spinner.
   */
  initial: VehicleCostResult | null;
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
 * Three shapes, driven by what Encar's fuel type can be resolved to:
 * unambiguous fuels arrive already priced from the server; a hybrid asks the
 * buyer to pick HEV/PHEV/MHEV first, because the tax differs and guessing is
 * worse than asking; LPG, hydrogen and EVs have no excise rule yet and get an
 * explanation instead of a number.
 */
export default function KoreaLandedPriceCard({
  listingId,
  resolution,
  initial,
}: Props) {
  const t = useTranslations("carDetail.koreaLanded");
  const [chosen, setChosen] = useState<Powertrain | null>(null);

  const query = useVehicleCost(
    chosen ? { country: "KOREA", koreaListingId: listingId, powertrain: chosen } : null,
    String(listingId),
  );

  const result: VehicleCostResult | null =
    resolution.kind === "choice" ? (query.data ?? null) : initial;

  return (
    <section className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/60">
      <h2 className="text-[11px] font-semibold uppercase leading-tight text-neutral-500 dark:text-neutral-400">
        {t("title")}
      </h2>

      {resolution.kind === "unsupported" ? (
        <p className="mt-3 text-[13px] leading-relaxed text-neutral-500 dark:text-neutral-400">
          {t(`unsupported.${resolution.reason}`)}
        </p>
      ) : (
        <>
          {resolution.kind === "choice" && (
            <PowertrainPicker
              options={resolution.options}
              chosen={chosen}
              onChoose={setChosen}
            />
          )}

          {query.isFetching && (
            <p className="mt-3 text-[13px] text-neutral-500 dark:text-neutral-400">
              {t("loading")}
            </p>
          )}

          {!query.isFetching && result?.ok && <Breakdown cost={result.cost} />}

          {!query.isFetching && result && !result.ok && (
            <p className="mt-3 text-[13px] leading-relaxed text-amber-600 dark:text-amber-500">
              {t.has(`error.${result.code}`)
                ? t(`error.${result.code}`)
                : result.message}
            </p>
          )}
        </>
      )}

      <p className="mt-4 border-t border-neutral-200 pt-3 text-[11px] leading-relaxed text-neutral-400 dark:border-neutral-800 dark:text-neutral-500">
        {t("disclaimer")}
      </p>
    </section>
  );
}

function PowertrainPicker({
  options,
  chosen,
  onChoose,
}: {
  options: readonly Powertrain[];
  chosen: Powertrain | null;
  onChoose: (p: Powertrain) => void;
}) {
  const t = useTranslations("carDetail.koreaLanded");

  return (
    <div className="mt-3">
      <p className="text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-300">
        {t("choosePowertrain")}
      </p>

      <div className="mt-2 flex flex-wrap gap-2" role="group">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={chosen === option}
            onClick={() => onChoose(option)}
            className={`rounded-full border px-3 py-1.5 text-[12px] font-medium transition ${
              chosen === option
                ? "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
                : "border-neutral-300 text-neutral-600 hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-neutral-500"
            }`}
          >
            {t(`powertrain.${option}`)}
          </button>
        ))}
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-neutral-400 dark:text-neutral-500">
        {t("powertrainHint")}
      </p>
    </div>
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

      {cost.verification.warnings.length > 0 && (
        <ul className="mt-3 space-y-1">
          {cost.verification.warnings.map((warning) => (
            <li
              key={warning}
              className="text-[11px] leading-relaxed text-amber-600 dark:text-amber-500"
            >
              {warning}
            </li>
          ))}
        </ul>
      )}
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
