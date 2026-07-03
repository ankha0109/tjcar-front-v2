import { cn } from "@/utils";

type Props = {
  /** Overall inspection grade (e.g. "S", "5", "4.5", "R"). */
  rate: string;
  /** Localized "RATE" label. */
  label: string;
};

/**
 * Standalone square card for the auction inspection grade (RATE) — the single
 * most important quality signal, so it gets its own tile instead of sharing a
 * row with the lot number. `R` (accident/repair history) reads red; everything
 * else reads emerald.
 */
export default function RateCard({ rate, label }: Props) {
  const value = rate?.trim() || "—";
  const isR = value.toUpperCase() === "R";

  return (
    <div className="flex flex-col justify-between gap-2 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="text-[11px] font-semibold uppercase text-neutral-500 dark:text-neutral-400">
        {label}
      </div>
      <div
        className={cn(
          "text-4xl font-extrabold leading-none tabular-nums",
          isR
            ? "text-red-600 dark:text-red-500"
            : "text-emerald-600 dark:text-emerald-400",
        )}
      >
        {value}
      </div>
    </div>
  );
}
