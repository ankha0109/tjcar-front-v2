"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "@/i18n/navigation";

/**
 * When to re-check the scroll position after resetting it.
 *
 * Tapping a `<Link>` is a *same-document* navigation: Next fetches an RSC
 * payload and patches the tree, so the browser never loads a document and never
 * resets the scroll itself — that has to happen in JS. On WebKit (iOS Safari and
 * iOS Chrome alike) scrolling is driven off the main thread, so the outgoing
 * offset is re-applied by the compositor *after* the route commits: measured on
 * a real iPhone as `y 0→151→217` across roughly half a second, and once as late
 * as 1349ms. A single reset at commit time therefore reads 0, finds nothing to
 * correct, and the page slides back down a moment later. Blink applies the write
 * synchronously, which is why this never reproduces on desktop Chrome.
 *
 * Timeouts rather than a `requestAnimationFrame` hold loop: this covers the same
 * window in six wake-ups instead of ~150.
 */
const SETTLE_RECHECKS_MS = [80, 200, 450, 800, 1200, 1700];

/**
 * Puts every forward navigation back at the top of the page.
 *
 * Next tries to do this itself but bails out when the incoming page's segment
 * top is already inside the viewport (`topOfElementInViewport` in
 * `layout-router.js`), which is always true for offsets smaller than the site
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
    // earlier (`disableSmoothScrollDuringRouteTransition` → `scrollTop = 0`), so
    // the animation is invisible in the normal path — and in the path where Next
    // bails, a smooth scroll is an animation that a late compositor write can
    // cancel mid-flight, which is exactly what this component exists to survive.
    window.scrollTo({ top: 0 });

    // Let go the instant the reader actually scrolls, so a re-check can never
    // fight a real gesture. `touchmove`, deliberately not `touchstart`: a tap
    // fires touchstart too, so releasing on it would kill the window on the very
    // tap that opened this page.
    let released = false;
    const release = () => {
      released = true;
    };
    const listen = { passive: true, once: true } as const;
    window.addEventListener("touchmove", release, listen);
    window.addEventListener("wheel", release, listen);
    window.addEventListener("keydown", release, listen);

    const timers = SETTLE_RECHECKS_MS.map((delay) =>
      window.setTimeout(() => {
        if (released || window.scrollY === 0) return;
        window.scrollTo({ top: 0 });
      }, delay),
    );

    return () => {
      released = true;
      timers.forEach(window.clearTimeout);
      window.removeEventListener("touchmove", release);
      window.removeEventListener("wheel", release);
      window.removeEventListener("keydown", release);
    };
  }, [pathname]);

  return null;
}
