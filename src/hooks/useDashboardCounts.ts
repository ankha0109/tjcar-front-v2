"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Api from "@/services/Api";
import { listOrders } from "@/services/orders";
import { listReports } from "@/services/reports";

type StatsResponse = {
  data: {
    requests: number;
    requests_win: number;
    requests_pending: number;
  };
};

export type DashboardCounts = {
  /** Total bids sent. `undefined` until `GET /stats` lands. */
  bids: number | undefined;
  /** Of those, how many are still awaiting a result. */
  bidsPending: number | undefined;
  orders: number | undefined;
  reports: number | undefined;
};

/**
 * The three numbers the dashboard counts.
 *
 * Kept in one hook so the desktop stat cards and the mobile menu badges can
 * never quote different figures — same query keys, same staleTime, one cache
 * entry each. `GET /stats` owns the bid numbers; the orders and reports totals
 * are read from the paginator meta of a single-row page, which is cheaper than
 * adding a server-side counter for one figure apiece.
 */
export function useDashboardCounts(): DashboardCounts {
  const { status } = useSession();
  const enabled = status === "authenticated";

  const bidStats = useQuery({
    queryKey: ["stats", "bids"],
    queryFn: () => Api.get<StatsResponse>("/stats"),
    enabled,
    staleTime: 30_000,
  });

  const orders = useQuery({
    queryKey: ["stats", "orders"],
    queryFn: () => listOrders(1, 1),
    enabled,
    staleTime: 30_000,
  });

  const reports = useQuery({
    queryKey: ["stats", "reports"],
    queryFn: () => listReports(1, 1),
    enabled,
    staleTime: 30_000,
  });

  return {
    bids: bidStats.data?.data.requests,
    bidsPending: bidStats.data?.data.requests_pending,
    orders: orders.data?.meta.total,
    reports: reports.data?.meta.total,
  };
}
