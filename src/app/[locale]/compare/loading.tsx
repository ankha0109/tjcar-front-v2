import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Loading placeholder for `/compare` — a title plus a few side-by-side vehicle
 * columns while {@link CompareView} fetches the comparison payload.
 */
export default function Loading() {
  return (
    <section
      role="status"
      aria-busy="true"
      className="mx-auto w-full max-w-7xl px-4 py-8 md:py-12"
    >
      <span className="sr-only">Loading…</span>
      <Skeleton className="mb-6 h-7 w-40" />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, col) => (
          <div
            key={col}
            className="space-y-3 rounded-xl border border-neutral-200/80 p-3 dark:border-neutral-800"
          >
            <Skeleton className="aspect-4/3 w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <div className="space-y-2 pt-1">
              {Array.from({ length: 6 }).map((_, row) => (
                <Skeleton key={row} className="h-3 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
