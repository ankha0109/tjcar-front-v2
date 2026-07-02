"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { wishlistStore } from "@/lib/wishlistStore";
import { syncWishlist } from "@/services/wishlist";
import { WISHLIST_KEY } from "@/hooks/useWishlist";

/**
 * Merges a guest's localStorage wishlist into their account exactly once per
 * login. The unique `(customer_id, source, external_id)` constraint on the
 * backend makes the sync idempotent, so re-runs never duplicate. On success the
 * local store is cleared and the query cache is seeded with the merged list; on
 * failure the local items are kept and the guard resets for a later retry.
 * Rootless — mount once inside the session + query providers.
 */
export default function WishlistSyncGate() {
  const { status, data } = useSession();
  const queryClient = useQueryClient();
  const syncedFor = useRef<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") {
      syncedFor.current = null;
      return;
    }

    const userId = (data?.user as { id?: string | number } | undefined)?.id;
    const key = userId != null ? String(userId) : "authenticated";
    if (syncedFor.current === key) return;
    syncedFor.current = key;

    const local = wishlistStore.getAll();
    if (local.length === 0) {
      queryClient.invalidateQueries({ queryKey: WISHLIST_KEY });
      return;
    }

    syncWishlist(local)
      .then((merged) => {
        wishlistStore.clear();
        queryClient.setQueryData(WISHLIST_KEY, merged);
      })
      .catch(() => {
        syncedFor.current = null;
      });
  }, [status, data, queryClient]);

  return null;
}
