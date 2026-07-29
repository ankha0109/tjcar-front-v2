"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Pagination, Skeleton, Tag } from "antd";
import { Link } from "@/i18n/navigation";
import { useState } from "react";
import EmptyState from "@/components/dashboard/EmptyState";
import { listReports } from "@/services/reports";
import type { Report } from "@/types/report";

const PER_PAGE = 10;

/**
 * The customer's reports. Client-side because the list changes while the
 * customer watches it: a report bought minutes ago moves unpaid → paid →
 * downloadable as the webhook and render queue land.
 */
export default function ReportList() {
  const t = useTranslations("dashboard.reports");
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ["reports", page],
    queryFn: () => listReports(page, PER_PAGE),
    // A report in flight settles within a couple of minutes; keep the list warm
    // rather than hammering the API.
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });

  if (query.isLoading) {
    return <Skeleton active paragraph={{ rows: 5 }} />;
  }

  if (query.isError) {
    return (
      <EmptyState title={t("loadErrorTitle")} description={t("loadErrorBody")} />
    );
  }

  const reports = query.data?.data ?? [];
  const total = query.data?.meta.total ?? 0;

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
    <div className="space-y-3">
      <ul className="space-y-2">
        {reports.map((report) => (
          <ReportRow key={report.uuid} report={report} />
        ))}
      </ul>

      {total > PER_PAGE ? (
        <Pagination
          current={page}
          pageSize={PER_PAGE}
          total={total}
          onChange={setPage}
          showSizeChanger={false}
          align="center"
        />
      ) : null}
    </div>
  );
}

function ReportRow({ report }: { report: Report }) {
  const t = useTranslations("dashboard.reports");
  const isPaid = report.status === "paid";

  return (
    <li>
      <Link
        href={`/reports/${report.uuid}`}
        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3 transition-colors hover:border-primary/50 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div className="min-w-0">
          <p className="truncate text-[13.5px] font-medium text-neutral-900 dark:text-neutral-100">
            {report.vin}
          </p>
          <p className="mt-0.5 text-[12px] text-neutral-500">
            {report.created_at}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-[13px] text-neutral-600 dark:text-neutral-300">
            {Number(report.price).toLocaleString("mn-MN")}₮
          </span>
          <Tag color={isPaid ? "green" : "orange"} className="m-0!">
            {report.status_label}
          </Tag>
          {/* `pdf` is the only honest "ready" signal — paid alone can still mean
              the render queue has not finished. */}
          {isPaid && !report.pdf ? (
            <span className="text-[12px] text-neutral-400">
              {t("preparing")}
            </span>
          ) : null}
        </div>
      </Link>
    </li>
  );
}
