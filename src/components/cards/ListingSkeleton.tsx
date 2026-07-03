import { Skeleton } from "@/components/ui/Skeleton";

type Props = {
  /** Render the left filter-sidebar placeholder (desktop only, matches `lg:w-[280px]`). */
  showFilters?: boolean;
  /** Render the Japan date-tab strip placeholder (Korea has no date tabs). */
  showDateTabs?: boolean;
  /** Number of card placeholders to render. */
  count?: number;
};

/**
 * Loading placeholder for the auction/listing browse pages (`/japan`, `/korea`).
 * Mirrors the {@link AuctionBrowser}/{@link KoreaBrowser} layout — filter
 * sidebar + toolbar + responsive card grid — so the real content swaps in
 * without a layout shift once the server component's fetch resolves.
 */
export default function ListingSkeleton({
  showFilters,
  showDateTabs,
  count = 8,
}: Props) {
  return (
    <section
      role="status"
      aria-busy="true"
      className="mx-auto w-full max-w-7xl px-4 py-4 md:py-8"
    >
      <span className="sr-only">Loading…</span>
      <div className="flex flex-col lg:flex-row lg:gap-6">
        {showFilters && (
          <aside className="hidden lg:block lg:w-[280px] lg:shrink-0">
            <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-900">
              <div className="border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="space-y-4 px-4 py-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-9 w-full rounded-lg" />
                  </div>
                ))}
              </div>
            </div>
          </aside>
        )}

        <div className="min-w-0 flex-1">
          {/* Toolbar: date strip (Japan) / spacer + view switcher */}
          <div className="flex items-start justify-between gap-3">
            {showDateTabs ? (
              <div className="flex items-center gap-2 pb-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-12 shrink-0 rounded-xl" />
                ))}
              </div>
            ) : (
              <Skeleton className="h-8 w-40" />
            )}
            <Skeleton className="h-8 w-24 shrink-0 rounded-lg" />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: count }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Single card placeholder shaped to match {@link CarCard} (image + specs, no price). */
function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <Skeleton className="aspect-4/3 w-full rounded-none" />
      <div className="flex flex-col gap-3 p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-2.5 w-1/2" />
          </div>
          <Skeleton className="h-7 w-7 shrink-0 rounded-lg" />
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-xl bg-neutral-50/70 px-3 py-2.5 ring-1 ring-neutral-100 dark:bg-neutral-800/60 dark:ring-neutral-800">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-3 flex-1" />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <Skeleton className="h-2.5 w-16" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}
