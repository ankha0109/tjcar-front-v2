"use client";

import { Skeleton } from "antd";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import BidRow from "@/components/bid/BidRow";
import { useBidList } from "@/hooks/useBids";
import EmptyState from "./EmptyState";
import SectionMast from "./SectionMast";

const PREVIEW_COUNT = 3;

/**
 * The newest bids, inline on the dashboard.
 *
 * Reads page 1 of the shared `useBidList` cache rather than asking for its own
 * 3-row page: the full list at /dashboard/bids uses the same query, so opening
 * one warms the other and neither pays for a second request. The empty state is
 * where a customer with no bids yet gets pointed at the auctions.
 */
export default function DashboardRecentBids() {
  const t = useTranslations("dashboard.home.recent");
  // Empty/error copy already exists for the full list — one wording, one place.
  const tBids = useTranslations("dashboard.bids");
  const query = useBidList(undefined, 1);

  const bids = (query.data?.data ?? []).slice(0, PREVIEW_COUNT);
  const total = query.data?.meta.total ?? 0;
  // A background refetch can fail after a successful load without clearing
  // `data`; only a failure with nothing to fall back on is a hard error.
  const showLoadError = query.isError && !query.data;

  return (
    <section className="space-y-4">
      <SectionMast
        title={t("title")}
        action={
          total > bids.length ? (
            <Link
              href="/dashboard/bids"
              className="inline-flex items-center gap-1 text-[13px] font-medium text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
            >
              {t("viewAll")}
              <ArrowIcon />
            </Link>
          ) : undefined
        }
      />

      {query.isLoading ? <Skeleton active paragraph={{ rows: 3 }} /> : null}

      {showLoadError ? (
        <EmptyState
          title={tBids("loadErrorTitle")}
          description={tBids("loadErrorBody")}
        />
      ) : null}

      {!query.isLoading && !showLoadError && bids.length === 0 ? (
        <EmptyState
          title={tBids("emptyTitle")}
          description={tBids("emptyDescription")}
          cta={{ label: tBids("emptyCta"), href: "/japan" }}
        />
      ) : null}

      {bids.length > 0 ? (
        <ul className="space-y-2">
          {bids.map((bid) => (
            <BidRow key={bid.id} bid={bid} />
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
