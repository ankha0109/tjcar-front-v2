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

export function fromFeaturedCar(car: FeaturedCar): CarItem {
  const images = car.IMAGES?.split("#").filter(Boolean) ?? [];
  const mileage = Number(car.MILEAGE);
  const engine = Number(car.ENG_V);
  const start = Number(car.START);

  return {
    id: car.ID,
    source: "japan",
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
