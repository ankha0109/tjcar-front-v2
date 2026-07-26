"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "@/i18n/navigation";

/**
 * How long to keep the page pinned to the top after a forward navigation.
 * Measured on a real iPhone: iOS re-applied the outgoing page's offset once more
 * *after* an 800ms window had closed, so the cap has to outlast the whole
 * settling period. It is safe to be this generous because any genuine scroll
 * gesture releases the hold immediately.
 */
const HOLD_TOP_MS = 2500;

/** Build marker, so a diagnostic screenshot identifies which code is live. */
export const SCROLL_RESET_BUILD = "reset@3";

/**
 * Reports to `ScrollDebugOverlay` when it is mounted, and costs one property
 * read otherwise. TEMPORARY — drop with the overlay.
 */
function probe(message: string) {
  (window as unknown as { __scrollProbe?: (m: string) => void }).__scrollProbe?.(
    message,
  );
}

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

    if (previous === null || previous === pathname) {
      probe(`skip first/same (${pathname})`);
      return;
    }
    if (wasHistoryTraversal) {
      probe(`skip pop (${pathname})`);
      return;
    }
    // A `#hash` target is a legitimate non-zero position.
    if (window.location.hash) {
      probe("skip hash");
      return;
    }

    // Checking once here is enough on desktop, where the browser's own scroll
    // handling is synchronous and already done by the time this effect runs. iOS
    // Safari scrolls asynchronously after the navigation commits — measured on a
    // real iPhone as `y 0→151→217` over roughly half a second on a page entered
    // at the top — so a single check sees 0, finds nothing to correct, and the
    // page slides down afterwards. Hold the top across that window instead, and
    // let go the instant the reader actually touches the page so this can never
    // fight a real scroll.
    let cancelled = false;
    const started = performance.now();
    probe(`hold start y=${Math.round(window.scrollY)}`);
    const release = (event: Event) => {
      cancelled = true;
      probe(`hold cancelled by ${event.type} @${Math.round(performance.now() - started)}ms`);
    };
    // `touchmove`, deliberately not `touchstart`: a tap fires touchstart too, so
    // releasing on it let the hold die the moment a finger landed anywhere —
    // including the tap that opened the page. Only actual finger movement (or a
    // wheel / key) means the reader is scrolling on purpose.
    const listen = { passive: true, once: true } as const;
    window.addEventListener("touchmove", release, listen);
    window.addEventListener("wheel", release, listen);
    window.addEventListener("keydown", release, listen);

    let pins = 0;
    let frames = 0;
    const deadline = started + HOLD_TOP_MS;
    let frame = requestAnimationFrame(function hold() {
      if (cancelled) return;
      frames++;
      if (window.scrollY !== 0) {
        pins++;
        probe(`pin ${Math.round(window.scrollY)}→0 @${Math.round(performance.now() - started)}ms`);
        window.scrollTo(0, 0);
      }
      if (performance.now() < deadline) {
        frame = requestAnimationFrame(hold);
      } else {
        probe(`hold end frames=${frames} pins=${pins} y=${Math.round(window.scrollY)}`);
      }
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      window.removeEventListener("touchmove", release);
      window.removeEventListener("wheel", release);
      window.removeEventListener("keydown", release);
    };
  }, [pathname]);

  return null;
}
