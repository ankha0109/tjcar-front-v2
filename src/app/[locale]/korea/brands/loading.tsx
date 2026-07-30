import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Loading placeholder for `/korea/brands` — mirrors {@link BrandsExplorer}'s
 * two-pane layout (brand rail + model grid).
 */
export default function Loading() {
  return (
    <section
      role="status"
      aria-busy="true"
      className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 md:pt-10 lg:px-6"
    >
      <span className="sr-only">Loading…</span>
      <div className="mb-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-2 h-4 w-96 max-w-full" />
      </div>
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
            <Skeleton className="h-9 w-56" />
            <Skeleton className="h-5 w-28" />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-9.5 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
