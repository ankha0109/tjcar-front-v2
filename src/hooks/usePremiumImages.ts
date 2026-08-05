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
  if (shouldRun && trackedAuctionId !== auctionId) {
    setTrackedAuctionId(auctionId);
    setUuid(null);
    setPostResult(null);
    setPostFailed(false);
    setGaveUp(false);
    setStartedAt(Date.now());
  }

  /** Guards the POST itself: fire once per lot, not once per mount. */
  const requestedAuctionId = useRef<string | null>(null);

  useEffect(() => {
    if (!shouldRun || requestedAuctionId.current === auctionId) return;
    requestedAuctionId.current = auctionId;

    let cancelled = false;

    requestPremiumImages(auctionId, filters)
      .then((request) => {
        if (cancelled) return;
        setPostResult(request);
        if (!isSettled(request)) setUuid(request.uuid);
      })
      .catch(() => {
        if (!cancelled) setPostFailed(true);
      });

    return () => {
      cancelled = true;
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
    enabled: uuid !== null && !gaveUp,
    refetchInterval: (query) => (isSettled(query.state.data) ? false : POLL_MS),
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

  if (seeded) {
    return { images: seed as string[], status: "completed" };
  }

  if (!enabled) {
    return { images: [], status: "idle" };
  }

  const settled =
    pollQuery.data ?? (isSettled(postResult ?? undefined) ? postResult : null);

  if (settled?.status === "completed") {
    return { images: settled.image_urls ?? [], status: "completed" };
  }

  if (postFailed || gaveUp || pollQuery.isError || settled?.status === "failed") {
    return { images: [], status: "failed" };
  }

  return { images: [], status: "loading" };
}
