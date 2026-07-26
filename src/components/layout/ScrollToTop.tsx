"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "@/i18n/navigation";

/**
 * Smooth-scrolls to the top on every forward navigation.
 *
 * Needed because Next's own reset bails out when the incoming page's segment
 * top is already inside the viewport (`topOfElementInViewport` in
 * `layout-router.js`), which is always true for offsets smaller than the sticky
 * header — so those small offsets used to survive into the new page. Both the
 * old handler and the `experimental.appNewScrollHandler` one carry the same
 * bail-out (measured on 16.2.6: parking 19/40/64px leaked identically with the
 * flag on), so this cannot be replaced by that flag.
 *
 * Back/forward is deliberately skipped: the browser restores those positions
 * itself (verified deep into the infinite auction list), and scrolling to top
 * there would throw that position away.
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

    // Instant, not smooth. Next resets the scroll itself a few milliseconds
    // earlier (`disableSmoothScrollDuringRouteTransition` → `scrollTop = 0`),
    // so the animation is invisible in the normal path — but in the path where
    // Next bails, a smooth scroll is an animation that a late scroll settle can
    // cancel mid-flight, which is exactly what this component exists to survive.
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return null;
}
