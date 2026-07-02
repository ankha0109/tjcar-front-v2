"use client";

import { useCallback, useSyncExternalStore } from "react";
import { compareStore, type CompareToggleResult } from "@/lib/compareStore";
import type { CarSource } from "@/types/car";
import { MAX_COMPARE, type CompareItem } from "@/types/compare";

/**
 * Compare tray hook. Unlike `useWishlist` there is no authenticated/DB backend
 * — the tray is deliberately device-local (spec: no per-user persistence) and
 * clears itself once a comparison succeeds on `/compare`.
 */
export function useCompare() {
  const items = useSyncExternalStore(
    compareStore.subscribe,
    compareStore.getSnapshot,
    compareStore.getServerSnapshot,
  );

  const isCompared = useCallback(
    (source: CarSource, id: string) =>
      items.some((item) => item.source === source && item.id === id),
    [items],
  );

  const toggle = useCallback(
    (item: CompareItem): CompareToggleResult => compareStore.toggle(item),
    [],
  );

  const remove = useCallback(
    (source: CarSource, id: string) => compareStore.remove(source, id),
    [],
  );

  const clear = useCallback(() => compareStore.clear(), []);

  return {
    items,
    count: items.length,
    isFull: items.length >= MAX_COMPARE,
    isCompared,
    toggle,
    remove,
    clear,
  };
}
