import type { CarSource } from "@/types/car";

/**
 * `car.card` key for the price caption. Japanese cards quote a comparable-sales
 * average — the lot itself has no price until it sells — while Encar listings
 * carry the seller's real asking price in Korea, so calling it an average lies.
 */
export function defaultPriceLabelKey(source: CarSource) {
  return source === "korea" ? "koreaPriceLabel" : "avgPriceLabel";
}
