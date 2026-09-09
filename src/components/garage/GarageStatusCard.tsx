import type { CarType } from "@/types/car";

type Props = {
  /** Purchase/delivery stage from the `type` enum. */
  type: CarType;
  /** Localized stage name — "Ачигдахад бэлэн", "Зөвхөн захиалгаар", … */
  label: string;
  /** Localized caption above it ("ТӨЛӨВ"). */
  caption: string;
  /** `Y-m-d`, and only ever set on `arriving_soon` cars. */
  arrivalDate?: string | null;
  /** Localized caption for that date ("Монголд ирэх"). */
  arrivalLabel?: string;
};

/**
 * Where the car is, as the first thing in the info column and the second
 * largest type on the page. It used to be an 11px pill riding the price
 * caption; a buyer choosing between a car standing in Ulaanbaatar and one
 * nobody has bought yet needs that answer before the number, not beside it.
 *
 * Colour carries the distance the same way {@link StockBadge} does on the list
 * — here at 4 does not read as "money" against the ink-black price beside it.
 * The arrival date lives in this card rather than under the price: it is what
 * the stage means in days, and it is only ever set on `arriving_soon`.
 */
const TONE: Record<CarType, { card: string; icon: string; text: string }> = {
  available: {
    card: "border-emerald-200 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/40",
    icon: "bg-emerald-600",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  ready_to_ship: {
    card: "border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/40",
    icon: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-300",
  },
  arriving_soon: {
    card: "border-sky-200 bg-sky-50 dark:border-sky-900/60 dark:bg-sky-950/40",
    icon: "bg-sky-600",
    text: "text-sky-700 dark:text-sky-300",
  },
  preorder_only: {
    card: "border-violet-200 bg-violet-50 dark:border-violet-900/60 dark:bg-violet-950/40",
    icon: "bg-violet-600",
    text: "text-violet-700 dark:text-violet-300",
  },
};

/** 24px stroke glyphs, one per stage — the same weight as the page's info dots. */
const ICON: Record<CarType, React.ReactElement> = {
  // Standing in Mongolia: a map pin.
  available: (
    <>
      <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  // Loaded, not yet sailing: a crate.
  ready_to_ship: (
    <>
      <path d="M21 8.2 12 3 3 8.2v7.6L12 21l9-5.2V8.2Z" />
      <path d="m3.3 7.7 8.7 5 8.7-5" />
      <path d="M12 21v-8.3" />
    </>
  ),
  // On the water: a hull over waves.
  arriving_soon: (
    <>
      <path d="M4 14h16l-2.2 5H6.2L4 14Z" />
      <path d="M12 14V6l5 3" />
      <path d="M2.5 20.5c1.2.8 2.4.8 3.6 0s2.4-.8 3.6 0 2.4.8 3.6 0 2.4-.8 3.6 0 2.4.8 3.6 0" />
    </>
  ),
  // Not bought yet: an order slip.
  preorder_only: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
      <path d="M14 3v5h5" />
      <path d="m9.5 14.5 1.8 1.8 3.2-3.4" />
    </>
  ),
};

export default function GarageStatusCard({
  type,
  label,
  caption,
  arrivalDate,
  arrivalLabel,
}: Props) {
  const tone = TONE[type];

  return (
    <div
      className={`flex items-center gap-3.5 rounded-2xl border p-4 ${tone.card}`}
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white ${tone.icon}`}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          {ICON[type]}
        </svg>
      </span>

      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[11px] font-semibold uppercase leading-tight text-neutral-500 dark:text-neutral-400">
          {caption}
        </span>
        <span
          className={`text-[19px] font-bold leading-tight lg:text-[21px] ${tone.text}`}
        >
          {label}
        </span>
        {arrivalDate && arrivalLabel && (
          <span className="text-[12.5px] text-neutral-600 dark:text-neutral-400">
            {arrivalLabel}: {arrivalDate}
          </span>
        )}
      </div>
    </div>
  );
}
