"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "@/i18n/navigation";

/**
 * Puts a forward navigation back at the top of the page.
 *
 * Next's App Router does that itself, but it bails out when the top edge of the
 * incoming page's segment is already inside the viewport — see
 * `topOfElementInViewport` in `next/dist/client/components/layout-router.js`:
 *
 *     // If the element's top edge is already in the viewport, exit early.
 *     if (topOfElementInViewport(instance, viewportHeight)) return
 *
 * Page content starts below the sticky site header (65px on desktop, 56px on
 * the phone shell), so its segment root sits that far down the document. Any
 * scroll position between 1px and the header height therefore passes that check
 * and the previous page's offset survives into the new page, which opens a few
 * dozen pixels scrolled down. Nudge the page once — a trackpad flick is enough
 * — and every link you follow after that lands off the top.
 *
 * This runs after Next's own layout-phase handler, so when Next did reset the
 * scroll there is nothing left above 0 to correct and this is a no-op; it only
 * ever fires inside that narrow window.
 *
 * Back/forward is deliberately left alone: the browser restores those positions
 * accurately by itself (verified up to five pages deep into the infinite auction
 * list) and competing with it is exactly how the old sessionStorage-based
 * restoration ended up dropping people at the wrong offset.
 */
export default function ScrollReset() {
  // Locale-stripped, so switching language is not treated as a route change and
  // keeps your place on the page.
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
    // Consume the flag whether or not it applies, so a popstate that changed
    // only the query string can't suppress the next real navigation.
    const wasHistoryTraversal = fromHistory.current;
    fromHistory.current = false;

    if (previous === null || previous === pathname) return;
    if (wasHistoryTraversal) return;
    // A `#hash` target is a legitimate non-zero position.
    if (window.location.hash) return;
    if (window.scrollY > 0) window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
