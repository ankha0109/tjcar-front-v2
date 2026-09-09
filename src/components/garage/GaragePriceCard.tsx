import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import type { CarType } from "@/types/car";
import { StockBadge } from "./StockBadge";

type Props = {
  /** Asking price in tugrik. Already final — nothing is calculated on top. */
  price: number;
  /** From the raw `status` enum, never `status_label` (see {@link StockBadge}). */
  isSold: boolean;
  type: CarType | null;
  /** `Y-m-d`, and only ever set on `arriving_soon` cars. */
  arrivalDate: string | null;
  /**
   * The inspection grade, as `RateCard`'s inline chip — it shares the price's
   * row from the left. A slot rather than a `rate: string`, because the chip is
   * a client component with its own modal and this card is a server one.
   */
  rate?: ReactNode;
};

/**
 * Headline price for an in-stock car, across the full width of the info column.
 * There is no estimate here — the tugrik price is what the car costs — so it is
 * the largest thing on the page, and the only thing that shares its row is the
 * grade chip, pinned to the far left with the number against the right edge.
 *
 * The stock badge rides the label's line instead of a divided footer: it is a
 * qualifier on the price ("this much, once it lands"), and putting it there
 * saves the row the divider used to cost. Colour is left to that badge; the
 * number itself stays ink-black, the way the listing cards print it, so the
 * emerald in this palette keeps meaning "in stock" rather than "money".
 *
 * A sold car swaps the whole card to its status. The price is withheld rather
 * than struck through — it is history, and quoting it invites the question of
 * whether the next one goes for the same.
 */
export default async function GaragePriceCard({
  price,
  isSold,
  type,
  arrivalDate,
  rate,
}: Props) {
  const t = await getTranslations("garage");

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase leading-tight text-neutral-500 dark:text-neutral-400">
          {isSold ? t("statusLabel") : t("priceLabel")}
        </span>
        {/* Dropped once sold: the shipping stage of a car someone else drove
            off in is not news. */}
        {!isSold && type && (
          <StockBadge type={type} label={t(`type.${type}`)} />
        )}
      </div>

      {/* Grade left, number right. `flex-wrap` is the escape hatch, not the
          layout: a nine-digit price next to a spelled-out grade ("CLEAN") runs
          out of room on a 360px phone, and dropping to a second line beats
          shrinking the headline for every car to fit the widest one. Without a
          grade the row has one child and the number simply stays left, where it
          has always been. */}
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        {rate}
        {isSold ? (
          <span className="text-[26px] font-extrabold leading-none text-neutral-500 dark:text-neutral-400">
            {t("sold")}
          </span>
        ) : (
          <span className="text-[26px] font-extrabold leading-none text-neutral-900 lg:text-[30px] dark:text-neutral-100">
            {price.toLocaleString()}
            {/* Trailing, the way a price is spoken and written here. Lighter
                than the digits: a currency mark set as heavy as the number
                fights it. */}
            <span className="ml-1.5 text-[0.75em] font-bold text-neutral-400 dark:text-neutral-500">
              ₮
            </span>
          </span>
        )}
      </div>

      {!isSold && arrivalDate && (
        <p className="mt-2.5 text-[12px] text-neutral-500 dark:text-neutral-400">
          {t("arrivalLabel")}: {arrivalDate}
        </p>
      )}
    </div>
  );
}
