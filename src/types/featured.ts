export type FeaturedCar = {
  ID: string;
  PW: string;
  KPP: string;
  LOT: string;
  PRIV: string;
  RATE: string;
  TIME: string;
  TOWN: string;
  YEAR: string;
  COLOR: string;
  ENG_V: string;
  EQUIP: string;
  GRADE: string;
  KUZOV: string;
  START: string;
  FINISH: string;
  IMAGES: string;
  STATUS: string;
  AUCTION: string;
  LHDRIVE: string;
  MILEAGE: string;
  KPP_TYPE: string;
  MARKA_ID: string;
  MODEL_ID: string;
  AVG_PRICE: string;
  /**
   * Landed ("гар дээр ирэх") MNT price, computed server-side so no client call
   * is needed. Present on `/featured`, `/compare`, `/japan/{id}` and
   * `/japan/history`; ABSENT on the `/japan` list. Null when unpriceable.
   *
   * Basis differs by endpoint: sold `stats` rows price off their own FINISH,
   * upcoming `main` lots off AVG_PRICE, and on `/japan/{id}` — where the
   * upstream withholds AVG_PRICE on ~92% of rows — off the mean of the
   * comparable sales `/japan/history` returns. See JapanLandedPrice in the API.
   */
  PRICE_MNT?: number | null;
  /**
   * This lot's OWN hammer price (`FINISH`) run through the v1 vehicle-cost
   * calculator — the total MNT to land THIS car. `GET /japan/{id}` only; null
   * on an upcoming lot and on any lot the calculator declines (an auction with
   * no FOB row, a missing exchange rate).
   *
   * Not a second opinion on `PRICE_MNT`: that is a comparable-sales AVERAGE,
   * this is what this exact car fetched.
   */
  FINISH_LANDED_MNT?: number | null;
  /**
   * This lot's OPENING price (`START`) landed in tugrik — the floor the bid
   * form validates against. `GET /japan/{id}` only; null when the upstream
   * published no START, or when the calculator declined the lot.
   */
  START_LANDED_MNT?: number | null;
  AVG_STRING: string;
  MARKA_NAME: string;
  MODEL_NAME: string;
  AUCTION_DATE: string;
  AUCTION_TYPE: string;
  SERIAL?: string;
  INFO?: string;
  /**
   * Completed premium (USS scraper) photo urls for this lot, or null when no
   * scrape has finished. Present on `GET /japan/{id}` only — the `/japan` list
   * and `/compare` never populate it.
   */
  premium_images?: string[] | null;
};
