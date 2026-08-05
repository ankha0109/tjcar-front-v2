"use client";

import { useTranslations } from "next-intl";
import { useDashboardCounts } from "@/hooks/useDashboardCounts";
import StatCard from "./StatCard";

/**
 * Overview counts, desktop only — phones get the same numbers as badges on the
 * mobile menu. Both read {@link useDashboardCounts}, so the two can never
 * disagree.
 */
export default function DashboardStats() {
  const t = useTranslations("dashboard.home");
  const counts = useDashboardCounts();

  // Same wrapper element and classes the server page used, so the grid does not shift.
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard
        label={t("stats.bidsLabel")}
        value={counts.bids ?? "—"}
        hint={t("stats.bidsHint", { count: counts.bidsPending ?? 0 })}
        href="/dashboard/bids"
      />
      <StatCard
        label={t("stats.ordersLabel")}
        value={counts.orders ?? "—"}
        hint={t("stats.ordersHint")}
        href="/dashboard/orders"
      />
      <StatCard
        label={t("stats.reportsLabel")}
        value={counts.reports ?? "—"}
        hint={t("stats.reportsHint")}
        href="/dashboard/reports"
      />
    </section>
  );
}
