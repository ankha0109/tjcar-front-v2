"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "@/i18n/navigation";

/** How long to keep the page pinned to the top after a forward navigation. */
const HOLD_TOP_MS = 800;

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

    // Checking once here is enough on desktop, where the browser's own scroll
    // handling is synchronous and already done by the time this effect runs. iOS
    // Safari scrolls asynchronously after the navigation commits — measured on a
    // real iPhone as `y 0→151→217` over roughly half a second on a page entered
    // at the top — so a single check sees 0, finds nothing to correct, and the
    // page slides down afterwards. Hold the top across that window instead, and
    // let go the instant the reader actually touches the page so this can never
    // fight a real scroll.
    let cancelled = false;
    const release = () => {
      cancelled = true;
    };
    const listen = { passive: true, once: true } as const;
    window.addEventListener("touchstart", release, listen);
    window.addEventListener("wheel", release, listen);
    window.addEventListener("keydown", release, listen);

    const deadline = performance.now() + HOLD_TOP_MS;
    let frame = requestAnimationFrame(function hold() {
      if (cancelled) return;
      if (window.scrollY !== 0) window.scrollTo(0, 0);
      if (performance.now() < deadline) frame = requestAnimationFrame(hold);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      window.removeEventListener("touchstart", release);
      window.removeEventListener("wheel", release);
      window.removeEventListener("keydown", release);
    };
  }, [pathname]);

  return null;
}
