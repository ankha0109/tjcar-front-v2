import type { CarFixture } from "@/lib/carFixtures";
import type { CarItem } from "@/types/car";
import type { KoreaListing } from "@/types/korea";

const num = (v: unknown): number | undefined => {
  if (v === null || v === undefined || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

const str = (v: unknown): string =>
  v === null || v === undefined ? "" : String(v);

/** Backend rows already carry absolute Encar CDN photo URLs. */
function imageUrls(listing: KoreaListing): string[] {
  const urls = (listing.photos ?? []).map((p) => p.url ?? "").filter(Boolean);
  if (urls.length === 0 && listing.thumb) urls.push(listing.thumb);
  return urls;
}

/**
 * Map a Korea catalog vehicle into the shared `CarItem` view model the card /
 * list / table views read. `source: "korea"` is load-bearing: the views only
 * apply the Japanese auction CDN image-sizing when `source === "japan"`, so
 * Encar photo URLs pass through untouched. `price.mnt` is the server-computed
 * value (KRW × config rate); `original` carries the raw KRW price.
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
      original: { amount: num(listing.price_krw) ?? 0, currency: "KRW" },
      mnt: num(listing.price_mnt) ?? 0,
    },
    mileageKm: num(listing.mileage),
    engineCc: num(listing.displacement),
    transmission: listing.transmission || undefined,
    color: listing.color || undefined,
    bodyType: listing.body_type || undefined,
    location: listing.region || undefined,
  };
}

/**
 * Map a Korea catalog vehicle into the AJES-shaped `CarFixture` the detail UI
 * reads. Catalog vehicles have no auction/inspection semantics, so those fields
 * stay empty. Pricing + the official Encar link render from EncarDetail's `encar`
 * prop, not from the fixture.
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
    // Detail rows carry the full Encar model line (더 뉴 그랜저 IG); list rows
    // only have model_name.
    MODEL_NAME: str(listing.model_detail ?? listing.model_name),
    YEAR: listing.year != null ? String(listing.year) : "",
    TOWN: str(listing.region),
    ENG_V: listing.displacement ? String(listing.displacement) : "",
    PW: "",
    KUZOV: str(listing.body_type),
    GRADE: str(listing.trim),
    COLOR: str(listing.color),
    KPP: str(listing.transmission),
    KPP_TYPE: "",
    PRIV: "",
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
    IMAGES: imageUrls(listing).join("#"),
    SERIAL: "",
    INFO: "",
    premium_images: null,
  };
}
