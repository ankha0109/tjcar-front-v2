import type { CarResource } from "@/types/car";
import type { FeaturedCar } from "@/types/featured";

export type CarFixture = {
  ID: string;
  LOT: string;
  AUCTION_TYPE: string;
  AUCTION_DATE: string;
  AUCTION: string;
  MARKA_ID: string;
  MODEL_ID: string;
  MARKA_NAME: string;
  MODEL_NAME: string;
  YEAR: string;
  TOWN: string;
  ENG_V: string;
  PW: string;
  KUZOV: string;
  GRADE: string;
  COLOR: string;
  KPP: string;
  KPP_TYPE: string;
  PRIV: string;
  MILEAGE: string;
  EQUIP: string;
  RATE: string;
  START: string;
  FINISH: string;
  STATUS: string;
  TIME: string;
  AVG_PRICE: string;
  AVG_STRING: string;
  LHDRIVE: string;
  IMAGES: string;
  SERIAL: string;
  INFO: string;
  premium_images: string | null;
};

const str = (value: unknown): string =>
  value === null || value === undefined ? "" : String(value);

/**
 * Flatten a `CarResource` into the AJES-shaped view model the detail UI reads.
 * `car_data` carries the uppercase auction fields; the top-level `images` array
 * wins over the `#`-joined `car_data.IMAGES` string when present.
 */
export function carResourceToFixture(car: CarResource): CarFixture {
  const cd = car.car_data ?? {};
  const images = car.images?.length ? car.images : parseImages(str(cd.IMAGES));

  return {
    ID: str(car.id),
    LOT: str(cd.LOT),
    AUCTION_TYPE: str(cd.AUCTION_TYPE),
    AUCTION_DATE: str(cd.AUCTION_DATE),
    AUCTION: str(cd.AUCTION),
    MARKA_ID: str(cd.MARKA_ID),
    MODEL_ID: str(cd.MODEL_ID),
    MARKA_NAME: str(cd.MARKA_NAME),
    MODEL_NAME: str(cd.MODEL_NAME),
    YEAR: str(cd.YEAR),
    TOWN: str(cd.TOWN),
    ENG_V: str(cd.ENG_V),
    PW: str(cd.PW),
    KUZOV: str(cd.KUZOV),
    GRADE: str(cd.GRADE),
    COLOR: str(cd.COLOR),
    KPP: str(cd.KPP),
    KPP_TYPE: str(cd.KPP_TYPE),
    PRIV: str(cd.PRIV),
    MILEAGE: str(cd.MILEAGE),
    EQUIP: str(cd.EQUIP),
    RATE: str(cd.RATE),
    START: str(cd.START),
    FINISH: str(cd.FINISH),
    STATUS: str(cd.STATUS),
    TIME: str(cd.TIME),
    AVG_PRICE: str(cd.AVG_PRICE),
    AVG_STRING: str(cd.AVG_STRING),
    LHDRIVE: str(cd.LHDRIVE),
    IMAGES: images.join("#"),
    SERIAL: str(cd.SERIAL),
    INFO: str(cd.INFO),
    premium_images: null,
  };
}

/**
 * Map a raw `GET /auctions/{id}` lot (flat UPPERCASE shape) into the `CarFixture`
 * the detail UI reads. Near-identity — `IMAGES` is already `#`-joined.
 */
export function auctionLotToFixture(lot: FeaturedCar): CarFixture {
  return {
    ID: str(lot.ID),
    LOT: str(lot.LOT),
    AUCTION_TYPE: str(lot.AUCTION_TYPE),
    AUCTION_DATE: str(lot.AUCTION_DATE),
    AUCTION: str(lot.AUCTION),
    MARKA_ID: str(lot.MARKA_ID),
    MODEL_ID: str(lot.MODEL_ID),
    MARKA_NAME: str(lot.MARKA_NAME),
    MODEL_NAME: str(lot.MODEL_NAME),
    YEAR: str(lot.YEAR),
    TOWN: str(lot.TOWN),
    ENG_V: str(lot.ENG_V),
    PW: str(lot.PW),
    KUZOV: str(lot.KUZOV),
    GRADE: str(lot.GRADE),
    COLOR: str(lot.COLOR),
    KPP: str(lot.KPP),
    KPP_TYPE: str(lot.KPP_TYPE),
    PRIV: str(lot.PRIV),
    MILEAGE: str(lot.MILEAGE),
    EQUIP: str(lot.EQUIP),
    RATE: str(lot.RATE),
    START: str(lot.START),
    FINISH: str(lot.FINISH),
    STATUS: str(lot.STATUS),
    TIME: str(lot.TIME),
    AVG_PRICE: str(lot.AVG_PRICE),
    AVG_STRING: str(lot.AVG_STRING),
    LHDRIVE: str(lot.LHDRIVE),
    IMAGES: str(lot.IMAGES),
    SERIAL: str(lot.SERIAL),
    INFO: str(lot.INFO),
    premium_images: null,
  };
}

export function parseImages(imagesStr: string): string[] {
  return imagesStr.split("#").map((s) => s.trim()).filter(Boolean);
}

export function carTitle(car: Pick<CarFixture, "MARKA_NAME" | "MODEL_NAME">): string {
  return [car.MARKA_NAME, car.MODEL_NAME]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" ");
}
