"use client";

import { useCallback, useEffect, useRef } from "react";

type SentinelOptions = {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  /** React Query's `isFetchNextPageError` — the last page fetch is still failed. */
  isFetchNextPageError: boolean;
  fetchNextPage: () => void;
  /** How far ahead of the viewport the pull starts. */
  rootMargin?: string;
};

/**
 * Ref for the element below an infinite list that pulls the next page as it
 * scrolls into view.
 *
 * Two rules keep it off the API's throttle, both paid for by a real 429 storm on
 * `/japan` (page 3 requested 140 times in 20 seconds):
 *
 * 1. **The observer is built once.** `observe()` delivers an immediate callback
 *    carrying the element's current state, so an observer torn down and rebuilt
 *    whenever `isFetchingNextPage` flips re-fires the instant a fetch settles.
 *    With the sentinel still on screen that is an unbounded loop. The live
 *    values are read from a ref at callback time instead of captured, which is
 *    what lets one observer outlive every state change.
 * 2. **A failed page stops the automation.** `hasNextPage` still reads true
 *    after a 429 — it comes from the last SUCCESSFUL page's meta — so rule 1
 *    alone would only slow the loop down. Recovery is the user's call; callers
 *    render a retry control off `isFetchNextPageError`.
 */
export function useInfiniteScrollSentinel<
  T extends HTMLElement = HTMLDivElement,
>({
  hasNextPage,
  isFetchingNextPage,
  isFetchNextPageError,
  fetchNextPage,
  rootMargin = "600px",
}: SentinelOptions) {
  const sentinelRef = useRef<T | null>(null);
  const isIntersecting = useRef(false);
  const latest = useRef({
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    fetchNextPage,
  });

  // Declared before the effects that read it so it is already current by the
  // time they run in the same commit.
  useEffect(() => {
    latest.current = {
      hasNextPage,
      isFetchingNextPage,
      isFetchNextPageError,
      fetchNextPage,
    };
  });

  const pull = useCallback(() => {
    const state = latest.current;
    if (!isIntersecting.current) return;
    if (!state.hasNextPage) return;
    if (state.isFetchingNextPage || state.isFetchNextPageError) return;
    state.fetchNextPage();
  }, []);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (!entry) return;
        isIntersecting.current = entry.isIntersecting;
        if (entry.isIntersecting) pull();
      },
      { rootMargin },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [rootMargin, pull]);

  // A page that lands without pushing the sentinel back out of view produces no
  // new intersection event, so the chain would stall one page in. Top up when a
  // fetch settles — `pull`'s guards are what keep this from becoming the loop
  // rule 1 removed.
  useEffect(() => {
    if (!isFetchingNextPage) pull();
  }, [isFetchingNextPage, hasNextPage, isFetchNextPageError, pull]);

  return sentinelRef;
}
