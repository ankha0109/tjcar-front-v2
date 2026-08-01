"use client";

import { useTranslations } from "next-intl";
import {
  TRANSPORT_STOPS,
  orderStopIndex,
  orderStopsReached,
} from "@/types/order";
import { cn } from "@/utils";

export type StopKey = "stop0" | "stop1" | "stop2" | "stop3";

/** `dashboard.transportStops` key for a stop id. */
export function stopKey(id: number): StopKey {
  return `stop${id}` as StopKey;
}

type Props = {
  location: number | null;
};

/**
 * Four-segment shipping bar.
 *
 * Plain divs rather than antd `Progress steps` — that component brings its own
 * sizing and colour tokens, which fight the Tailwind row it sits in. It is also
 * what let v1 render a negative percentage without complaining.
 */
export default function OrderProgress({ location }: Props) {
  const t = useTranslations("dashboard");
  const reached = orderStopsReached(location);
  const idx = orderStopIndex(location);
  const complete = reached === TRANSPORT_STOPS.length;

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {TRANSPORT_STOPS.map((id, i) => (
          <span
            key={id}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              i < reached
                ? complete
                  ? "bg-emerald-500"
                  : "bg-primary"
                : "bg-neutral-200 dark:bg-neutral-700",
            )}
          />
        ))}
      </div>
      <p className="text-[12px] text-neutral-500">
        {idx < 0 ? t("orders.notShipped") : t(`transportStops.${stopKey(idx)}`)}
      </p>
    </div>
  );
}
