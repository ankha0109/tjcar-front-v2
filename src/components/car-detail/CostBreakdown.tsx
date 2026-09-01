"use client";

import { Tooltip } from "antd";
import { formatMnt } from "@/lib/bidConfig";
import type { CostLine, VehicleCost } from "@/types/vehicleCost";

export const CURRENCY_SUFFIX: Record<CostLine["currency"], string> = {
  MNT: "₮",
  KRW: "₩",
  JPY: "¥",
};

/** What an amount reads as before there is one. */
const DASH = "-";

export function formatCostLine(line: CostLine): string {
  if (line.currency === "MNT") return formatMnt(line.amount);

  return (
    new Intl.NumberFormat("en-US").format(line.amount) +
    CURRENCY_SUFFIX[line.currency]
  );
}

type Row = {
  key: string;
  label: string;
  value: string;
  hint?: string;
};

/**
 * The itemised rows and the total of a `POST /v1/vehicle-cost/calculate`
 * answer, shared by every surface that shows one — the Korean listing card and
 * the Japanese lot's own-price calculator.
 *
 * Every figure and label comes from the API; nothing is computed here. The MNT
 * rows sum to `total` by construction, so the total renders as sent rather than
 * being re-added.
 */
export default function CostBreakdown({
  cost,
  hintLabel,
}: {
  cost: VehicleCost;
  /** Accessible name for the per-row `?` button, from the caller's namespace. */
  hintLabel: string;
}) {
  return (
    <Table
      rows={cost.lines.map((line) => ({
        key: line.code,
        label: line.label,
        value: formatCostLine(line),
        hint: line.hint,
      }))}
      totalLabel={cost.total.label}
      totalValue={formatMnt(cost.total.amount)}
      hintLabel={hintLabel}
    />
  );
}

/**
 * The same table with every amount dashed out, for a calculator that has not
 * been asked anything yet. It holds the card's height, so pressing the button
 * fills the rows in place instead of pushing the page around.
 *
 * The labels are the caller's, not the API's — there is no answer to take them
 * from yet. They are a placeholder only: the first real answer replaces the
 * whole table, labels included, and the API stays the source of truth for what
 * a row is called.
 */
export function CostBreakdownPlaceholder({
  labels,
  totalLabel,
}: {
  labels: string[];
  totalLabel: string;
}) {
  return (
    <Table
      rows={labels.map((label) => ({ key: label, label, value: DASH }))}
      totalLabel={totalLabel}
      totalValue={DASH}
    />
  );
}

function Table({
  rows,
  totalLabel,
  totalValue,
  hintLabel,
}: {
  rows: Row[];
  totalLabel: string;
  totalValue: string;
  hintLabel?: string;
}) {
  return (
    <>
      <dl className="mt-3 space-y-2.5">
        {rows.map((row) => (
          <div key={row.key} className="flex items-baseline justify-between gap-4">
            <dt className="flex items-center text-[13px] text-neutral-500 dark:text-neutral-400">
              {row.label}
              {row.hint && hintLabel && (
                <Hint text={row.hint} label={hintLabel} />
              )}
            </dt>
            <dd className="shrink-0 text-[13px] font-medium tabular-nums text-neutral-800 dark:text-neutral-100">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-3 flex items-baseline justify-between gap-4 border-t border-neutral-200 pt-3 dark:border-neutral-800">
        <span className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
          {totalLabel}
        </span>
        <span className="shrink-0 text-[22px] font-extrabold leading-tight tabular-nums text-neutral-900 dark:text-neutral-100">
          {totalValue}
        </span>
      </div>
    </>
  );
}

/**
 * The `?` affordance next to a row; `text` is built by the API. `click` is in
 * the trigger list beside `hover`/`focus` because most of this traffic is
 * touch, where a hover-only tooltip never opens.
 */
function Hint({ text, label }: { text: string; label: string }) {
  return (
    <Tooltip
      title={text}
      placement="top"
      trigger={["hover", "focus", "click"]}
      mouseEnterDelay={0.2}
    >
      <button
        type="button"
        aria-label={label}
        className="ml-1 flex h-4 w-4 items-center justify-center rounded-full border border-neutral-300 text-[10px] leading-none text-neutral-400 transition hover:border-neutral-400 hover:text-neutral-600 dark:border-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300"
      >
        ?
      </button>
    </Tooltip>
  );
}
