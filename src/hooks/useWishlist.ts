"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { wishlistStore } from "@/lib/wishlistStore";
import {
  addWishlist,
  getWishlist,
  removeWishlist,
} from "@/services/wishlist";
import type { CarSource } from "@/types/car";
import type { WishlistItem } from "@/types/wishlist";

/** Shared query key so the sync gate (and any consumer) can seed/invalidate it. */
export const WISHLIST_KEY = ["wishlist"] as const;

/** Stable empty reference so memoised `items` doesn't churn while loading. */
const EMPTY_ITEMS: WishlistItem[] = [];

type UseWishlistResult = {
  items: WishlistItem[];
  count: number;
  /** False only while the authenticated list is still loading. */
  isReady: boolean;
  isAuthenticated: boolean;
  isWishlisted: (source: CarSource, id: string) => boolean;
  toggle: (item: WishlistItem) => void;
  remove: (source: CarSource, id: string) => void;
};

function sameCar(item: WishlistItem, source: CarSource, id: string): boolean {
  return item.source === source && item.id === id;
}

/**
 * One wishlist interface over two backends: guests use the localStorage store,
 * authenticated customers use the DB via React Query with optimistic updates so
 * hearts flip instantly. The guest store stays subscribed even when logged in so
 * the count is correct during the brief window before login-sync clears it.
 */
export function useWishlist(): UseWishlistResult {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const queryClient = useQueryClient();

  const localItems = useSyncExternalStore(
    wishlistStore.subscribe,
    wishlistStore.getSnapshot,
    wishlistStore.getServerSnapshot,
  );

  const query = useQuery({
    queryKey: WISHLIST_KEY,
    queryFn: getWishlist,
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  const addMutation = useMutation({
    mutationFn: addWishlist,
    onMutate: async (item) => {
      await queryClient.cancelQueries({ queryKey: WISHLIST_KEY });
      const prev = queryClient.getQueryData<WishlistItem[]>(WISHLIST_KEY) ?? [];
      queryClient.setQueryData<WishlistItem[]>(WISHLIST_KEY, [
        item,
        ...prev.filter((i) => !sameCar(i, item.source, item.id)),
      ]);
      return { prev };
    },
    onError: (_err, _item, ctx) => {
      if (ctx) queryClient.setQueryData(WISHLIST_KEY, ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: WISHLIST_KEY });
    },
  });

  const removeMutation = useMutation({
    mutationFn: ({ source, id }: { source: CarSource; id: string }) =>
      removeWishlist(source, id),
    onMutate: async ({ source, id }) => {
      await queryClient.cancelQueries({ queryKey: WISHLIST_KEY });
      const prev = queryClient.getQueryData<WishlistItem[]>(WISHLIST_KEY) ?? [];
      queryClient.setQueryData<WishlistItem[]>(
        WISHLIST_KEY,
        prev.filter((i) => !sameCar(i, source, id)),
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx) queryClient.setQueryData(WISHLIST_KEY, ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: WISHLIST_KEY });
    },
  });

  const items = useMemo(
    () => (isAuthenticated ? (query.data ?? EMPTY_ITEMS) : localItems),
    [isAuthenticated, query.data, localItems],
  );

  const isWishlisted = useCallback(
    (source: CarSource, id: string) =>
      items.some((i) => sameCar(i, source, id)),
    [items],
  );

  const toggle = useCallback(
    (item: WishlistItem) => {
      if (!isAuthenticated) {
        wishlistStore.toggle(item);
        return;
      }
      if (items.some((i) => sameCar(i, item.source, item.id))) {
        removeMutation.mutate({ source: item.source, id: item.id });
      } else {
        addMutation.mutate(item);
      }
    },
    [isAuthenticated, items, addMutation, removeMutation],
  );

  const remove = useCallback(
    (source: CarSource, id: string) => {
      if (isAuthenticated) removeMutation.mutate({ source, id });
      else wishlistStore.remove(source, id);
    },
    [isAuthenticated, removeMutation],
  );

  return {
    items,
    count: items.length,
    isReady: isAuthenticated ? !query.isLoading : true,
    isAuthenticated,
    isWishlisted,
    toggle,
    remove,
  };
}
