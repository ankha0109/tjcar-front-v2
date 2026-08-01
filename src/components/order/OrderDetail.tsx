"use client";

import { Skeleton } from "antd";
import { useTranslations } from "next-intl";
import CarGallery from "@/components/car-detail/CarGallery";
import EmptyState from "@/components/dashboard/EmptyState";
import SectionMast from "@/components/dashboard/SectionMast";
import { useOrder } from "@/hooks/useOrders";
import { formatJpy, formatMnt } from "@/lib/bidConfig";
import { ApiError } from "@/services/Api";
import { orderTotalMnt } from "@/types/order";
import { decodeAuctionText, parseAuctionInfo } from "@/utils/auctionInfo";
import OrderFieldCard, { type OrderField } from "./OrderFieldCard";
import OrderProgress from "./OrderProgress";
import OrderStatusTag from "./OrderStatusTag";
import OrderTimeline from "./OrderTimeline";
import { orderTitle } from "./OrderRow";

/** AJES stores MILEAGE as a bare km string; some admin orders leave it blank. */
function formatMileage(raw: string | undefined): string | null {
  const km = Number(raw);
  if (!raw || !Number.isFinite(km) || km <= 0) return null;
  return `${new Intl.NumberFormat("en-US").format(km)} km`;
}

export default function OrderDetail({ id }: { id: string }) {
  const t = useTranslations("dashboard.orderDetail");
  const query = useOrder(id);

  if (query.isError && !query.data) {
    const notFound =
      query.error instanceof ApiError && query.error.status === 404;

    return (
      <EmptyState
        title={notFound ? t("notFoundTitle") : t("loadErrorTitle")}
        description={notFound ? t("notFoundBody") : t("loadErrorBody")}
        cta={{ label: t("backToList"), href: "/dashboard/orders" }}
      />
    );
  }

  if (!query.data) {
    // Covers initial load and the offline-paused state (networkMode: 'online'
    // pauses the fetch, so isPending is true but isFetching/isLoading are false).
    return <Skeleton active paragraph={{ rows: 8 }} />;
  }

  const order = query.data;
  const car = order.car_data ?? {};
  const mnt = car.PRICE_DATA?.mnt;
  const jpy = car.PRICE_DATA?.jpy;
  // INFO is per-auction-house free text; parseAuctionInfo pulls the two graded
  // fields out of it. Printing the raw blob is what v1 did and it is unreadable.
  const info = parseAuctionInfo(car.INFO);
  const total = formatMnt(orderTotalMnt(order));

  const paymentFields: OrderField[] = [
    { label: t("total"), value: total },
    {
      label: t("advance"),
      value: mnt?.advance != null ? formatMnt(mnt.advance) : null,
    },
    {
      label: t("remaining"),
      value: mnt?.remaining != null ? formatMnt(mnt.remaining) : null,
    },
    {
      label: t("jpyTotal"),
      value: jpy?.total != null ? formatJpy(jpy.total) : null,
    },
    { label: t("exchangeRate"), value: jpy?.exchange_rate ?? null },
  ];

  const orderFields: OrderField[] = [
    { label: t("status"), value: order.status_label },
    { label: t("port"), value: order.port },
    { label: t("departureDate"), value: order.departure_date },
    { label: t("arrivalDate"), value: order.arrival_date },
    { label: t("operatorLabel"), value: order.user?.name ?? null },
    { label: t("note"), value: order.note },
  ];

  const carFields: OrderField[] = [
    { label: t("marka"), value: car.MARKA_NAME },
    { label: t("model"), value: car.MODEL_NAME },
    { label: t("year"), value: car.YEAR },
    {
      label: t("kuzov"),
      value: [car.KUZOV, car.SERIAL].filter(Boolean).join(" "),
    },
    { label: t("color"), value: car.COLOR },
    { label: t("engine"), value: car.ENG_V ? `${car.ENG_V} cc` : null },
    { label: t("transmission"), value: car.KPP },
    { label: t("grade"), value: decodeAuctionText(car.GRADE) },
    { label: t("mileage"), value: formatMileage(car.MILEAGE) },
    { label: t("rate"), value: car.RATE },
    { label: t("rateExt"), value: info.rateExt ?? null },
    { label: t("rateInt"), value: info.rateInt ?? null },
  ];

  const auctionFields: OrderField[] = [
    { label: t("auctionId"), value: car.ID },
    { label: t("lot"), value: car.LOT },
    { label: t("auctionName"), value: car.AUCTION },
    { label: t("auctionDate"), value: car.AUCTION_DATE },
  ];

  return (
    <div className="space-y-6">
      {order.images?.length ? (
        // Order photos live on our S3, which does NOT honour the auction CDN's
        // `&w=` suffix — sizeVariants={false} makes every image load untouched.
        <CarGallery
          images={order.images}
          alt={orderTitle(order)}
          sizeVariants={false}
        />
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="min-w-0 space-y-1">
          <p className="truncate text-base font-semibold text-neutral-900 dark:text-neutral-100">
            {orderTitle(order)}
          </p>
          <p className="text-[13px] text-neutral-500">
            {t("orderNo", { id: order.id })}
          </p>
          {order.created_at ? (
            <p className="text-[13px] text-neutral-500">
              {t("createdAt", { date: order.created_at })}
            </p>
          ) : null}
        </div>

        <div className="space-y-2 text-right">
          <OrderStatusTag status={order.status} label={order.status_label} />
          <p className="text-xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
            {total}
          </p>
        </div>
      </div>

      <section className="space-y-4">
        <SectionMast title={t("progressHeading")} />
        <div className="rounded-lg border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <OrderProgress location={order.location} />
          <div className="mt-5">
            {order.location !== null || (order.tracking?.length ?? 0) > 0 ? (
              <OrderTimeline
                location={order.location}
                tracking={order.tracking}
              />
            ) : (
              // A plain line, not EmptyState: this sits inside a bordered card
              // already, and EmptyState's dashed box + py-14 would nest a
              // second frame inside the first.
              <p className="text-[13px] text-neutral-500">
                {t("timelineEmpty")}
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <OrderFieldCard title={t("paymentHeading")} fields={paymentFields} />
        <OrderFieldCard title={t("orderHeading")} fields={orderFields} />
        <OrderFieldCard title={t("carHeading")} fields={carFields} />
        {/* car_data.ID is always set (admin orders get a generated TJC-… code),
            so this card needs an explicit gate: without a lot or an auction
            house there was no auction to describe. */}
        {car.LOT || car.AUCTION ? (
          <OrderFieldCard title={t("auctionHeading")} fields={auctionFields} />
        ) : null}
      </div>
    </div>
  );
}
