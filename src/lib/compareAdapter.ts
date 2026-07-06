import { fromFeaturedCar } from "@/types/car";
import type {
  CompareEntry,
  CompareJapanCar,
  CompareSource,
} from "@/types/compare";
import { compareHref } from "@/types/compare";
import type { FeaturedCar } from "@/types/featured";
import type { KoreaListing } from "@/types/korea";
import { koreaListingToCarItem } from "@/lib/koreaAdapter";
import { withImageSize } from "@/utils/auctionImage";
import { formatAuctionTime } from "@/utils/carCountdown";
import {
  CURRENCY_SYMBOL,
  formatEngine,
  formatMileage,
  formatTransmission,
} from "@/utils/carFormat";

/**
 * `null` renders as "—"; booleans render as the yes/no labels; `{ image }`
 * renders as a clickable thumbnail (the evaluation sheet row).
 */
export type CompareValue = string | boolean | { image: string } | null;

export type ComparedCar = {
  source: CompareSource;
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  href: string;
  /** Header price (server-computed MNT); null hides the line. */
  priceMnt: number | null;
  values: Record<string, CompareValue>;
};

export type CompareRow = {
  key: string;
  /** FULL i18n path — resolved with a root `useTranslations()`. */
  labelKey: string;
};

export type CompareSection = {
  key: string;
  labelKey: string;
  rows: CompareRow[];
};

/**
 * Unified row model for the mixed Japan/Korea table. Rows one source can't
 * fill stay null there and render as "—" (spec §5: unified rows over
 * per-source sections). Existing `carDetail.specs.*` labels are reused;
 * compare-only rows live under `compare.rows.*`.
 */
export const COMPARE_SECTIONS: CompareSection[] = [
  {
    key: "general",
    labelKey: "compare.sections.general",
    rows: [
      { key: "brand", labelKey: "compare.rows.brand" },
      { key: "model", labelKey: "compare.rows.model" },
      { key: "grade", labelKey: "carDetail.specs.grade" },
      { key: "year", labelKey: "carDetail.specs.year" },
      { key: "bodyType", labelKey: "compare.rows.bodyType" },
      { key: "color", labelKey: "carDetail.specs.color" },
      { key: "region", labelKey: "compare.rows.region" },
      { key: "evaluation", labelKey: "compare.rows.evaluation" },
    ],
  },
  {
    key: "price",
    labelKey: "compare.sections.price",
    rows: [
      { key: "priceOriginal", labelKey: "compare.rows.priceOriginal" },
      { key: "priceUsd", labelKey: "compare.rows.priceUsd" },
      { key: "avgPrice", labelKey: "compare.rows.avgPrice" },
      { key: "priceMnt", labelKey: "compare.rows.priceMnt" },
    ],
  },
  {
    key: "tech",
    labelKey: "compare.sections.tech",
    rows: [
      { key: "mileage", labelKey: "carDetail.specs.mileage" },
      { key: "engine", labelKey: "carDetail.specs.engine" },
      { key: "transmission", labelKey: "carDetail.specs.transmission" },
      { key: "fuel", labelKey: "compare.rows.fuel" },
      { key: "drive", labelKey: "carDetail.specs.drive" },
    ],
  },
  {
    key: "auction",
    labelKey: "compare.sections.auction",
    rows: [
      { key: "auctionName", labelKey: "carDetail.specs.auction" },
      { key: "auctionDate", labelKey: "carDetail.specs.auctionDate" },
      { key: "lot", labelKey: "carDetail.specs.lot" },
      { key: "rate", labelKey: "carDetail.specs.rate" },
      { key: "equipment", labelKey: "carDetail.specs.equipment" },
    ],
  },
  {
    key: "condition",
    labelKey: "compare.sections.condition",
    rows: [
      { key: "accident", labelKey: "compare.rows.accident" },
      { key: "owners", labelKey: "compare.rows.owners" },
      { key: "verified", labelKey: "compare.rows.verified" },
    ],
  },
];

type Translator = (
  key: string,
  params?: Record<string, string | number | Date>,
) => string;

const orDash = (v: string | undefined | null): string | null => v || null;

/** The compare API sends PRICE_MNT as null; the card adapter wants it absent. */
const toFeatured = (car: CompareJapanCar): FeaturedCar => ({
  ...car,
  PRICE_MNT: car.PRICE_MNT ?? undefined,
});

// Image index 0 is the evaluation (inspection) sheet whenever a car photo
// remains after it — same split CarDetail and the snapshot builders use.
const carPhoto = (images: string[]): string | undefined =>
  images[1] ?? images[0];
