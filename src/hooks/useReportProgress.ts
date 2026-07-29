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

/** Nothing can change until money moves, so the report itself can idle. */
const REPORT_IDLE_POLL_MS = 30_000;
/** Money seen → the webhook and the PDF job land within seconds. */
const REPORT_ACTIVE_POLL_MS = 6_000;

export type ReportPhase =
  /** Invoice open, QPay has seen no money yet. */
  | "awaiting-payment"
  /** QPay confirms the payment, but our webhook has not landed — report still unpaid. */
  | "payment-detected"
  /** Paid; the queue is fetching the JPStat report and rendering the PDF. */
  | "generating"
  /** PDF is on S3 and downloadable. */
  | "ready";

type UseReportProgressOptions = {
  /** Off while the session is still resolving — nothing is authenticated yet. */
  enabled?: boolean;
  /**
   * Re-ask QPay once whenever the tab becomes visible again. Only worth it on a
   * phone, where "the tab went away" means the customer left for their bank app.
   */
  checkOnFocus?: boolean;
};

type UseReportProgressResult = {
  report: Report | undefined;
  phase: ReportPhase;
  /** True once the current phase has run longer than is plausible. */
  isStalled: boolean;
  isLoading: boolean;
  error: unknown;
  /** Ask QPay whether the invoice is settled. Nothing else ever calls it. */
  checkPayment: () => void;
  isCheckingPayment: boolean;
  /** The last check came back "no money yet" — worth saying out loud. */
  paymentNotSeen: boolean;
  /** The last check never reached QPay. Different message: we do not know. */
  paymentCheckFailed: boolean;
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
 * Step 1 is never polled. It is a QPay round-trip for a screen that sits idle
 * for minutes, so it runs only when the customer presses "check" — or, on a
 * phone, once each time they come back from their bank app. Step 2 keeps a slow
 * timer because the webhook can land without anyone touching the page.
 *
 * If either wait outlives `STALL_AFTER_MS`, `isStalled` goes true so the UI can
 * stop spinning forever and tell the customer we will follow up. That matters:
 * a dropped webhook or a failed PDF job leaves the report unpaid/unfinished
 * with no automatic retry, and an endless spinner would hide it.
 */
export function useReportProgress(
  uuid: string,
  { enabled = true, checkOnFocus = false }: UseReportProgressOptions = {},
): UseReportProgressResult {
  // `enabled: false` on purpose — this query has no schedule of its own and
  // only ever runs through `refetch()`. Declared first so the report query
  // below can speed up the moment QPay says the money landed.
  const paymentQuery = useQuery({
    queryKey: reportPaymentKey(uuid),
    queryFn: () => checkPayment(uuid),
    enabled: false,
  });

  const paidByQpay = paymentQuery.data === true;
  const { refetch: refetchPayment } = paymentQuery;

  const reportQuery = useQuery({
    queryKey: reportKey(uuid),
    queryFn: () => getReport(uuid),
    enabled,
    // Stop once the PDF exists; until then the webhook + queue may still land.
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.pdf) return false;
      return data?.status === "paid" || paidByQpay
        ? REPORT_ACTIVE_POLL_MS
        : REPORT_IDLE_POLL_MS;
    },
    refetchOnWindowFocus: true,
  });

  const report = reportQuery.data;
  const isPaid = report?.status === "paid";
  const hasPdf = Boolean(report?.pdf);

  const phase: ReportPhase = hasPdf
    ? "ready"
    : isPaid
      ? "generating"
      : paidByQpay
        ? "payment-detected"
        : "awaiting-payment";

  // Coming back from the bank app is the one moment payment is likely to have
  // just happened, and on a phone that shows up as the tab becoming visible
  // again. One check per return, and none at all once the answer is known.
  const settled = paidByQpay || isPaid || hasPdf;

  useEffect(() => {
    if (!enabled || !checkOnFocus || settled) return;

    const onVisible = () => {
      if (document.visibilityState === "visible") refetchPayment();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [enabled, checkOnFocus, settled, refetchPayment]);

  // Timed from when the PHASE changed, not from the last poll: the report query
  // refetches on a timer, so anything keyed off `dataUpdatedAt` would reset the
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
    checkPayment: () => void refetchPayment(),
    isCheckingPayment: paymentQuery.isFetching,
    paymentNotSeen: paymentQuery.isFetched && paymentQuery.data === false,
    paymentCheckFailed: paymentQuery.isError,
  };
}
