import { getTranslations } from "next-intl/server";
import { TugrigIcon } from "@/components/icons/TugrigIcon";
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
};

/**
 * Headline price for an in-stock car, across the full width of the info column.
 * There is no estimate here — the tugrik price is what the car costs — so it is
 * the largest thing on the page and nothing shares its row.
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

      {isSold ? (
        <div className="mt-2.5 text-[26px] font-extrabold leading-none text-neutral-500 dark:text-neutral-400">
          {t("sold")}
        </div>
      ) : (
        <div className="mt-2.5 flex items-center gap-1">
          {/* Sized to the digits' cap height, and left at its own hairline
              weight — a currency mark set as heavy as the number fights it. */}
          <TugrigIcon
            className="h-7 w-7 shrink-0 text-neutral-900 lg:h-8 lg:w-8 dark:text-neutral-100"
            aria-hidden
          />
          <span className="text-[30px] font-extrabold leading-none text-neutral-900 lg:text-[34px] dark:text-neutral-100">
            {price.toLocaleString()}
          </span>
        </div>
      )}

      {!isSold && arrivalDate && (
        <p className="mt-2.5 text-[12px] text-neutral-500 dark:text-neutral-400">
          {t("arrivalLabel")}: {arrivalDate}
        </p>
      )}
    </div>
  );
}
