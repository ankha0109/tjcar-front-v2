import type { CarFixture } from "@/lib/carFixtures";
import type { CarItem } from "@/types/car";
import type { ChinaListing } from "@/types/china";
import { withImageSize } from "@/utils/auctionImage";

const num = (v: unknown): number | undefined => {
  if (v === null || v === undefined || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

const str = (v: unknown): string =>
  v === null || v === undefined ? "" : String(v);

/** Full-size photo URLs on the AJES image host. */
function photoUrls(listing: ChinaListing): string[] {
  const urls = (listing.photos ?? []).map((p) => p.url).filter(Boolean);
  if (urls.length === 0 && listing.thumb) urls.push(listing.thumb);
  return urls;
}

/**
 * Map a China listing into the shared `CarItem` view model the card / list /
 * table views read. The views only resize photos for `source === "japan"`, so
 * the card-size variant (`&w=320`, ~46 KB against ~233 KB full size) is chosen
 * here — a 40-card page would otherwise pull every photo at full resolution.
 * `price.original` carries the raw yuan price, `price.mnt` the server's.
 *
 * @param opts.colorLabel localizes the AJES colour bucket. Without it the card
 *   shows the English bucket name ("Silver-Gray").
 */
export function chinaListingToCarItem(
  listing: ChinaListing,
  opts: { colorLabel?: (color: string) => string } = {},
): CarItem {
  const color = listing.color
    ? opts.colorLabel
      ? opts.colorLabel(listing.color)
      : listing.color
    : undefined;

  return {
    id: str(listing.id),
    source: "china",
    marka: listing.brand_name ?? "",
    model: listing.model_name ?? "",
    grade: listing.grade || undefined,
    year: listing.year != null ? String(listing.year) : undefined,
    images: photoUrls(listing).map((url) => withImageSize(url, "card")),
    price: {
      original: { amount: num(listing.price_cny) ?? 0, currency: "CNY" },
      mnt: num(listing.price_mnt) ?? 0,
    },
    mileageKm: num(listing.mileage),
    engineCc: num(listing.engine_cc),
    transmission: listing.transmission || undefined,
    color,
    location: listing.city || undefined,
  };
}

/**
 * Map a China listing into the AJES-shaped `CarFixture` the detail UI's shared
 * pieces (title, gallery, wishlist snapshot) read. Dealer stock has no
 * auction or inspection semantics, so those fields stay empty; the price and
 * the China-only specs render from ChinaDetail's own props.
 */
export function chinaListingToFixture(listing: ChinaListing): CarFixture {
  return {
    ID: str(listing.id),
    LOT: "",
    AUCTION_TYPE: "",
    AUCTION_DATE: "",
    AUCTION: "",
    MARKA_ID: str(listing.brand_id),
    MODEL_ID: str(listing.model_id),
    MARKA_NAME: str(listing.brand_name),
    MODEL_NAME: str(listing.model_name),
    YEAR: listing.year != null ? String(listing.year) : "",
    TOWN: str(listing.city),
    ENG_V: listing.engine_cc ? String(listing.engine_cc) : "",
    PW: listing.power ? String(listing.power) : "",
    KUZOV: "",
    GRADE: str(listing.grade),
    COLOR: str(listing.color),
    KPP: str(listing.transmission),
    KPP_TYPE: "",
    PRIV: str(listing.drive),
    MILEAGE: listing.mileage != null ? String(listing.mileage) : "",
    EQUIP: "",
    RATE: "",
    START: "",
    FINISH: "",
    STATUS: "",
    TIME: "",
    AVG_PRICE: "",
    AVG_STRING: "",
    LHDRIVE: "",
    // Full-size URLs: CarGallery picks the variant per slot itself.
    IMAGES: photoUrls(listing).join("#"),
    SERIAL: "",
    INFO: "",
    premium_images: null,
    PRICE_MNT: null, // China pricing renders from ChinaDetail's own props
    FINISH_LANDED_MNT: null, // dealer stock, not an auction lot
    START_LANDED_MNT: null, // and never bid on
  };
}
