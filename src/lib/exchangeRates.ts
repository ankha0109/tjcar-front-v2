/**
 * The rates themselves come from `GET /config` via `getConfig()`; they reach
 * the client through `RatesProvider`. Only the formatting lives here.
 *
 * Two fraction digits, not one: KRW hovers around 2.48 and rounding it to "2.5"
 * would drop a digit that matters. USD (3,594) and JPY (22.5) print the same
 * either way.
 */
export function formatRate(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}
