import type { CarSource } from "@/types/car";

/**
 * `car.card` key for the price caption. Japanese cards quote a comparable-sales
 * average — the lot itself has no price until it sells — while Encar and China
 * dealer listings carry the seller's real asking price, so calling it an
 * average lies.
 */
export function defaultPriceLabelKey(source: CarSource) {
  if (source === "korea") return "koreaPriceLabel";
  if (source === "china") return "chinaPriceLabel";
  return "avgPriceLabel";
}
