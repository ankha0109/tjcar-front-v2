"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Pagination, Skeleton, Tabs } from "antd";
import EmptyState from "@/components/dashboard/EmptyState";
import { listReports } from "@/services/reports";
import type { Report } from "@/types/report";
import ReportCard from "./ReportCard";

/**
 * `GET /reports` takes no status filter, so the tabs have to partition a set we
 * already hold. One generous page covers every real customer; anything beyond
 * it is called out rather than silently dropped.
 */
const FETCH_LIMIT = 100;

/** Cards per page inside a tab. */
const PER_PAGE = 12;

type TabKey = "active" | "pending";

/**
 * The customer's reports as a card grid, split into what they can use and what
 * still wants paying.
 *
 * Client-side because the list changes while the customer watches it: a report
 * bought minutes ago moves unpaid → paid → downloadable as the webhook and the
 * render queue land.
 */
export default function ReportList() {
  const t = useTranslations("dashboard.reports");
  const [tab, setTab] = useState<TabKey>("active");
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ["reports", "all", FETCH_LIMIT],
    queryFn: () => listReports(1, FETCH_LIMIT),
    // A report in flight settles within a couple of minutes; keep the list warm
    // rather than hammering the API.
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });

  const reports = query.data?.data ?? [];
  const total = query.data?.meta.total ?? 0;
  // A background refetch (refetchOnWindowFocus) can fail after a successful
  // load without clearing `data`. Only treat it as a hard error when there is
  // no last-known-good list to fall back on.
  const showLoadError = query.isError && !query.data;

  const groups: Record<TabKey, Report[]> = {
    active: reports.filter((report) => report.status === "paid"),
    pending: reports.filter((report) => report.status !== "paid"),
  };
  const current = groups[tab];
  const visible = current.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const changeTab = (key: string) => {
    setTab(key as TabKey);
    setPage(1);
  };

  if (query.isLoading) {
    return <Skeleton active paragraph={{ rows: 6 }} />;
  }

  if (showLoadError) {
    return (
      <EmptyState title={t("loadErrorTitle")} description={t("loadErrorBody")} />
    );
  }

  // Nothing at all yet: skip the tabs, they would both be empty.
  if (reports.length === 0) {
    return (
      <EmptyState
        title={t("emptyTitle")}
        description={t("emptyDescription")}
        cta={{ label: t("emptyCta"), href: "/report" }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <Tabs
        activeKey={tab}
        onChange={changeTab}
        items={[
          { key: "active", label: `${t("tabActive")} (${groups.active.length})` },
          {
            key: "pending",
            label: `${t("tabPending")} (${groups.pending.length})`,
          },
        ]}
      />

      {visible.length === 0 ? (
        <EmptyState
          title={t(tab === "active" ? "activeEmptyTitle" : "pendingEmptyTitle")}
          description={t(
            tab === "active" ? "activeEmptyBody" : "pendingEmptyBody",
          )}
          cta={
            tab === "active"
              ? { label: t("emptyCta"), href: "/report" }
              : undefined
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((report) => (
            <ReportCard key={report.uuid} report={report} />
          ))}
        </ul>
      )}

      {current.length > PER_PAGE ? (
        <Pagination
          current={page}
          pageSize={PER_PAGE}
          total={current.length}
          onChange={setPage}
          showSizeChanger={false}
          align="center"
        />
      ) : null}

      {/* No silent truncation: say so when the customer has more than one page
          of history than the tabs can partition. */}
      {total > reports.length ? (
        <p className="text-center text-[12px] text-neutral-400 dark:text-neutral-500">
          {t("limitNote", { count: reports.length, total })}
        </p>
      ) : null}
    </div>
  );
}
