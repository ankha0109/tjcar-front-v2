"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import Api from "@/services/Api";
import { listReports } from "@/services/reports";
import { listOrders } from "@/services/orders";
import StatCard from "./StatCard";

type StatsResponse = {
  data: {
    requests: number;
    requests_win: number;
    requests_pending: number;
  };
};

/**
 * Overview counts.
 *
 * Two calls: `GET /stats` owns the bid numbers, and the reports total is read
 * from the paginator meta of a single-row `GET /reports` page — cheaper than
 * adding a second server-side count for one figure.
 */
export default function DashboardStats() {
  const t = useTranslations("dashboard.home");
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  const bidStats = useQuery({
    queryKey: ["stats", "bids"],
    queryFn: () => Api.get<StatsResponse>("/stats"),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  const reportCount = useQuery({
    queryKey: ["stats", "reports"],
    queryFn: () => listReports(1, 1),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  // Same one-row-page trick as the reports card: read `meta.total` instead of
  // adding a server-side counter for a single figure.
  const orderCount = useQuery({
    queryKey: ["stats", "orders"],
    queryFn: () => listOrders(1, 1),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  const bids = bidStats.data?.data;

  // Same wrapper element and classes the server page used, so the grid does not shift.
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard
        label={t("stats.bidsLabel")}
        value={bids?.requests ?? "—"}
        hint={t("stats.bidsHint", { count: bids?.requests_pending ?? 0 })}
        href="/dashboard/bids"
      />
      <StatCard
        label={t("stats.ordersLabel")}
        value={orderCount.data?.meta.total ?? "—"}
        hint={t("stats.ordersHint")}
        href="/dashboard/orders"
      />
      <StatCard
        label={t("stats.reportsLabel")}
        value={reportCount.data?.meta.total ?? "—"}
        hint={t("stats.reportsHint")}
        href="/dashboard/reports"
      />
    </section>
  );
}
