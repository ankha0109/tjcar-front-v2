// Backend: App\Http\Resources\Report\{ReportResource,PublicReportResource} (tjcar-api-v2)
// Contract: docs/frontend/reports-integration.md in the API repo.

export type ReportStatus = "unpaid" | "paid";

/** A purchased (or pending) vehicle history report. */
export type Report = {
  id: number;
  uuid: string;
  customer_id: number | null;
  inspection_id: number | null;
  /**
   * MySQL `decimal(10,0)` with no Eloquent cast, so this arrives as a STRING
   * from the live DB (sqlite tests return a number). Always coerce.
   */
  price: string | number;
  payment_type: "qpay" | "admin" | null;
  vin: string;
  plate_no: string | null;
  /** Free-form snapshot taken at purchase time — whatever the VIN search returned. */
  car_data: Record<string, unknown> | null;
  status: ReportStatus;
  /** Mongolian label from the backend enum — display as-is, do not re-translate. */
  status_label: string;
  finished: number; // 0 | 1
  /** Public S3 URL, but only once status is "paid" AND the file exists. */
  pdf: string | null;
  /**
   * Raw QPay payload, present on GET /reports/{uuid} so a reloaded payment
   * screen can re-render the QR. Null when no invoice was ever issued (e.g.
   * admin-created reports); absent from the list endpoint.
   */
  invoice?: QpayInvoice | null;
  /** "YYYY-MM-DD HH:mm:ss" (server local) — not ISO-8601. */
  created_at: string;
  updated_at: string;
};

/** Trimmed payload behind GET /reports/public/{jpReportId} (the PDF's QR target). */
export type PublicReport = {
  uuid: string;
  vin: string;
  car_data: Record<string, unknown> | null;
  pdf: string | null;
  created_at: string;
};

/** Raw QPay POST /v2/invoice response, stored and echoed back verbatim. */
export type QpayInvoice = {
  invoice_id: string;
  qr_text: string;
  /** base64 PNG WITHOUT the `data:image/png;base64,` prefix. */
  qr_image: string;
  qPay_shortUrl: string;
  /** One entry per bank app — render as deep links on mobile. */
  urls: Array<{ name: string; description: string; link: string }>;
};

/** POST /plates/search — Autobox lookup by licence plate. */
export type PlateSearchResult = {
  imported_date: string | null;
  mark_name: string | null;
  model_name: string | null;
  /** The VIN to feed into the report search. */
  modification_vin_no: string | null;
  cabin_no: string | null;
  build_year: string | null;
  build_month: string | null;
  car_plate: string;
};

/** POST /reports/search — JPStat demo lookup by VIN. */
export type VinSearchResult = {
  name: string;
  vin: string;
  company: string;
  model: string;
  year: string;
};

/**
 * The VIN search returns two different 200 shapes.
 *
 * `{ exists: true }` only ever appears for a token-bearing request whose
 * customer already bought this VIN — it MUST short-circuit the purchase, or
 * the customer pays twice for the same report.
 */
export type VinSearchResponse =
  | { exists: true; report_id: string }
  | { data: VinSearchResult };

/** Narrows the union above. */
export function isExistingReport(
  res: VinSearchResponse,
): res is { exists: true; report_id: string } {
  return "exists" in res && res.exists === true;
}

/** POST /reports — what the purchase endpoint hands back. */
export type CreateReportResult = {
  report_id: string;
  invoice: QpayInvoice;
};
