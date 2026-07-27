"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "@/i18n/navigation";

/**
 * Puts every forward navigation back at the top of the page.
 *
 * Tapping a `<Link>` is a *same-document* navigation: Next fetches an RSC
 * payload and patches the tree, so the browser never loads a document and never
 * resets the scroll itself. Next tries to do it instead — and bails out when the
 * incoming page segment's top edge is already inside the viewport:
 *
 *     if (topOfElementInViewport(domNode, viewportHeight)) return
 *     // elementTop >= 0 && elementTop <= viewportHeight
 *
 * (`layout-router.js`, verified in 16.2.6.) The segment's first node sits inside
 * `<main class="pt-(--header-h)">`, i.e. at document y = 56px on mobile / 65px on
 * desktop, so `rect.top` stays in range for every offset from 0 up to the header
 * height — and Next does nothing at all. At exactly that offset the top of the
 * page ends up hidden behind the fixed header, which is the bug this fixes.
 *
 * `experimental.appNewScrollHandler` is not an alternative: the Fragment-ref
 * handler carries the identical bail-out.
 *
 * Back/forward is deliberately skipped: the browser restores those positions
 * itself (verified deep into the infinite auction list), and scrolling to top
 * there would throw that position away.
 *
 * Scope note — this handles the deterministic bail-out only. On iOS a flick that
 * is still settling when the route commits can have its old offset written back
 * by the scrolling thread *after* this runs, which no single reset can catch.
 * That is a separate problem and is not addressed here.
 */
export default function ScrollToTop() {
  // Locale-stripped, so switching language keeps your place on the page.
  const pathname = usePathname();
  const lastPathname = useRef<string | null>(null);
  // The URL the last popstate landed on, not a boolean. This effect only runs
  // when the *pathname* changes, so a popstate that moved between two query
  // states of the same page (going back over a filter change on /japan, or the
  // iOS edge-swipe doing the same) never reaches it — a flag set there would
  // stay set and silently suppress the reset on the next forward navigation.
  // Comparing URLs makes the mark expire on its own: it can only ever match the
  // entry it was recorded for.
  const historyUrl = useRef<string | null>(null);

  useEffect(() => {
    const onPopState = () => {
      historyUrl.current = window.location.href;
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    const previous = lastPathname.current;
    lastPathname.current = pathname;
    const wasHistoryTraversal = historyUrl.current === window.location.href;
    historyUrl.current = null;

    if (previous === null || previous === pathname) return;
    if (wasHistoryTraversal) return;
    // A `#hash` target is a legitimate non-zero position.
    if (window.location.hash) return;

    // Instant, not smooth. In the path where Next does reset the scroll it has
    // already done so a few milliseconds earlier
    // (`disableSmoothScrollDuringRouteTransition` → `scrollTop = 0`), so there is
    // nothing to animate; in the path where it bails, a smooth scroll would be a
    // visible slide up from an offset the reader never chose.
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
