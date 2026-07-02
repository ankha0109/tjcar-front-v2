import type { CarItem, CarSource } from "@/types/car";
import type { WishlistItem } from "@/types/wishlist";
import { parseImages, type CarFixture } from "@/lib/carFixtures";

// Image index 0 is the auction evaluation (inspection) sheet whenever a car
// photo remains after it — same convention CarDetail uses to split its gallery.
const carPhoto = (images: string[]): string | undefined =>
  images[1] ?? images[0];
const evaluationSheet = (images: string[]): string | undefined =>
  images.length > 1 ? images[0] : undefined;

/** Build a saved-car snapshot from a listing-card `CarItem` (has MNT price). */
export function wishlistItemFromCarItem(car: CarItem): WishlistItem {
  return {
    source: car.source,
    id: car.id,
    marka: car.marka,
    model: car.model,
    grade: car.grade,
    year: car.year,
    thumbnail: carPhoto(car.images),
    evaluationImage: evaluationSheet(car.images),
    priceMnt: car.price.mnt,
    priceOriginal:
      car.price.original.amount > 0 ? car.price.original : undefined,
    auctionDate: car.auction?.date,
    auctionGrade: car.auction?.grade,
    lot: car.auction?.lot,
    savedAt: new Date().toISOString(),
  };
}

/**
 * Build a snapshot from a detail-page `CarFixture`. The fixture has no MNT
 * price, so callers pass it in (Korea/stock pages have `CarResource.price`);
 * Japan pages leave it 0 and fall back to the JPY start price for display.
 */
export function wishlistItemFromFixture(
  car: CarFixture,
  source: CarSource,
  priceMnt = 0,
): WishlistItem {
  const start = Number(car.START);
  const images = parseImages(car.IMAGES);

  return {
    source,
    id: car.ID,
    marka: car.MARKA_NAME,
    model: car.MODEL_NAME,
    grade: car.GRADE || undefined,
    year: car.YEAR || undefined,
    thumbnail: carPhoto(images),
    evaluationImage: evaluationSheet(images),
    priceMnt,
    priceOriginal:
      source === "japan" && Number.isFinite(start) && start > 0
        ? { amount: start, currency: "JPY" }
        : undefined,
    auctionDate: car.AUCTION_DATE || undefined,
    auctionGrade: car.RATE || undefined,
    lot: car.LOT || undefined,
    savedAt: new Date().toISOString(),
  };
}

/** Adapt a saved snapshot back into a `CarItem` so the wishlist page can reuse `CarCard`. */
export function wishlistItemToCarItem(item: WishlistItem): CarItem {
  const hasAuction = Boolean(item.auctionDate || item.auctionGrade || item.lot);
  return {
    id: item.id,
    source: item.source,
    marka: item.marka,
    model: item.model,
    grade: item.grade,
    year: item.year,
    images: item.thumbnail ? [item.thumbnail] : [],
    price: {
      original: item.priceOriginal ?? { amount: 0, currency: "JPY" },
      mnt: item.priceMnt,
    },
    auction: hasAuction
      ? {
          name: "",
          lot: item.lot,
          date: item.auctionDate,
          grade: item.auctionGrade,
        }
      : undefined,
  };
}
