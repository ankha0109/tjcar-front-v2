"use client";

import { Timeline } from "antd";
import { useTranslations } from "next-intl";
import {
  TRANSPORT_STOPS,
  extraTrackingRows,
  orderStopDates,
  orderStopIndex,
  type OrderTracking,
} from "@/types/order";
import { stopKey } from "./OrderProgress";

type Props = {
  location: number | null;
  tracking: OrderTracking[] | undefined;
};

/**
 * The four fixed stops carrying whatever dates `tracking` supplies, followed by
 * any tracking row whose `location_id` falls outside the model. Those extras are
 * printed with their own `location_name` rather than dropped — an admin who
 * logged a stop we do not model still logged it.
 */
export default function OrderTimeline({ location, tracking }: Props) {
  const t = useTranslations("dashboard");
  const current = orderStopIndex(location);
  const dates = orderStopDates(tracking);

  const stops = TRANSPORT_STOPS.map((id, i) => {
    const date = dates.get(id);
    return {
      key: `stop-${id}`,
      color: i < current ? "green" : i === current ? "blue" : "gray",
      children: (
        <div>
          <p
            className={
              i <= current
                ? "text-[13.5px] font-medium text-neutral-900 dark:text-neutral-100"
                : "text-[13.5px] text-neutral-400 dark:text-neutral-500"
            }
          >
            {t(`transportStops.${stopKey(id)}`)}
          </p>
          {date ? (
            <p className="mt-0.5 text-[12px] text-neutral-500">{date}</p>
          ) : null}
        </div>
      ),
    };
  });

  const extras = extraTrackingRows(tracking).map((row) => ({
    key: `extra-${row.id}`,
    color: "green",
    children: (
      <div>
        <p className="text-[13.5px] font-medium text-neutral-900 dark:text-neutral-100">
          {row.location_name}
        </p>
        {row.date ? (
          <p className="mt-0.5 text-[12px] text-neutral-500">{row.date}</p>
        ) : null}
      </div>
    ),
  }));

  return <Timeline items={[...stops, ...extras]} />;
}
