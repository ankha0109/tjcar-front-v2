import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Loading placeholder for the car detail pages (`/japan/[id]`, `/korea/[id]`,
 * `/cars/[id]`). Mirrors the {@link JapanCarDetail}/{@link CarDetail} two-column
 * layout — gallery on the left, info + specs on the right — so navigation from a
 * listing shows a detail-shaped skeleton instead of the card-grid one.
 */
export default function CarDetailSkeleton() {
  return (
    <article
      role="status"
      aria-busy="true"
      className="mx-auto w-full max-w-7xl px-4 py-5 lg:px-6 lg:py-8"
    >
      <span className="sr-only">Loading…</span>
      <div className="lg:grid lg:grid-cols-[1.4fr_1fr] lg:items-start lg:gap-x-10 lg:gap-y-8">
        {/* Gallery */}
        <div className="lg:col-start-1 lg:row-start-1">
          <Skeleton className="aspect-4/3 w-full rounded-2xl" />
          <div className="mt-3 flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-20 shrink-0 rounded-lg" />
            ))}
          </div>
        </div>

        {/* Info column */}
        <div className="flex flex-col gap-5 py-5 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:py-0">
          <div className="space-y-2">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>

        {/* Lower-left spec table */}
        <div className="flex flex-col gap-4 py-5 lg:col-start-1 lg:row-start-2 lg:py-0">
          <Skeleton className="h-5 w-32" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
