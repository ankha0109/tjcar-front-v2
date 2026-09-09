import type { ReactNode } from "react";
import { formatMnt } from "@/lib/bidConfig";

type Props = {
  /** Small uppercase caption — what the number is ("ҮНЭ", "ГАР ДЭЭР ИРЭХ ДУНДАЖ ҮНЭ"). */
  label: string;
  /** Rides the caption's line, hard right: a modal trigger, a status badge. */
  action?: ReactNode;
  /** Tugrik amount. `null` prints {@link fallback} in the number's place. */
  amount: number | null;
  /** Stands in for the number: "Зарагдсан" on a sold car, "Тодорхойгүй" on an unpriceable lot. */
  fallback?: ReactNode;
  /** Anything that has to live in the tile's tree without showing in it (a Modal). */
  children?: ReactNode;
};

/**
 * The tugrik headline tile, right-hand three fifths of the `RateCard` pairing.
 * Both detail pages print their main number through it — `/japan/{id}` the
 * landed estimate, `/garage/{id}` the asking price — so the grade-and-price row
 * reads the same on a lot we are bidding on and on a car we already own.
 *
 * Caption line on top (with whatever the page hangs on its right), number
 * below, pushed to the tile's floor by `justify-between` so it lines up with
 * the grade beside it however many lines the caption takes. The currency mark
 * comes from `formatMnt`, trailing the digits.
 *
 * No hooks and no `"use client"`: this renders inside an async server component
 * (`GaragePriceCard`) and inside a client one (`LandedPriceCard`) alike.
 */
export default function PriceTile({
  label,
  action,
  amount,
  fallback,
  children,
}: Props) {
  return (
    <div className="flex flex-col justify-between gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/60">
      {/* One line, never wrapped: a `flex-wrap` here drops the info button
          below a caption that fills the row, which is what "ГАР ДЭЭР ИРЭХ
          ДУНДАЖ ҮНЭ" does on a phone. The right slot shrinks instead — the
          in-stock badge wraps its own text before the row breaks. And no
          `h-full`: each tile keeps its content height, the way this pair has
          always sat. */}
      <div className="flex items-start justify-between gap-1">
        <div className="text-[11px] font-semibold uppercase leading-tight text-neutral-500 dark:text-neutral-400">
          {label}
        </div>
        {action}
      </div>

      <div>
        {amount == null ? (
          <div className="text-[15px] font-semibold text-neutral-500 dark:text-neutral-400">
            {fallback}
          </div>
        ) : (
          <div className="text-[22px] font-extrabold leading-tight text-neutral-900 dark:text-neutral-100">
            {formatMnt(amount)}
          </div>
        )}
      </div>

      {children}
    </div>
  );
}
