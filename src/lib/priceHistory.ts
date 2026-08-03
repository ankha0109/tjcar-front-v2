import { parseImages, type CarFixture } from "@/lib/carFixtures";
import type { FeaturedCar } from "@/types/featured";
import { decodeAuctionText } from "@/utils/auctionInfo";
import { formatEngine } from "@/utils/carFormat";

/**
 * One comparable car that sold recently. Every Japan-side figure is carried in
 * both currencies: the yen the auction actually ran in, and that yen at the live
 * rate. The chart's ¥/₮ switch picks between them, so neither conversion can be
 * done at render time without the rate.
 */
export type ComparableSale = {
  /** ISO date (e.g. "2026-06-20"). */
  date: string;
  /** Landed ("гар дээр ирэх") price in tugrik — the plotted series in ₮ mode. */
  mnt: number;
  /** Japan hammer price in yen — the plotted series in ¥ mode. */
  hammerJpy?: number;
  /** Auction start (reserve) price in yen. */
  startJpy?: number;
  /** Japan hammer price in tugrik. Context for the landed figure, not the plot. */
  hammerMnt?: number;
  /** Auction start (reserve) price in tugrik. */
  startMnt?: number;
  /** Inspector's overall auction rate, e.g. "4.5". */
  rate?: string;
  year?: string;
  mileageKm?: number;
  grade?: string;
  /** Photo of the sold car, shown in the chart tooltip. */
  image?: string;
};

/**
 * Map raw AJES `stats` rows (`GET /japan/history`) into the trend chart's shape.
 *
 * Upstream orders newest-first; the chart runs left-to-right in time, so rows
 * are reversed here.
 *
 * The plotted series is `PRICE_MNT`, the landed price the API computes per row
 * from that sale's own hammer price — Japan fees, shipping and Mongolian duties
 * included. It is NOT the yen hammer price at the exchange rate: those two are
 * far apart, and the landed one is what a buyer actually pays. Rows the API
 * could not price are dropped rather than fallen back to a Japan-side figure,
 * which would put roughly half the real cost under a "гар дээр ирэх үнэ" label.
 *
 * `jpyRate` is the live JPY→MNT rate from `GET /config` and only converts the
 * Japan-side start/hammer prices. It degrades to 0 when that call fails, which
 * drops the tugrik copies of those two — the yen originals and the landed price
 * survive, so the chart still works in either currency.
 */
export function toComparableSales(
  rows: FeaturedCar[],
  jpyRate: number,
): ComparableSale[] {
  const toMnt = (jpy: number): number | undefined =>
    jpy > 0 && jpyRate > 0 ? Math.round(jpy * jpyRate) : undefined;

  return rows
    .map((row): ComparableSale | null => {
      const landedMnt = Number(row.PRICE_MNT) || 0;
      // AUCTION_DATE is "YYYY-MM-DD HH:MM:SS" — the date half is all we plot.
      const date = (row.AUCTION_DATE ?? "").slice(0, 10);
      if (!landedMnt || !date) return null;

      const hammerJpy = Number(row.FINISH) || 0;
      const startJpy = Number(row.START) || 0;

      return {
        date,
        mnt: landedMnt,
        hammerJpy: hammerJpy || undefined,
        startJpy: startJpy || undefined,
        hammerMnt: toMnt(hammerJpy),
        startMnt: toMnt(startJpy),
        rate: row.RATE || undefined,
        year: row.YEAR || undefined,
        mileageKm: Number(row.MILEAGE) || undefined,
        grade: decodeAuctionText(row.GRADE) || undefined,
        image: parseImages(row.IMAGES ?? "")[0],
      };
    })
    .filter((sale) => sale !== null)
    .reverse();
}

/**
 * Short spec descriptor, e.g. "Toyota Prius · 2018 · 1,800 CC · ⭐ 4.5".
 *
 * The rate is spelled out because the history is filtered to it: a rate 5 car
 * and a rate R one are worth very different money, and a chart that did not say
 * which grade it was showing would read as "a rate 5 car goes for this".
 */
export function sameSpecLabel(car: CarFixture): string {
  const name = `${car.MARKA_NAME ?? ""} ${car.MODEL_NAME ?? ""}`.trim();
  return [
    name,
    car.YEAR,
    formatEngine(Number(car.ENG_V) || undefined),
    car.RATE ? `⭐ ${car.RATE}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

/** "60000000" → "60,000,000₮". */
export function formatMnt(value: number): string {
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value)}₮`;
}

/** "850000" → "¥850,000". */
export function formatJpy(value: number): string {
  return `¥${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value)}`;
}

/** Parse a date-only ISO string at UTC noon (avoids timezone day shifts). */
function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1, 12));
}

/** Full sale-date label, e.g. "6 сарын 10" (mn) / "Jun 10" (en) / "10 июн." (ru). */
export function formatSaleDate(iso: string, locale: string): string {
  const [, m, d] = iso.split("-").map(Number);
  if (locale === "mn") return `${m} сарын ${d}`;
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(parseIsoDate(iso));
}
