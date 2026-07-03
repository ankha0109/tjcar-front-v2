import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Loading placeholder for `/japan/brands` — mirrors {@link BrandsExplorer}'s
 * two-pane layout (brand list rail + model grid).
 */
export default function Loading() {
  return (
    <section
      role="status"
      aria-busy="true"
      className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 md:pt-10"
    >
      <span className="sr-only">Loading…</span>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
        {/* Brand rail */}
        <aside className="hidden rounded-2xl border border-neutral-200 bg-white p-3 lg:block dark:border-neutral-800 dark:bg-neutral-950">
          <Skeleton className="mb-3 h-9 w-full rounded-lg" />
          <div className="space-y-1.5">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        </aside>

        {/* Model grid */}
        <div>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-4 dark:border-neutral-800">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-8 w-28 rounded-lg" />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-4/3 w-full rounded-xl" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
