import Api from "./Api";
import type { CarSource } from "@/types/car";
import type { WishlistItem } from "@/types/wishlist";

/**
 * Authenticated wishlist API. The server stores `(source, external_id)` plus the
 * whole `WishlistItem` as `snapshot`, and returns ready-to-render items (see the
 * Laravel WishlistResource). Requests flow through `/api/v1`, which attaches
 * the bearer token from the NextAuth session.
 */

type ListResponse = { data: WishlistItem[] };
type ItemResponse = { data: WishlistItem };

function toPayload(item: WishlistItem) {
  return { source: item.source, external_id: item.id, snapshot: item };
}

export async function getWishlist(): Promise<WishlistItem[]> {
  const res = await Api.get<ListResponse>("/wishlists");
  return res.data ?? [];
}

export async function addWishlist(item: WishlistItem): Promise<WishlistItem> {
  const res = await Api.post<ItemResponse>("/wishlists", toPayload(item));
  return res.data;
}

export async function removeWishlist(
  source: CarSource,
  id: string,
): Promise<void> {
  await Api.delete(`/wishlists/${source}/${encodeURIComponent(id)}`);
}

export async function syncWishlist(
  items: WishlistItem[],
): Promise<WishlistItem[]> {
  const res = await Api.post<ListResponse>("/wishlists/sync", {
    items: items.map(toPayload),
  });
  return res.data ?? [];
}
