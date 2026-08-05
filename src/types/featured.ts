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
   * upcoming `main` lots off AVG_PRICE or the comparable average — see
   * LandedPriceEstimator in the API.
   */
  PRICE_MNT?: number | null;
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
