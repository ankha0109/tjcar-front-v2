import Api from "./Api";

/**
 * Premium (USS) auction photos — tjcar-api-v2 `Customer\PremiumImageController`.
 *
 * Client-side on purpose: a scrape runs for up to two minutes while the customer
 * watches the lot page, so these go through `Api`, which proxies via /api/v1 and
 * attaches the Sanctum bearer server-side.
 *
 * Both endpoints sit behind `auth:sanctum`, and the POST additionally requires a
 * wallet balance at or above the configured minimum — the caller is responsible
 * for not asking when the gate is shut (see `PremiumGallery`).
 */

export type ScrapeStatus = "pending" | "processing" | "completed" | "failed";

export type ScrapeRequest = {
  uuid: string;
  auction_id: string;
  status: ScrapeStatus;
  /** Localised label the API renders for the status. */
  status_label: string;
  /** Present only when `status === "completed"`. */
  image_urls?: string[];
  /** Present only when `status === "failed"`. */
  error_message?: string;
  completed_at: string | null;
  created_at: string | null;
};

export type PremiumImageFilters = {
  make: string;
  model: string;
  yearStart?: number;
  yearEnd?: number;
  mileageStart?: number;
  mileageEnd?: number;
  modelType?: string;
  gradeOrigin?: string;
  lotNumber?: string;
};

/**
 * POST /premium-images — ask for this lot's premium photos.
 *
 * The backend dedupes globally by `auction_id`: an in-flight or completed
 * request for the same lot (whoever started it) comes back as-is with 200
 * instead of queueing a second scrape, so calling this is cheap and idempotent
 * in practice. Only a lot whose latest attempt FAILED starts a fresh job.
 */
export async function requestPremiumImages(
  auctionId: string,
  filters: PremiumImageFilters,
): Promise<ScrapeRequest> {
  const res = await Api.post<{ data: ScrapeRequest }>("/premium-images", {
    auction_id: auctionId,
    ...filters,
  });
  return res.data;
}

/** GET /premium-images/{uuid} — poll one request. 404s once the uuid is unknown. */
export async function getPremiumImage(uuid: string): Promise<ScrapeRequest> {
  const res = await Api.get<{ data: ScrapeRequest }>(`/premium-images/${uuid}`);
  return res.data;
}

/** A request that will never change again — stop polling. */
export function isSettled(request: ScrapeRequest | undefined): boolean {
  return request?.status === "completed" || request?.status === "failed";
}
