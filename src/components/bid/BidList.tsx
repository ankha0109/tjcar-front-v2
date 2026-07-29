"use client";

import { useState } from "react";
import { Pagination, Skeleton, Tabs } from "antd";
import { useTranslations } from "next-intl";
import EmptyState from "@/components/dashboard/EmptyState";
import { BIDS_PER_PAGE, useBidList } from "@/hooks/useBids";
import type { BidScope } from "@/types/bid";
import BidRow from "./BidRow";

type TabKey = "all" | BidScope;

/**
 * The customer's bids, grouped by the API's `scope` param.
 *
 * Filtering happens server-side so each tab paginates over its own result set —
 * splitting one page client-side would give tabs uneven, shifting page sizes.
 */
export default function BidList() {
  const t = useTranslations("dashboard.bids");
  const [tab, setTab] = useState<TabKey>("all");
  const [page, setPage] = useState(1);

  const query = useBidList(tab === "all" ? undefined : tab, page);

  const changeTab = (key: string) => {
    setTab(key as TabKey);
    setPage(1);
  };

  const bids = query.data?.data ?? [];
  const total = query.data?.meta.total ?? 0;

  return (
    <div className="space-y-4">
      <Tabs
        activeKey={tab}
        onChange={changeTab}
        items={[
          { key: "all", label: t("tabAll") },
          { key: "active", label: t("tabActive") },
          { key: "closed", label: t("tabClosed") },
        ]}
      />

      {query.isLoading ? <Skeleton active paragraph={{ rows: 5 }} /> : null}

      {query.isError && !query.data ? (
        <EmptyState title={t("loadErrorTitle")} description={t("loadErrorBody")} />
      ) : null}

      {!query.isLoading && !query.isError && bids.length === 0 ? (
        <EmptyState
          title={t("emptyTitle")}
          description={t("emptyDescription")}
          cta={{ label: t("emptyCta"), href: "/japan" }}
        />
      ) : null}

      {bids.length > 0 ? (
        <div className="space-y-3">
          <ul className="space-y-2">
            {bids.map((bid) => (
              <BidRow key={bid.id} bid={bid} />
            ))}
          </ul>

          {total > BIDS_PER_PAGE ? (
            <Pagination
              current={page}
              pageSize={BIDS_PER_PAGE}
              total={total}
              onChange={setPage}
              showSizeChanger={false}
              align="center"
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
