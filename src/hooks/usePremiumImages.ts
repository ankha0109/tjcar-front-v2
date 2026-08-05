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
 *     settles or {@link GIVE_UP_MS} elapses.
 *
 * A `seed` of `[]` is NOT treated as done: an empty array means a scrape
 * finished and found no photos, and re-asking costs one round-trip that the
 * backend answers from the same completed row.
 *
 * Any error — 401, 403, 422, network — settles as `failed`. The caller is
 * expected to keep the ordinary auction photos on screen regardless, so a
 * failure degrades to "no extra photos", never to a blank gallery.
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
  /** The POST is fire-once per mounted lot; a re-render must never repeat it. */
  const requested = useRef(false);

  useEffect(() => {
    if (!shouldRun || requested.current) return;
    requested.current = true;

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
    // `filters` is rebuilt each render by the caller; the lot is what identifies
    // the work, and the effect is fire-once anyway via `requested`.
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

  // Stop pretending after the job's own timeout has passed.
  useEffect(() => {
    if (uuid === null) return;
    const timer = setTimeout(() => setGaveUp(true), GIVE_UP_MS);
    return () => clearTimeout(timer);
  }, [uuid]);

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
