/**
 * Compare snapshot builders. `CompareItem` is the same lean snapshot shape as
 * `WishlistItem` (see `src/types/compare.ts`), so the wishlist builders are
 * reused as-is under compare names.
 */
export {
  wishlistItemFromCarItem as compareItemFromCarItem,
  wishlistItemFromFixture as compareItemFromFixture,
} from "@/lib/wishlist";
