"use client";

import { useState } from "react";
import { Button, Skeleton } from "antd";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import EmptyState from "@/components/dashboard/EmptyState";
import SectionMast from "@/components/dashboard/SectionMast";
import { useBid } from "@/hooks/useBids";
import { formatJpy } from "@/lib/bidConfig";
import { ApiError } from "@/services/Api";
import { fromFeaturedCar } from "@/types/car";
import { isBidEditable } from "@/types/bid";
import BidPriceEditModal from "./BidPriceEditModal";
import BidStatusTag from "./BidStatusTag";
import BidTimeline from "./BidTimeline";
import { formatBidPrice } from "./BidRow";

export default function BidDetail({ id }: { id: string }) {
  const t = useTranslations("dashboard.bidDetail");
  const query = useBid(id);
  const [editing, setEditing] = useState(false);

  if (query.isLoading) {
    return <Skeleton active paragraph={{ rows: 6 }} />;
  }

  if (query.isError && !query.data) {
    const notFound =
      query.error instanceof ApiError && query.error.status === 404;

    return (
      <EmptyState
        title={notFound ? t("notFoundTitle") : t("loadErrorTitle")}
        description={notFound ? t("notFoundBody") : t("loadErrorBody")}
        cta={{ label: t("backToList"), href: "/dashboard/bids" }}
      />
    );
  }

  const bid = query.data!;
  const car = fromFeaturedCar(bid.car_data);
  const title = [car.marka, car.model, car.year].filter(Boolean).join(" ");
  const logs = bid.bid_logs ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex min-w-0 items-start gap-4">
          {car.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={car.images[0]}
              alt=""
              className="h-20 w-28 shrink-0 rounded-md object-cover"
            />
          ) : null}
          <div className="min-w-0 space-y-1">
            <p className="truncate text-base font-semibold text-neutral-900 dark:text-neutral-100">
              {title}
            </p>
            <p className="text-[13px] text-neutral-500">
              {t("sentAt", { date: bid.created_at ?? "" })}
            </p>
            <Link
              href={`/japan/${bid.car_data.ID}`}
              className="inline-block text-[13px] font-medium text-primary hover:underline"
            >
              {t("viewCar")}
            </Link>
          </div>
        </div>

        <div className="space-y-2 text-right">
          <BidStatusTag status={bid.status} label={bid.status_label} />
          <p className="text-xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
            {formatBidPrice(bid)}
          </p>
          <p className="text-[12px] text-neutral-500">
            {t("startPrice", { price: formatJpy(bid.start_price) })}
          </p>
          {isBidEditable(bid) ? (
            <Button size="small" onClick={() => setEditing(true)}>
              {t("editPrice")}
            </Button>
          ) : null}
        </div>
      </div>

      {bid.user ? (
        <p className="text-[13px] text-neutral-600 dark:text-neutral-300">
          {t("operator", { name: bid.user.name, phone: bid.user.phone ?? "-" })}
        </p>
      ) : null}

      <section className="space-y-4">
        <SectionMast title={t("timelineHeading")} />
        {logs.length > 0 ? (
          <BidTimeline logs={logs} />
        ) : (
          <EmptyState title={t("timelineEmpty")} />
        )}
      </section>

      {editing ? (
        <BidPriceEditModal
          bid={bid}
          open={editing}
          onClose={() => setEditing(false)}
        />
      ) : null}
    </div>
  );
}
