import type { CarItem, CarResource, CarStatus, CarType } from "@/types/car";
import { decodeAuctionText } from "@/utils/auctionInfo";

/**
 * `car_data.ENG_V` / `MILEAGE` are hand-typed strings and sometimes carry their
 * unit (`"1800cc"`), so a plain `Number()` would yield NaN. Take the leading
 * digits instead.
 */
const num = (v: unknown): number | undefined => {
  if (v === null || v === undefined || v === "") return undefined;
  const n = parseInt(String(v).replace(/[\s,]/g, ""), 10);
  return Number.isFinite(n) ? n : undefined;
};

const str = (v: unknown): string =>
  v === null || v === undefined ? "" : String(v);

/**
 * Cover + one hover frame. `CarCard` scrubs up to four, but stock photos are
 * served full-size (see below), so two is the compromise: the hover affordance
 * survives without four ~270KB downloads per card.
 */
const CARD_IMAGES = 2;

/**
 * An in-stock car, ready for the grid: the shared `CarItem` the card reads plus
 * the stock-only facts (`type`, `status`, `arrival_date`) that drive the badges,
 * the tabs and the client-side filters. Keeping them beside `CarItem` rather
 * than inside it leaves the shared view model untouched.
 */
export type StockCarItem = {
  car: CarItem;
  type: CarType | null;
  status: CarStatus;
  arrivalDate: string | null;
};

/**
 * Map a `CarResource` into the grid view model.
 *
 * Two things are load-bearing:
 * - `source: "stock"` keeps the card from applying the AJES `&w=` image sizing
 *   (our CDN ignores it) and routes the wishlist entry to `/garage/{id}`.
 * - `auction` carries only the hand-typed `RATE`, which is what lights up the
 *   card's grade badge. With no `date`/`lot`/`type` the countdown, the LOT row
 *   and the premium border all self-hide — no auction UI leaks onto a car we
 *   already own.
 */
export function carResourceToStockItem(res: CarResource): StockCarItem {
  const cd = res.car_data ?? {};
  const rate = str(cd.RATE).trim();
  const grade = decodeAuctionText(str(cd.GRADE)).trim();

  const car: CarItem = {
    id: String(res.id),
    source: "stock",
    marka: str(cd.MARKA_NAME),
    model: str(cd.MODEL_NAME),
    grade: grade || undefined,
    year: str(cd.YEAR) || undefined,
    // Original URLs on purpose — do NOT wrap these in `cdnImage(_, "card")`.
    // The backend only writes the `_w320`/`_h50` variants for post uploads;
    // `public/cars/*` has the original alone, and the derived name 403s. Once
    // the car upload path generates them too, switching this line back is the
    // whole change.
    images: (res.images ?? []).slice(0, CARD_IMAGES).filter(Boolean),
    price: {
      // In-stock cars are priced in tugrik outright — there is no source
      // currency to convert from.
      original: { amount: 0, currency: "JPY" },
      mnt: res.price ?? 0,
    },
    mileageKm: num(cd.MILEAGE),
    engineCc: num(cd.ENG_V),
    color: str(cd.COLOR) || undefined,
    bodyType: str(cd.KUZOV) || undefined,
    auction: rate ? { name: "", grade: rate } : undefined,
  };

  return {
    car,
    type: res.type,
    // The column is NOT NULL upstream; default anyway so a bad row still renders.
    status: res.status ?? "active",
    arrivalDate: res.arrival_date,
  };
}
