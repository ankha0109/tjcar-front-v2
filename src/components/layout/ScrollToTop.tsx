"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "@/i18n/navigation";

/**
 * How long to keep the page pinned to the top after a forward navigation.
 *
 * Tapping a `<Link>` is a *same-document* navigation: Next fetches an RSC
 * payload and patches the tree, so the browser never loads a document and never
 * resets the scroll itself — that has to happen in JS. On WebKit the scroll
 * position is owned by the scrolling thread, so when a navigation commits while
 * a flick is still settling, the outgoing offset is written back *after* both
 * Next's reset and ours: measured on a real iPhone as `y 0→151→217` across
 * roughly half a second, once as late as 1349ms.
 *
 * Only production builds show it. In development `<Link>` never prefetches, so
 * every tap costs a server round trip and the thread has long settled by the
 * time the route commits; with prefetch the payload is already cached and the
 * commit lands while the thread is still hot. Blink applies the write
 * synchronously either way, which is why desktop Chrome never reproduces it —
 * re-verified 2026-07-27 against a local production build over CDP: ~60 page
 * pairs, both shells, parked at 200px, every one of them landed at 0.
 *
 * A handful of `setTimeout` re-checks was tried here and did **not** hold on a
 * real iPhone — the scrolling thread reverts each write before the next lands.
 * Writing every frame does hold. It costs nothing in practice: it only runs on
 * forward navigations and stops the moment the reader touches the page.
 *
 * The window has to outlast the slowest host, not the fastest. Safari settles
 * within ~900ms, but every iOS browser is `WKWebView` — Chrome for iOS included,
 * since Apple allows no other engine — and the host app moves the scroll view
 * too: Chrome adjusts its `contentInset` as its own toolbars come back on
 * navigation, which lands later than anything Safari does. 900ms fixed Safari
 * and left Chrome broken; iOS Chrome is exactly where this was reported again
 * on 2026-07-27. Length is not a cost here — a real scroll releases the hold
 * immediately, so the only thing a long window changes is how long the page
 * stays put for a reader who has not touched it yet.
 */
const HOLD_TOP_MS = 2500;
/**
 * How far a finger has to travel before it counts as a deliberate scroll. A
 * finger still resting on the screen after the tap emits `touchmove` without
 * really going anywhere; a scroll clears this within the first move.
 */
const TOUCH_SLOP_PX = 10;

/**
 * Puts every forward navigation back at the top of the page.
 *
 * Next tries to do this itself but bails out when the incoming page's segment
 * top is already inside the viewport (`topOfElementInViewport` in
 * `layout-router.js`), which is always true for offsets smaller than the site
 * header — so those small offsets used to survive into the new page. Measured
 * again 2026-07-27 with this component off: parking 40px leaked 40px on every
 * pair tried. Both the old handler and the `experimental.appNewScrollHandler`
 * one carry the same bail-out (measured on 16.2.6: parking 19/40/64px leaked
 * identically with the flag on), so this cannot be replaced by that flag.
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

    // Then hold it there across the settling window. Two things an earlier
    // attempt got wrong on iOS, both verified on a real device: it skipped the
    // write whenever `window.scrollY` read 0 — which it does, because the main
    // thread has already applied Next's reset while the scrolling thread still
    // holds the old offset — and it let any `touchmove` end the hold, including
    // the one produced by a finger still resting on the screen after the tap.
    // So: write unconditionally, and let go only once a finger has actually
    // travelled far enough to mean it.
    let released = false;
    const release = () => {
      released = true;
    };
    const listen = { passive: true, once: true } as const;
    window.addEventListener("wheel", release, listen);
    window.addEventListener("keydown", release, listen);

    // Dragging the scrollbar produces neither `wheel` nor `keydown`, so a mouse
    // user would otherwise fight the hold for the whole window. Touch is
    // excluded on purpose: a `pointerdown` there is just a finger landing, which
    // is not yet a scroll — that case is what `TOUCH_SLOP_PX` below is for.
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== "touch") released = true;
    };
    window.addEventListener("pointerdown", onPointerDown, { passive: true });

    let touchOrigin: number | null = null;
    const onTouchStart = (event: TouchEvent) => {
      touchOrigin = event.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (event: TouchEvent) => {
      const y = event.touches[0]?.clientY;
      if (touchOrigin === null || y === undefined) return;
      if (Math.abs(y - touchOrigin) > TOUCH_SLOP_PX) released = true;
    };
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });

    const deadline = performance.now() + HOLD_TOP_MS;
    let frame = requestAnimationFrame(function hold() {
      if (released) return;
      window.scrollTo(0, 0);
      if (performance.now() < deadline) frame = requestAnimationFrame(hold);
    });

    return () => {
      released = true;
      cancelAnimationFrame(frame);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("wheel", release);
      window.removeEventListener("keydown", release);
    };
  }, [pathname]);

  return null;
}