const evaluationSheet = (images: string[]): CompareValue =>
  images.length > 1 ? { image: images[0] } : null;

function formatMoney(amount: number | undefined, currency: string): string | null {
  if (!amount || !Number.isFinite(amount)) return null;
  const symbol = CURRENCY_SYMBOL[currency as keyof typeof CURRENCY_SYMBOL];
  return `${amount.toLocaleString()} ${symbol ?? currency}`;
}

function japanValues(
  car: CompareJapanCar,
  t: Translator,
): Record<string, CompareValue> {
  // Shared fields via the battle-tested card adapter; auction extras from raw.
  const item = fromFeaturedCar(toFeatured(car), "japan");
  const tCard: Translator = (key, params) => t(`car.card.${key}`, params);
  const avgPrice = Number(car.AVG_PRICE);

  return {
    brand: orDash(item.marka),
    model: orDash(item.model),
    grade: orDash(item.grade),
    year: orDash(item.year),
    bodyType: orDash(item.bodyType),
    color: orDash(item.color),
    priceOriginal: formatMoney(item.price.original.amount, "JPY"),
    priceUsd: null,
    avgPrice:
      orDash(car.AVG_STRING) ??
      (avgPrice > 0 ? formatMoney(avgPrice, "JPY") : null),
    priceMnt: car.PRICE_MNT ? `${car.PRICE_MNT.toLocaleString()}₮` : null,
    mileage: formatMileage(item.mileageKm, tCard) ?? null,
    engine: formatEngine(item.engineCc) ?? null,
    transmission: formatTransmission(item.transmission, tCard) ?? null,
    fuel: null,
    drive: item.drivetrain
      ? tCard(`drive.${item.drivetrain === "LHD" ? "lhd" : "rhd"}`)
      : null,
    auctionName: orDash(item.auction?.name),
    auctionDate: formatAuctionTime(item.auction?.date, "japan"),
    lot: item.auction?.lot ? `#${item.auction.lot}` : null,
    rate: orDash(item.auction?.grade),
    equipment: orDash(car.EQUIP),
    accident: null,
    owners: null,
    verified: null,
    region: orDash(item.location),
    evaluation: evaluationSheet(item.images),
  };
}

function koreaValues(
  car: KoreaListing,
  t: Translator,
): Record<string, CompareValue> {
  const item = koreaListingToCarItem(car);
  const tCard: Translator = (key, params) => t(`car.card.${key}`, params);

  return {
    brand: orDash(item.marka),
    model: orDash(item.model),
    grade: orDash(item.grade),
    year: orDash(item.year),
    bodyType: orDash(item.bodyType),
    color: orDash(item.color),
    priceOriginal: formatMoney(car.price_krw ?? undefined, "KRW"),
    priceUsd: null,
    avgPrice: null,
    priceMnt:
      item.price.mnt > 0 ? `${item.price.mnt.toLocaleString()}₮` : null,
    mileage: formatMileage(item.mileageKm, tCard) ?? null,
    engine: formatEngine(item.engineCc) ?? null,
    transmission: formatTransmission(item.transmission, tCard) ?? null,
    fuel: orDash(car.fuel_type),
    // Encar rows carry no drive/accident/owner/verification data.
    drive: null,
    auctionName: null,
    auctionDate: null,
    lot: null,
    rate: null,
    equipment: null,
    accident: null,
    owners: null,
    verified: null,
    region: orDash(item.location),
    evaluation: evaluationSheet(item.images),
  };
}

/** Normalize one API entry into a table column; `found:false` drops to null. */
export function comparedCarFromEntry(
  entry: CompareEntry,
  t: Translator,
): ComparedCar | null {
  if (!entry.found) return null;

  if (entry.source === "japan") {
    const item = fromFeaturedCar(toFeatured(entry.car), "japan");
    const photo = carPhoto(item.images);
    return {
      source: "japan",
      id: entry.id,
      title: `${item.marka} ${item.model}`.trim(),
      subtitle: item.grade,
      image: photo ? withImageSize(photo, "card") : undefined,
      href: compareHref("japan", entry.id),
      priceMnt: entry.car.PRICE_MNT ?? null,
      values: japanValues(entry.car, t),
    };
  }

  const item = koreaListingToCarItem(entry.car);
  return {
    source: "korea",
    id: entry.id,
    title: `${item.marka} ${item.model}`.trim(),
    subtitle: item.grade,
    image: carPhoto(item.images),
    href: compareHref("korea", entry.id),
    priceMnt: item.price.mnt > 0 ? item.price.mnt : null,
    values: koreaValues(entry.car, t),
  };
}
