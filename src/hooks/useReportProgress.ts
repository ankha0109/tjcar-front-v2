"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { checkPayment, getReport } from "@/services/reports";
import type { Report } from "@/types/report";

export const reportKey = (uuid: string) => ["report", uuid] as const;
export const reportPaymentKey = (uuid: string) =>
  ["report", uuid, "payment"] as const;

/** How long a phase may stall before we stop pretending it is still normal. */
const STALL_AFTER_MS = 120_000;

export type ReportPhase =
  /** Invoice open, QPay has seen no money yet. */
  | "awaiting-payment"
  /** QPay confirms the payment, but our webhook has not landed — report still unpaid. */
  | "payment-detected"
  /** Paid; the queue is fetching the JPStat report and rendering the PDF. */
  | "generating"
  /** PDF is on S3 and downloadable. */
  | "ready";

type UseReportProgressResult = {
  report: Report | undefined;
  phase: ReportPhase;
  /** True once the current phase has run longer than is plausible. */
  isStalled: boolean;
  isLoading: boolean;
  error: unknown;
};

/**
 * Drives the post-purchase screen for one report.
 *
 * Two things are being waited on and they are NOT the same:
 *
 *  1. **Money.** `POST /payments/qpay/{uuid}/check` asks QPay directly. It is
 *     read-only — it never marks the report paid and never starts the PDF job.
 *  2. **The report itself.** Only the QPay → backend webhook flips the report
 *     to `paid` and queues `CreateReport` → `GenerateReportPdf`.
 *
 * So `paid: true` from step 1 while `status` is still `unpaid` is a real,
 * expected intermediate state (the webhook is in flight) — surfaced as
 * `payment-detected` rather than pretending the report is ready.
 *
 * If either wait outlives `STALL_AFTER_MS`, `isStalled` goes true so the UI can
 * stop spinning forever and tell the customer we will follow up. That matters:
 * a dropped webhook or a failed PDF job leaves the report unpaid/unfinished
 * with no automatic retry, and an endless spinner would hide it.
 */
export function useReportProgress(
  uuid: string,
  enabled = true,
): UseReportProgressResult {
  const reportQuery = useQuery({
    queryKey: reportKey(uuid),
    queryFn: () => getReport(uuid),
    enabled,
    // Stop once the PDF exists; until then the webhook + queue may still land.
    refetchInterval: (query) => (query.state.data?.pdf ? false : 5_000),
    refetchOnWindowFocus: true,
  });

  const report = reportQuery.data;
  const isPaid = report?.status === "paid";
  const hasPdf = Boolean(report?.pdf);

  const paymentQuery = useQuery({
    queryKey: reportPaymentKey(uuid),
    queryFn: () => checkPayment(uuid),
    // Only worth asking while the report has not flipped to paid yet.
    enabled: enabled && report !== undefined && !isPaid,
    refetchInterval: (query) => (query.state.data === true ? false : 3_000),
  });

  const phase: ReportPhase = hasPdf
    ? "ready"
    : isPaid
      ? "generating"
      : paymentQuery.data === true
        ? "payment-detected"
        : "awaiting-payment";

  // Timed from when the PHASE changed, not from the last poll: the report query
  // refetches every 5s, so anything keyed off `dataUpdatedAt` would reset the
  // clock forever and never report a stall.
  //
  // The timer records WHICH phase went stale rather than a boolean, so moving
  // to a new phase clears the flag by derivation — no reset setState in the
  // effect body, which would cascade a render on every phase change.
  const [stalledPhase, setStalledPhase] = useState<ReportPhase | null>(null);

  useEffect(() => {
    // "awaiting-payment" has no deadline — the customer may take their time.
    if (phase === "ready" || phase === "awaiting-payment") return;

    const timer = setTimeout(() => setStalledPhase(phase), STALL_AFTER_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  const isStalled = stalledPhase === phase;

  return {
    report,
    phase,
    isStalled,
    isLoading: reportQuery.isLoading,
    error: reportQuery.error,
  };
}
