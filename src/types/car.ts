import { FeaturedCar } from "./featured";

export type CarSource = "japan" | "korea" | "china";

export type CarCurrency = "JPY" | "KRW" | "CNY" | "USD";

export type CarItem = {
  id: string;
  source: CarSource;

  marka: string;
  model: string;
  grade?: string;
  year?: string;

  images: string[];

  price: {
    original: { amount: number; currency: CarCurrency };
    mnt: number;
  };

  mileageKm?: number;
  engineCc?: number;
  transmission?: string;
  color?: string;
  drivetrain?: "LHD" | "RHD";
  bodyType?: string;

  auction?: {
    name: string;
    lot?: string;
    date?: string;
    grade?: string;
    type?: string;
  };

  location?: string;
};

// `source` defaults to Japan (the auction browser) but the Korea schedule reuses
// the same AJES shape, so it passes `"korea"` — this keeps `CarItem.source`
// truthful for links and the wishlist identity instead of hardcoding one value.
export function fromFeaturedCar(
  car: FeaturedCar,
  source: CarSource = "japan",
): CarItem {
  const images = car.IMAGES?.split("#").filter(Boolean) ?? [];
  const mileage = Number(car.MILEAGE);
  const engine = Number(car.ENG_V);
  const start = Number(car.START);

  return {
    id: car.ID,
    source,
    marka: car.MARKA_NAME,
    model: car.MODEL_NAME,
    grade: car.GRADE || undefined,
    year: car.YEAR || undefined,
    images,
    price: {
      original: {
        amount: Number.isFinite(start) ? start : 0,
        currency: "JPY",
      },
      mnt: car.PRICE_MNT ?? 0,
    },
    mileageKm: Number.isFinite(mileage) ? mileage : undefined,
    engineCc: Number.isFinite(engine) ? engine : undefined,
    transmission: car.KPP || undefined,
    color: car.COLOR || undefined,
    drivetrain:
      car.LHDRIVE === "1" ? "LHD" : car.LHDRIVE === "0" ? "RHD" : undefined,
    bodyType: car.KUZOV || undefined,
    auction: car.AUCTION
      ? {
          name: car.AUCTION,
          lot: car.LOT || undefined,
          date: car.AUCTION_DATE || undefined,
          grade: car.RATE || undefined,
          type: car.AUCTION_TYPE || undefined,
        }
      : undefined,
    location: car.TOWN || undefined,
  };
}

// ── Cars-in-stock API (`GET /api/cars`, `GET /api/cars/{id}`) ───────────────
// Backend: App\Http\Resources\Car\CarResource. `type`/`status` are PHP enums.

export const CAR_TYPES = [
  "ready_to_ship",
  "available",
  "arriving_soon",
  "preorder_only",
] as const;
export type CarType = (typeof CAR_TYPES)[number];

export const CAR_STATUSES = ["active", "sold", "inactive"] as const;
export type CarStatus = (typeof CAR_STATUSES)[number];

/**
 * Free-form JSON column copied from an AJES auction lot. Keys are UPPERCASE and
 * values may arrive as strings or numbers — coerce before use. All optional;
 * the index signature keeps lesser-used AJES fields accessible.
 */
export type CarData = {
  ID?: string | number;
  LOT?: string | number;
  AUCTION_TYPE?: string | number;
  AUCTION_DATE?: string;
  AUCTION?: string;
  MARKA_NAME?: string;
  MODEL_NAME?: string;
  YEAR?: string | number;
  ENG_V?: string | number;
  KUZOV?: string;
  GRADE?: string;
  COLOR?: string;
  KPP?: string;
  MILEAGE?: string | number;
  EQUIP?: string;
  RATE?: string | number;
  START?: string | number;
  AVG_PRICE?: string | number;
  LHDRIVE?: string | number;
  IMAGES?: string;
  INFO?: string;
  [key: string]: unknown;
};

/** Raw `GET /cars/{id}` resource (and each item of the `/cars` collection). */
export type CarResource = {
  id: number;
  car_data: CarData;
  price: number;
  images: string[];
  arrival_date: string | null;
  type: CarType | null;
  type_label: string | null;
  status: CarStatus | null;
  status_label: string | null;
  user_id: number | null;
  user?: { id: number; name: string };
  created_at: string | null;
  updated_at: string | null;
};
