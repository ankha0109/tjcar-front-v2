import type { CarType } from "@/types/car";
import { cn } from "@/utils";

/**
 * Purchase-type pill for an in-stock car. Colour encodes how far away the car
 * is: already here (green) → loaded and shipping (amber) → on the water (blue)
 * → not bought yet (violet).
 *
 * Presentational on purpose — the caller passes the translated label, so the
 * same component serves the client grid and the server detail page.
 */
const TYPE_CLASSES: Record<CarType, string> = {
  available: "bg-emerald-50 text-emerald-700 ring-emerald-200/80",
  ready_to_ship: "bg-amber-50 text-amber-700 ring-amber-200/80",
  arriving_soon: "bg-sky-50 text-sky-700 ring-sky-200/80",
  preorder_only: "bg-violet-50 text-violet-700 ring-violet-200/80",
};

const BASE =
  "inline-flex items-center rounded-lg px-2 py-1 text-[11px] font-semibold leading-none ring-1 backdrop-blur-sm";

export function StockBadge({
  type,
  label,
  className,
}: {
  type: CarType;
  label: string;
  className?: string;
}) {
  return (
    <span className={cn(BASE, TYPE_CLASSES[type], className)}>{label}</span>
  );
}

/**
 * Sold marker. Deliberately not derived from `status_label` — the backend enum
 * returns "Идэвхтэй" for sold cars too, so only the raw `status` value is safe
 * to branch on.
 */
export function SoldBadge({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        BASE,
        "bg-neutral-900/85 text-white ring-white/20 uppercase",
        className,
      )}
    >
      {label}
    </span>
  );
}
