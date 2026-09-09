import { getTranslations } from "next-intl/server";
import PriceTile from "@/components/car-detail/PriceTile";

type Props = {
  /** Asking price in tugrik. Already final — nothing is calculated on top. */
  price: number;
  /** From the raw `status` enum, never `status_label` (see `StockBadge`). */
  isSold: boolean;
};

/**
 * The asking price of an in-stock car, in {@link PriceTile} beside `RateCard` —
 * the Japan lot page's pairing exactly, so a grade and a tugrik figure sit the
 * same way on both. This file holds only what that tile cannot know: the
 * caption and the sold state.
 *
 * Nothing shares the caption's line any more. The stock badge used to ride it
 * as an 11px pill; it is now `GarageStatusCard` above the pair, which is the
 * question a buyer asks first. That leaves the number ink-black and alone, the
 * way the listing cards print it.
 *
 * A sold car swaps the number for its status. The price is withheld rather
 * than struck through — it is history, and quoting it invites the question of
 * whether the next one goes for the same.
 */
export default async function GaragePriceCard({ price, isSold }: Props) {
  const t = await getTranslations("garage");

  return (
    <PriceTile
      label={isSold ? t("statusLabel") : t("priceLabel")}
      amount={isSold ? null : price}
      fallback={t("sold")}
    />
  );
}
