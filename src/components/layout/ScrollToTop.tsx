"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "@/i18n/navigation";

/**
 * Smooth-scrolls to the top on every forward navigation.
 *
 * Needed because Next's own reset bails out when the incoming page's segment
 * top is already inside the viewport (`topOfElementInViewport` in
 * `layout-router.js`), which is always true for offsets smaller than the sticky
 * header — so those small offsets used to survive into the new page.
 *
 * Back/forward is deliberately skipped: the browser restores those positions
 * itself (verified deep into the infinite auction list), and scrolling to top
 * there would throw that position away.
 */
export default function ScrollToTop() {
  // Locale-stripped, so switching language keeps your place on the page.
  const pathname = usePathname();
  const lastPathname = useRef<string | null>(null);
  const fromHistory = useRef(false);

  useEffect(() => {
    const onPopState = () => {
      fromHistory.current = true;
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    const previous = lastPathname.current;
    lastPathname.current = pathname;
    // Consume the flag either way, so a query-only popstate can't suppress the
    // next real navigation.
    const wasHistoryTraversal = fromHistory.current;
    fromHistory.current = false;

    if (previous === null || previous === pathname) return;
    if (wasHistoryTraversal) return;
    // A `#hash` target is a legitimate non-zero position.
    if (window.location.hash) return;

    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);

  return null;
}
