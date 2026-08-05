"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { reportDownloadUrl } from "@/services/reports";
import type { Report } from "@/types/report";
import { cn } from "@/utils";

/**
 * How long an unpaid QPay invoice stays payable.
 *
 * Mirrors `tjcar.qpay_retention.unpaid_expiry_days` in the API: past this the
 * scheduled prune drops the QR payload, so the invoice can never settle and the
 * report is dead. The backend has no status for it (`ReportStatus` is only
 * unpaid|paid), so the card derives it from `created_at` — keep the two numbers
 * in sync if the API config changes.
 */
const UNPAID_EXPIRY_DAYS = 7;

export type ReportPhase = "ready" | "preparing" | "awaiting-payment" | "expired";

/** `created_at` is "YYYY-MM-DD HH:mm:ss" server-local, not ISO — T-join it. */
function ageInDays(createdAt: string): number {
  const created = new Date(createdAt.replace(" ", "T")).getTime();
  if (Number.isNaN(created)) return 0;
  return (Date.now() - created) / 86_400_000;
}

export function reportPhase(report: Report): ReportPhase {
  if (report.status === "paid") {
    // `pdf` is the only honest "ready" signal — paid alone can still mean the
    // render queue has not finished.
    return report.pdf ? "ready" : "preparing";
  }
  return ageInDays(report.created_at) > UNPAID_EXPIRY_DAYS
    ? "expired"
    : "awaiting-payment";
}

/**
 * "TOYOTA PRIUS" out of whatever the VIN lookup stored. `car_data` is a
 * free-form snapshot (JPStat's `{name, company, model, year}`), and
 * admin-created reports may carry none of it — fall back to the VIN.
 */
function carTitle(report: Report): string {
  const data = (report.car_data ?? {}) as Record<string, unknown>;
  const str = (key: string) =>
    typeof data[key] === "string" ? (data[key] as string).trim() : "";

  return str("name") || [str("company"), str("model")].filter(Boolean).join(" ");
}

function carYear(report: Report): string {
  const data = (report.car_data ?? {}) as Record<string, unknown>;
  const year = data.year;
  return typeof year === "string" || typeof year === "number" ? String(year) : "";
}

const PHASE_TONE: Record<ReportPhase, string> = {
  ready:
    "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20",
  preparing:
    "bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-400/20",
  "awaiting-payment":
    "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-400/20",
  expired:
    "bg-neutral-100 text-neutral-500 ring-neutral-500/20 dark:bg-neutral-800 dark:text-neutral-400 dark:ring-neutral-400/20",
};

/**
 * One report in the dashboard grid.
 *
 * The whole card navigates to the report screen through a stretched overlay
 * link, which leaves the PDF download a sibling anchor rather than a nested one
 * — the two actions lead to different places and must not be one hit target.
 *
 * The status pill is built from `status` + the derived phase, not from the
 * API's `status_label`: that label is hardcoded Mongolian in the backend enum
 * and would leak into the en/ru dashboards.
 */
export default function ReportCard({ report }: { report: Report }) {
  const t = useTranslations("dashboard.reports");
  const phase = reportPhase(report);
  const title = carTitle(report);
  const year = carYear(report);
  const isExpired = phase === "expired";

  return (
    <li
      className={cn(
        "group relative flex flex-col rounded-xl border border-neutral-200 bg-white p-4 transition-colors dark:border-neutral-800 dark:bg-neutral-900",
        isExpired
          ? "opacity-75 hover:opacity-100"
          : "hover:border-primary/50 hover:shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
      )}
    >
      {/* Stretched link: covers the card, sits under the explicit actions. */}
      <Link
        href={`/report/${report.uuid}`}
        className="absolute inset-0 z-0 rounded-xl"
        aria-label={title || report.vin}
      />

      <div className="relative z-10 flex items-start justify-between gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
            PHASE_TONE[phase],
          )}
        >
          {phase === "preparing" && (
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
          )}
          {t(`phase.${phase}`)}
        </span>
        <span className="shrink-0 text-[11.5px] text-neutral-400 dark:text-neutral-500">
          {report.created_at?.slice(0, 10)}
        </span>
      </div>

      <div className="mt-3 min-w-0">
        <p className="truncate text-[14px] font-semibold text-neutral-900 dark:text-neutral-100">
          {title || t("unknownCar")}
        </p>
        <p className="mt-0.5 text-[12px] text-neutral-500 dark:text-neutral-400">
          {[year, `${Number(report.price).toLocaleString("mn-MN")}₮`]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>

      <div className="mt-3 rounded-lg bg-neutral-50 px-3 py-2 dark:bg-neutral-800/60">
        <p className="text-[10px] font-semibold uppercase text-neutral-400 dark:text-neutral-500">
          {t("vin")}
        </p>
        <p className="truncate text-[13px] font-medium tabular-nums text-neutral-800 dark:text-neutral-200">
          {report.vin}
        </p>
      </div>

      {/* `mt-auto` pins the footer to the bottom, so a two-line car name in one
          card does not push its button out of line with the rest of the row. */}
      <div className="relative z-10 mt-auto flex items-center gap-2 pt-4">
        {phase === "ready" ? (
          <a
            href={reportDownloadUrl(report.uuid)}
            download
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-2 text-[13px] font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
          >
            <DownloadIcon />
            {t("download")}
          </a>
        ) : null}

        {phase === "awaiting-payment" ? (
          <Link
            href={`/report/${report.uuid}`}
            className="inline-flex flex-1 items-center justify-center rounded-lg bg-primary px-3 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
          >
            {t("pay")}
          </Link>
        ) : null}

        {/* No button to give these two — the pill already names the state, so
            the footer carries the "what now" line instead of repeating it. */}
        {phase === "preparing" || phase === "expired" ? (
          <span className="text-[12.5px] text-neutral-500 dark:text-neutral-400">
            {phase === "preparing" ? t("preparingHint") : t("expiredHint")}
          </span>
        ) : null}
      </div>
    </li>
  );
}

function DownloadIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  );
}
