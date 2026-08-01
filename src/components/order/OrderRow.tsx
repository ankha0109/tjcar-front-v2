"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatMnt } from "@/lib/bidConfig";
import { orderTotalMnt, type Order } from "@/types/order";
import { decodeAuctionText } from "@/utils/auctionInfo";
import { cdnImage } from "@/utils/cdnImage";
import OrderProgress from "./OrderProgress";
import OrderStatusTag from "./OrderStatusTag";

/**
 * "TOYOTA PRIUS 2018" from whichever of the three keys `car_data` carries. An
 * admin-entered order may have only two of them.
 */
export function orderTitle(order: Order): string {
  const { MARKA_NAME, MODEL_NAME, YEAR } = order.car_data ?? {};
  return [MARKA_NAME, MODEL_NAME, YEAR].filter(Boolean).join(" ");
}

export default function OrderRow({ order }: { order: Order }) {
  const t = useTranslations("dashboard.orders");
  // `images` are our own S3 uploads, which store a physical `_w320` sibling —
  // unlike the auction CDN, which resizes off a URL param.
  const cover = cdnImage(order.images?.[0] ?? null, "card");
  const grade = decodeAuctionText(order.car_data?.GRADE);

  return (
    <li>
      <Link
        href={`/dashboard/orders/${order.id}`}
        className="block rounded-lg border border-neutral-200 bg-white p-4 transition-colors hover:border-primary/50 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cover}
                alt=""
                className="h-14 w-20 shrink-0 rounded-md object-cover"
              />
            ) : null}
            <div className="min-w-0">
              <p className="truncate text-[13.5px] font-medium text-neutral-900 dark:text-neutral-100">
                {orderTitle(order)}
              </p>
              {grade ? (
                <p className="mt-0.5 truncate text-[12px] text-neutral-500">
                  {grade}
                </p>
              ) : null}
              <p className="mt-0.5 text-[12px] text-neutral-400">
                {t("orderNo", { id: order.id })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-[13px] tabular-nums text-neutral-600 dark:text-neutral-300">
              {formatMnt(orderTotalMnt(order))}
            </span>
            <OrderStatusTag status={order.status} label={order.status_label} />
          </div>
        </div>

        {/* `GET /orders` does not eager-load tracking, so the row's progress is
            driven by the scalar `location` alone. */}
        <div className="mt-3">
          <OrderProgress location={order.location} />
        </div>
      </Link>
    </li>
  );
}
