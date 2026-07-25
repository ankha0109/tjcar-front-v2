import { Link } from "@/i18n/navigation";
import { cn } from "@/utils";

type PostsPaginationProps = {
  currentPage: number;
  lastPage: number;
  /** Query params carried across pages (the category filter, …). */
  params?: Record<string, string | undefined>;
  labels: { prev: string; next: string };
};

const GAP = "gap" as const;
type Slot = number | typeof GAP;

/** First, last, and the current page ±1 — everything else collapses to a gap. */
function pageSlots(current: number, last: number): Slot[] {
  if (last <= 7) {
    return Array.from({ length: last }, (_, i) => i + 1);
  }

  const wanted = new Set<number>([1, last]);
  for (let p = current - 1; p <= current + 1; p += 1) {
    if (p >= 1 && p <= last) wanted.add(p);
  }

  const sorted = [...wanted].sort((a, b) => a - b);
  const slots: Slot[] = [];
  sorted.forEach((page, i) => {
    if (i > 0 && page - sorted[i - 1] > 1) slots.push(GAP);
    slots.push(page);
  });
  return slots;
}

const BASE_ITEM =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-[13px] font-medium transition-colors";

/**
 * Server-rendered pagination — plain `?page=N` links so every page is
 * crawlable. The API's `links.next` / `links.prev` point at the backend host,
 * so hrefs are always rebuilt here.
 */
export default function PostsPagination({
  currentPage,
  lastPage,
  params = {},
  labels,
}: PostsPaginationProps) {
  if (lastPage <= 1) return null;

  const hrefFor = (page: number) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) query.set(key, value);
    }
    if (page > 1) query.set("page", String(page));
    const qs = query.toString();
    return qs ? `/posts?${qs}` : "/posts";
  };

  const prevDisabled = currentPage <= 1;
  const nextDisabled = currentPage >= lastPage;

  return (
    <nav
      aria-label="Pagination"
      className="mt-10 flex flex-wrap items-center justify-center gap-1.5"
    >
      {prevDisabled ? (
        <span
          className={cn(
            BASE_ITEM,
            "cursor-not-allowed text-neutral-400 dark:text-neutral-600",
          )}
        >
          {labels.prev}
        </span>
      ) : (
        <Link
          href={hrefFor(currentPage - 1)}
          rel="prev"
          className={cn(
            BASE_ITEM,
            "border border-neutral-200 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900",
          )}
        >
          {labels.prev}
        </Link>
      )}

      {pageSlots(currentPage, lastPage).map((slot, i) =>
        slot === GAP ? (
          <span
            key={`gap-${i}`}
            aria-hidden
            className="px-1 text-[13px] text-neutral-400 dark:text-neutral-600"
          >
            …
          </span>
        ) : slot === currentPage ? (
          <span
            key={slot}
            aria-current="page"
            className={cn(BASE_ITEM, "bg-primary text-white")}
          >
            {slot}
          </span>
        ) : (
          <Link
            key={slot}
            href={hrefFor(slot)}
            className={cn(
              BASE_ITEM,
              "border border-neutral-200 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900",
            )}
          >
            {slot}
          </Link>
        ),
      )}

      {nextDisabled ? (
        <span
          className={cn(
            BASE_ITEM,
            "cursor-not-allowed text-neutral-400 dark:text-neutral-600",
          )}
        >
          {labels.next}
        </span>
      ) : (
        <Link
          href={hrefFor(currentPage + 1)}
          rel="next"
          className={cn(
            BASE_ITEM,
            "border border-neutral-200 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900",
          )}
        >
          {labels.next}
        </Link>
      )}
    </nav>
  );
}
