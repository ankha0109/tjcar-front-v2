import Api from "./Api";
import type { Paginated } from "@/types/api";
import type {
  CreateReportResult,
  PlateSearchResult,
  Report,
  VinSearchResponse,
} from "@/types/report";

/**
 * Vehicle history reports (tjcar-api-v2 phases 12–14).
 *
 * Client-side on purpose: every call here is part of an interactive flow
 * (search → buy → poll for payment → poll for PDF), so it goes through `Api`,
 * which proxies via /api/v1 and attaches the Sanctum bearer server-side.
 *
 * The one endpoint deliberately NOT wrapped here is the PDF download: the
 * /api/v1 proxy runs `response.json()` on every reply, which would corrupt the
 * binary. Use `reportDownloadUrl()` below and let the browser fetch it.
 */

/** POST /plates/search — resolve a licence plate to a VIN via Autobox. */
export async function searchPlate(plate: string): Promise<PlateSearchResult> {
  const res = await Api.post<{ data: PlateSearchResult }>("/plates/search", {
    plate,
  });
  return res.data;
}

/**
 * POST /reports/search — look a VIN up in JPStat.
 *
 * Returns the raw union: `{ data }` when the car was found, or
 * `{ exists: true, report_id }` when this customer already owns a report for
 * the VIN. Narrow it with `isExistingReport` — skipping that check makes the
 * customer pay twice. A miss throws `ApiError` 422 whose `message` contains
 * HTML (`<br/>`).
 */
export function searchVin(vin: string): Promise<VinSearchResponse> {
  return Api.post<VinSearchResponse>("/reports/search", { vin });
}

/** GET /reports — the authenticated customer's reports, newest first. */
export function listReports(page = 1, perPage = 20): Promise<Paginated<Report>> {
  return Api.get<Paginated<Report>>("/reports", {
    page,
    per_page: perPage,
  });
}

/**
 * POST /reports — register the request and open a QPay invoice.
 *
 * The price is decided server-side from the `report-price` config (and the
 * discount window when one is open), so nothing price-related is sent.
 *
 * On a QPay failure this throws `ApiError` 422 "Төлбөрийн системд алдаа
 * гарлаа" — and the report row still exists backend-side (v1 parity, no
 * transaction), so retrying creates a second unpaid report.
 */
export async function createReport(input: {
  vin: string;
  car_data: Record<string, unknown>;
  plate_no?: string;
}): Promise<CreateReportResult> {
  const res = await Api.post<{ data: CreateReportResult }>("/reports", input);
  return res.data;
}

/** GET /reports/{uuid} — one report. Any authenticated holder of the uuid can read it. */
export async function getReport(uuid: string): Promise<Report> {
  const res = await Api.get<{ data: Report }>(`/reports/${uuid}`);
  return res.data;
}

/**
 * POST /payments/qpay/{uuid}/check — ask QPay whether the invoice is settled.
 *
 * Read-only: it never marks the report paid and never starts the PDF job —
 * that is the webhook's job. So `true` here means "money arrived", NOT "report
 * ready"; keep polling `getReport` for `pdf` afterwards.
 */
export async function checkPayment(uuid: string): Promise<boolean> {
  const res = await Api.post<{ data: { paid: boolean } }>(
    `/payments/qpay/${uuid}/check`,
    {},
  );
  return res.data.paid;
}

/**
 * Absolute URL of the PDF download endpoint (public — the uuid is the
 * credential). Bypasses the /api/v1 proxy on purpose; see the note above.
 */
export function reportDownloadUrl(uuid: string): string {
  return `${process.env.NEXT_PUBLIC_API_URL}/reports/${uuid}/download`;
}
