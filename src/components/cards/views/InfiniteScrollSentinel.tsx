"use client";

import { useTranslations } from "next-intl";
import { useInfiniteScrollSentinel } from "@/hooks/useInfiniteScrollSentinel";

type Props = {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isFetchNextPageError: boolean;
  fetchNextPage: () => void;
};

/**
 * The strip under an infinite list: it both pulls the next page and reports
 * where the list stands. Japan and Korea share it so the loop guards in
 * `useInfiniteScrollSentinel` can never end up on only one of them.
 *
 * Labels come from the `auctions` namespace, which both browsers already use.
 */
export default function InfiniteScrollSentinel({
  hasNextPage,
  isFetchingNextPage,
  isFetchNextPageError,
  fetchNextPage,
}: Props) {
  const t = useTranslations("auctions");
  const sentinelRef = useInfiniteScrollSentinel({
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    fetchNextPage,
  });

  return (
    <div
      ref={sentinelRef}
      className="mt-8 flex items-center justify-center py-6 text-center text-[12.5px] text-neutral-400"
    >
      {isFetchingNextPage ? (
        t("loadingMore")
      ) : isFetchNextPageError ? (
        <span className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1.5 text-neutral-500 dark:text-neutral-400">
          {t("loadMoreFailed")}
          <button
            type="button"
            onClick={() => fetchNextPage()}
            className="rounded-full border border-neutral-300 px-3 py-1 font-medium text-neutral-700 transition-colors hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-200"
          >
            {t("retry")}
          </button>
        </span>
      ) : hasNextPage ? (
        // Non-breaking space on purpose: it holds the strip's height steady
        // while more pages are still coming, so the list does not jump.
        " "
      ) : (
        t("endOfList")
      )}
    </div>
  );
}
