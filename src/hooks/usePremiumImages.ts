"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getPremiumImage,
  isSettled,
  requestPremiumImages,
  type PremiumImageFilters,
  type ScrapeRequest,
} from "@/services/premiumImages";

export const PREMIUM_IMAGES_KEY = ["premium-images"] as const;

/** How often to ask whether the scrape has finished. */
const POLL_MS = 3_000;
/** Matches ScrapeAuctionImages::$timeout on the API — past this it cannot still be running. */
const GIVE_UP_MS = 120_000;

export type PremiumImagesPhase = "idle" | "loading" | "completed" | "failed";

export type UsePremiumImagesInput = {
  /** `isPremium && !locked`, as PremiumGallery already computes them. */
  enabled: boolean;
  auctionId: string;
  /** Urls already delivered by GET /japan/{id}. Non-empty means: ask for nothing. */
  seed: string[] | null;
  filters: PremiumImageFilters;
};

export type UsePremiumImagesResult = {
  /** Premium urls, or [] until they arrive. */
  images: string[];
  status: PremiumImagesPhase;
};

/**
 * Drives the premium (USS) photo scrape for one auction lot.
 *
 * Three ways this settles, cheapest first:
 *
 *  1. `seed` is non-empty — the API already returned completed photos with the
 *     lot itself. Nothing is requested.
 *  2. The POST comes back `completed` — the backend deduped onto a finished
 *     request for the same `auction_id`. No polling.
 *  3. The POST comes back `pending`/`processing` — poll its uuid until it
 *     settles or the operation's total budget ({@link GIVE_UP_MS}, counted
 *     from the moment the lot starts work — POST included, not just polling)
 *     elapses.
 *
 * Exhausting the budget stops the *polling*, it does not close the case: the
 * query stays enabled so `refetchOnWindowFocus` can still land a late
 * `completed`, and the derivation below checks `completed` before `gaveUp`, so
 * that late answer wins and the strip flips from failed to completed.
 *
 * A `seed` of `[]` is NOT treated as done: an empty array means a scrape
 * finished and found no photos, and re-asking costs one round-trip that the
 * backend answers from the same completed row.
 *
 * Any error — 401, 403, 422, network — settles as `failed`. The caller is
 * expected to keep the ordinary auction photos on screen regardless, so a
 * failure degrades to "no extra photos", never to a blank gallery. A POST
 * that never resolves at all is covered too: the budget above is armed the
 * moment the lot starts work, not only once a `uuid` exists to poll.
 *
 * The hook works one lot (`auctionId`) at a time. If `auctionId` changes on a
 * live instance, `uuid`/`postResult`/`postFailed`/`gaveUp`/`startedAt` are
 * reset synchronously during render — not in an effect — so a render that
 * pairs lot B's identity with lot A's `image_urls` can never happen, not
 * even for one paint.
 */
