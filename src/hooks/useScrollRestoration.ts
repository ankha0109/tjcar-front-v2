"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const KEY_PREFIX = "scroll:";

/**
 * Persists `window.scrollY` per URL in sessionStorage and restores it on mount.
 * Combined with a React Query cache that survives client navigation, this brings
 * the list back exactly where it was after returning from a detail page.
 *
 * Pass `ready` so restoration only runs once the (cached) content has rendered
 * and the page height is correct.
 */
export function useScrollRestoration(ready: boolean = true) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const key = `${KEY_PREFIX}${pathname}?${searchParams.toString()}`;
  const restoredRef = useRef(false);

  // Restore once, after the cached list has painted.
  useEffect(() => {
    if (!ready || restoredRef.current) return;
    restoredRef.current = true;
    const saved = sessionStorage.getItem(key);
    if (!saved) return;
    const y = Number(saved);
    if (!Number.isFinite(y)) return;
    // Double rAF: run after the browser/Next have done their own scroll handling
    // and the list height is in place.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => window.scrollTo(0, y));
    });
  }, [ready, key]);

  // Continuously save the scroll position for this URL.
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        sessionStorage.setItem(key, String(window.scrollY));
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [key]);
}
