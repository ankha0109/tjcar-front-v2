import type { CarFixture } from "@/lib/carFixtures";
import type { CarItem } from "@/types/car";
import type { KoreaListing, KoreaPhoto } from "@/types/korea";

// CARAPIS serves normalized webp copies under its own host; a relative photo
// `url` needs this prefix. `original_url` is already absolute (the source CDN).
const CARAPIS_MEDIA_HOST = "https://api.carapis.com";

const num = (v: unknown): number | undefined => {
  if (v === null || v === undefined || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

const str = (v: unknown): string =>
  v === null || v === undefined ? "" : String(v);

/** Resolve an aggregator-hosted photo to a browsable absolute URL (webp). */
function photoUrl(p: KoreaPhoto): string {
  if (!p.url) return "";
  return p.url.startsWith("http") ? p.url : CARAPIS_MEDIA_HOST + p.url;
}

function imageUrls(listing: KoreaListing): string[] {
  const source = listing.photos?.length
    ? listing.photos
    : listing.thumb
      ? [listing.thumb]
      : [];
  return source.map(photoUrl).filter(Boolean);
}

/**
 * Map a Korea catalog vehicle into the shared `CarItem` view model the card /
 * list / table views read. `source: "korea"` is load-bearing: the views only
 * apply the Japanese auction CDN image-sizing when `source === "japan"`, so
 * CARAPIS photo URLs pass through untouched. `price.mnt` is the server-computed
 * value (USD × live rate); `original` carries the raw USD price.
 */
export function koreaListingToCarItem(listing: KoreaListing): CarItem {
  return {
    id: str(listing.id),
    source: "korea",
    marka: listing.brand_name ?? "",
    model: listing.model_name ?? "",
    grade: listing.trim || undefined,
    year: listing.year != null ? String(listing.year) : undefined,
    images: imageUrls(listing),
    price: {
      original: { amount: num(listing.price_usd) ?? 0, currency: "USD" },
      mnt: num(listing.price_mnt) ?? 0,
    },
    mileageKm: num(listing.mileage),
    engineCc: num(listing.engine_cc),
    transmission: listing.transmission || undefined,
    color:
      listing.color && listing.color !== "unknown"
        ? listing.color
        : undefined,
    bodyType: listing.body_type || undefined,
    location: listing.region || undefined,
  };
}

/**
 * Map a Korea catalog vehicle into the AJES-shaped `CarFixture` the detail UI
 * reads. Catalog vehicles have no auction/inspection semantics, so those fields
 * stay empty. The upstream source is intentionally never surfaced. Price is shown
 * via the list card, not here (detail is rendered with `hidePrice`).
 */
export function koreaListingToFixture(listing: KoreaListing): CarFixture {
  return {
    ID: str(listing.id),
    LOT: "",
    AUCTION_TYPE: "",
    AUCTION_DATE: "",
    AUCTION: "",
    MARKA_ID: "",
    MODEL_ID: "",
    MARKA_NAME: str(listing.brand_name),
    MODEL_NAME: str(listing.model_name),
    YEAR: listing.year != null ? String(listing.year) : "",
    TOWN: str(listing.region),
    ENG_V: listing.engine_cc ? String(listing.engine_cc) : "",
    PW: "",
    KUZOV: str(listing.body_type),
    GRADE: str(listing.trim),
    COLOR:
      listing.color && listing.color !== "unknown" ? str(listing.color) : "",
    KPP: str(listing.transmission),
    KPP_TYPE: "",
    PRIV: "",
    MILEAGE: listing.mileage != null ? String(listing.mileage) : "",
    EQUIP: (listing.features ?? []).join(", "),
    RATE: "",
    START: "",
    FINISH: "",
    STATUS: "",
    TIME: "",
    AVG_PRICE: "",
    AVG_STRING: "",
    LHDRIVE: "",
    IMAGES: imageUrls(listing).join("#"),
    SERIAL: "",
    INFO: str(listing.description),
    premium_images: null,
  };
}