export function usePremiumImages({
  enabled,
  auctionId,
  seed,
  filters,
}: UsePremiumImagesInput): UsePremiumImagesResult {
  const seeded = (seed?.length ?? 0) > 0;
  const shouldRun = enabled && !seeded;

  const [uuid, setUuid] = useState<string | null>(null);
  const [postResult, setPostResult] = useState<ScrapeRequest | null>(null);
  const [postFailed, setPostFailed] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  /**
   * When the current lot's operation began; `null` until it does. Drives the
   * single end-to-end {@link GIVE_UP_MS} budget (POST + polling combined),
   * rather than a budget that only starts once polling does.
   */
  const [startedAt, setStartedAt] = useState<number | null>(null);
  /** Which `auctionId` the four fields above currently describe. */
  const [trackedAuctionId, setTrackedAuctionId] = useState<string | null>(null);

  // Reset for a new lot *during render*, not in an effect: calling a state
  // setter with a changed value here makes React discard this render and
  // redo it immediately with the new state, before anything commits. That is
  // what guarantees lot B can never paint lot A's `uuid`/`postResult` — an
  // effect-based reset would still allow one committed frame of stale data
  // between `auctionId` changing and the effect running.
  //
  // Deliberately NOT gated on `shouldRun`: navigating from a mid-scrape lot
  // into one that arrives already seeded must still clear `uuid`, or the old
  // lot's poll keeps firing every few seconds behind the new lot's photos.
  if (trackedAuctionId !== auctionId) {
    setTrackedAuctionId(auctionId);
    setUuid(null);
    setPostResult(null);
    setPostFailed(false);
    setGaveUp(false);
    // The budget is armed only once there is work to budget for. A lot that
    // is tracked while still locked (session/wallet resolving) would
    // otherwise burn part of its 120s before the POST is even allowed.
    setStartedAt(shouldRun ? Date.now() : null);
  } else if (shouldRun && startedAt === null) {
    // Work became possible after this lot was first tracked — the gate opened.
    // Arm the budget from now, not retroactively.
    setStartedAt(Date.now());
  }

  /** Guards the POST itself: fire once per lot, not once per mount. */
  const requestedAuctionId = useRef<string | null>(null);

  useEffect(() => {
    if (!shouldRun || requestedAuctionId.current === auctionId) return;
    requestedAuctionId.current = auctionId;

    let cancelled = false;
    let resolved = false;

    requestPremiumImages(auctionId, filters)
      .then((request) => {
        resolved = true;
        if (cancelled) return;
        setPostResult(request);
        if (!isSettled(request)) setUuid(request.uuid);
      })
      .catch(() => {
        resolved = true;
        if (!cancelled) setPostFailed(true);
      });

    return () => {
      cancelled = true;
      // This run's result is about to be thrown away. If it had not landed
      // yet, release the per-lot guard so a re-run can re-issue the POST —
      // without this, a double-invoked effect (StrictMode) discards the only
      // in-flight request and the lot waits out the whole budget for nothing.
      // Re-POSTing is safe: the API dedupes by `auction_id`.
      if (!resolved && requestedAuctionId.current === auctionId) {
        requestedAuctionId.current = null;
      }
    };
    // `filters` is rebuilt each render by the caller; the lot is what
    // identifies the work. `requestedAuctionId` is keyed by `auctionId`
    // (not a plain fire-once flag), which is what stops this from
    // re-POSTing on every `shouldRun` toggle for the same lot while still
    // firing again when `auctionId` actually changes — so `filters` is
    // deliberately left out of the deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldRun, auctionId]);

  const pollQuery = useQuery({
    queryKey: [...PREMIUM_IMAGES_KEY, uuid],
    queryFn: () => getPremiumImage(uuid as string),
    // Enabled purely by "is there something to poll". `gaveUp` stops the
    // *interval*, not the query: disabling it would also kill
    // `refetchOnWindowFocus`, and that focus refetch is the only way a lot
    // whose budget ran out while the tab was hidden ever recovers.
    enabled: uuid !== null,
    refetchInterval: (query) =>
      gaveUp || isSettled(query.state.data) ? false : POLL_MS,
    // The budget is wall-clock, so the polling must be too. Left off (the
    // default), React Query pauses the interval whenever the tab is hidden
    // while the give-up timer keeps running — backgrounding the tab for two
    // minutes would then report a failure no poll ever observed.
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    retry: false,
  });

  // One budget for the whole operation, POST included — not just polling.
  // Timed from `startedAt` (stamped the moment this lot started work), so a
  // POST that never resolves still gets cut off, and a slow POST doesn't buy
  // the polling phase a fresh 120s on top of its own latency.
  useEffect(() => {
    if (startedAt === null) return;

    const remaining = GIVE_UP_MS - (Date.now() - startedAt);
    if (remaining <= 0) {
      setGaveUp(true);
      return;
    }

    const timer = setTimeout(() => setGaveUp(true), remaining);
    return () => clearTimeout(timer);
  }, [startedAt]);

  // `enabled` is checked FIRST, and before anything can hand back urls: a
  // caller that has not opened the gate gets nothing, seeded or not. Premium
  // photos are a paid asset, so this contract is the guard — not the order in
  // which the caller happens to render its own locked state.
  if (!enabled) {
    return { images: [], status: "idle" };
  }

  if (seeded) {
    return { images: seed as string[], status: "completed" };
  }

  /** Newest snapshot of the request — NOT necessarily a terminal one. */
  const latest =
    pollQuery.data ?? (isSettled(postResult ?? undefined) ? postResult : null);

  // `completed` outranks every failure signal, so an answer that arrives after
  // the budget expired (via the focus refetch) still wins over `gaveUp`.
  if (latest?.status === "completed") {
    return { images: latest.image_urls ?? [], status: "completed" };
  }

  if (postFailed || gaveUp || pollQuery.isError || latest?.status === "failed") {
    return { images: [], status: "failed" };
  }

  return { images: [], status: "loading" };
}
