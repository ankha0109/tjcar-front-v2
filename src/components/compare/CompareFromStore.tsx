"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "@/i18n/navigation";
import { useCompare } from "@/hooks/useCompare";
import { buildCompareParam } from "@/types/compare";
import CompareEmptyState from "./CompareEmptyState";

const emptySubscribe = () => () => {};

/** False during SSR/hydration, true after — without a setState-in-effect. */
function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

/**
 * `/compare` without an `items` param: if the tray holds cars, canonicalize
 * them into the URL (so the comparison becomes refresh-safe and the tray can
 * clear); otherwise show the empty state. Rendering waits for hydration so the
 * SSR markup doesn't flash the empty block before the localStorage snapshot.
 */
export default function CompareFromStore() {
  const router = useRouter();
  const { items, count } = useCompare();
  const hydrated = useHydrated();

  useEffect(() => {
    if (hydrated && count > 0) {
      router.replace(`/compare?items=${buildCompareParam(items)}`);
    }
  }, [hydrated, count, items, router]);

  if (!hydrated || count > 0) return null;

  return <CompareEmptyState />;
}
