"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "@/i18n/navigation";

/**
 * Publishes the page's scroll state on `<html>` for the rest of the app to read
 * in CSS:
 *
 * - `data-scrolled` — the page is off the very top (header swaps its background)
 * - `data-scroll-dir="up" | "down"` — the last meaningful scroll direction
 *   (mobile header and bottom nav slide out of the way on `down`)
 *
 * One listener for the whole app, on purpose. Two components each running their
 * own listener would drift apart mid-gesture, and driving this through React
 * state re-renders the entire client header on every direction flip — the
 * `scrolled` state this replaces did exactly that, unthrottled.
 */

/** Never hide the chrome inside the first screenful — it just looks broken. */
const HIDE_AFTER = 96;
/** Ignore sub-pixel/trackpad jitter so the header can't flicker in place. */
const DELTA = 6;

/** Gestures that mean the human moved the page, as opposed to the browser. */
const GESTURES = ["wheel", "touchmove", "pointerdown", "keydown"] as const;

export default function ScrollState() {
  const pathname = usePathname();
  // Cleared on every navigation, set again by the first real gesture. Without
  // it the browser's own scrolling would drive the chrome: restoring 4000px on
  // a back navigation reads exactly like a very fast scroll down, so returning
  // to a list would land you there with the header and bottom nav already gone.
  const gestured = useRef(false);

  useEffect(() => {
    const root = document.documentElement;
    let lastY = window.scrollY;
    let ticking = false;

    const apply = () => {
      ticking = false;
      const y = window.scrollY;
      const max = root.scrollHeight - window.innerHeight;
      // iOS rubber-band: scrollY runs negative at the top and past `max` at the
      // bottom. Reacting to it flips the direction twice per bounce.
      if (y < 0 || y > max) return;

      root.toggleAttribute("data-scrolled", y > 4);

      const delta = y - lastY;
      if (Math.abs(delta) < DELTA) return;
      // Track the position even while ignoring the direction, so the first
      // gesture after a programmatic jump measures from where the page is.
      lastY = y;
      if (!gestured.current) return;
      root.dataset.scrollDir = delta > 0 && y > HIDE_AFTER ? "down" : "up";
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(apply);
    };

    const onGesture = () => {
      gestured.current = true;
    };

    // Tabbing into hidden chrome has to bring it back, or focus lands
    // off-screen.
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-app-chrome]")) root.dataset.scrollDir = "up";
    };

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("focusin", onFocusIn);
    for (const type of GESTURES)
      window.addEventListener(type, onGesture, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("focusin", onFocusIn);
      for (const type of GESTURES) window.removeEventListener(type, onGesture);
    };
  }, []);

  // A new page always starts with the chrome visible, whichever way the last
  // page was being scrolled when the link was tapped — and whatever the browser
  // does to the scroll position on the way in.
  useEffect(() => {
    gestured.current = false;
    document.documentElement.dataset.scrollDir = "up";
  }, [pathname]);

  return null;
}
