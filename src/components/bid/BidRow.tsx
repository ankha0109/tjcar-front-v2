"use client";

import { Link } from "@/i18n/navigation";
import { formatJpy, formatMnt } from "@/lib/bidConfig";
import { fromFeaturedCar } from "@/types/car";
import type { Bid } from "@/types/bid";
import BidStatusTag from "./BidStatusTag";

/** Bids can be placed in MNT or JPY; the row prints whichever was sent. */
export function formatBidPrice(bid: Bid): string {
  return bid.currency === "JPY"
    ? formatJpy(bid.bid_price)
    : formatMnt(bid.bid_price);
}

export default function BidRow({ bid }: { bid: Bid }) {
  // `car_data` is the raw AJES row, structurally identical to FeaturedCar, so
  // the existing adapter handles images/marka/model/year with no new mapping.
  const car = fromFeaturedCar(bid.car_data);
  const title = [car.marka, car.model, car.year].filter(Boolean).join(" ");

  return (
    <li>
      <Link
        href={`/dashboard/bids/${bid.id}`}
        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3 transition-colors hover:border-primary/50 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div className="flex min-w-0 items-center gap-3">
          {car.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={car.images[0]}
              alt=""
              className="h-12 w-16 shrink-0 rounded-md object-cover"
            />
          ) : null}
          <div className="min-w-0">
            <p className="truncate text-[13.5px] font-medium text-neutral-900 dark:text-neutral-100">
              {title}
            </p>
            <p className="mt-0.5 text-[12px] text-neutral-500">
              {bid.created_at}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-[13px] tabular-nums text-neutral-600 dark:text-neutral-300">
            {formatBidPrice(bid)}
          </span>
          <BidStatusTag status={bid.status} label={bid.status_label} />
        </div>
      </Link>
    </li>
  );
}
