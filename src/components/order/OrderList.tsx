"use client";

import { useState } from "react";
import { Pagination, Skeleton } from "antd";
import { useTranslations } from "next-intl";
import EmptyState from "@/components/dashboard/EmptyState";
import { ORDERS_PER_PAGE, useOrderList } from "@/hooks/useOrders";
import OrderRow from "./OrderRow";

/**
 * The customer's orders, newest first.
 *
 * No tabs: `OrderStatus` has two values and orders are few, so a
 * Pending/Done tab bar would be chrome without a job.
 */
export default function OrderList() {
  const t = useTranslations("dashboard.orders");
  const [page, setPage] = useState(1);
  const query = useOrderList(page);

  const orders = query.data?.data ?? [];
  const total = query.data?.meta.total ?? 0;
  // A background refetch (refetchOnWindowFocus) can fail after a successful
  // load without clearing `data`. Only treat it as a hard error when there is
  // no last-known-good page to fall back on; otherwise "loaded, zero rows"
  // still belongs to the empty state below, not blank space.
  const showLoadError = query.isError && !query.data;

  return (
    <div className="space-y-4">
      {query.isLoading ? <Skeleton active paragraph={{ rows: 5 }} /> : null}

      {showLoadError ? (
        <EmptyState
          title={t("loadErrorTitle")}
          description={t("loadErrorBody")}
        />
      ) : null}

      {!query.isLoading && !showLoadError && orders.length === 0 ? (
        <EmptyState
          title={t("emptyTitle")}
          description={t("emptyDescription")}
          cta={{ label: t("emptyCta"), href: "/japan" }}
        />
      ) : null}

      {orders.length > 0 ? (
        <div className="space-y-3">
          <ul className="space-y-2">
            {orders.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </ul>

          {total > ORDERS_PER_PAGE ? (
            <Pagination
              current={page}
              pageSize={ORDERS_PER_PAGE}
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
