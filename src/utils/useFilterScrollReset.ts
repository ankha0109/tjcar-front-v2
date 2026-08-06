"use client";

import { useCallback, useRef } from "react";

/**
 * Puts the viewport back at the top of a browser when its filters change.
 *
 * Changing a filter resets an infinite list to page 1, so every page the
 * visitor had scrolled through unmounts in a single commit. The document
 * collapses — measured on `/mn/japan`, 18,000px of results down to a 1,300px
 * spinner — and the browser clamps the scroll position to the bottom of what is
 * left. Scroll anchoring then *keeps* it pinned there while the new results
 * render in above it, so the visitor ends up at the very END of the list they
 * just asked for, staring at the footer.
 *
 * Call `scrollToTop` from the handlers that change a filter rather than from an
 * effect: it has to run in the same commit that empties the list, before the
 * browser has a shrunken document to clamp against.
 *
 * The offset that keeps the target clear of the fixed header comes from
 * `html { scroll-padding-top }` in `globals.css`, not from arithmetic here.
 */
export function useFilterScrollReset<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  const scrollToTop = useCallback(() => {
    ref.current?.scrollIntoView({ block: "start" });
  }, []);

  return { ref, scrollToTop };
}
