import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import AuctionMeta from "./AuctionMeta";
import type { AuctionScheduleTimes } from "./AuctionSchedule";
import { formatJpy, formatMnt } from "@/lib/bidConfig";
import type { AuctionResultState } from "@/utils/auctionStatus";
import { cn } from "@/utils";

/** Every lifecycle state except the one that still takes bids. */
type FinishedState = Exclude<AuctionResultState, "upcoming">;

type Props = {
  state: FinishedState;
  /** Raw STATUS — the pill label when `state` is "other" and we have no word for it. */
  rawStatus: string;
  /** FINISH in yen. 0 means no figure to show — the upstream published none, or it did not parse as a number. */
  finishJpy: number;
  /**
   * `FINISH` priced into tugrik by the v1 vehicle-cost calculator — auction
   * price, Japan-side costs, freight and every Mongolian import tax. Null when
   * the API could not price it, and then the line simply does not render: the
   * yen figure above is already the answer to "what did it go for", so there is
   * nothing a placeholder would stand in for.
   */
  landedMnt?: number | null;
  /** Japan + Ulaanbaatar clocks for AUCTION_DATE, formatted server-side. */
  schedule: AuctionScheduleTimes | null;
  auctionLocation: string;
  town?: string;
  lot: string;
  /** Quick-spec grid rendered at the top of the card, above a divider. */
  quickSpecs?: ReactNode;
  /** Wishlist + compare for the mobile sticky bar; desktop puts them in the title header. */
  actions?: ReactNode;
};

const PILL: Record<FinishedState, string> = {
  sold: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30",
  unsold:
    "bg-neutral-100 text-neutral-600 ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-700",
  cancelled:
    "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30",
  other:
    "bg-neutral-100 text-neutral-600 ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-700",
};

/**
 * The finished-lot counterpart to {@link CarBidSection}: same card shell, same
 * quick specs, same {@link AuctionMeta} — but the countdown and bid form are
 * replaced by what the lot actually fetched. `/japan` does not filter finished
 * lots out of its list, so this is a routine screen, not an edge case.
 *
 * A server component on purpose: nothing here needs a session, a wallet balance
 * or a drawer, so a sold lot ships none of that JavaScript.
 *
 * One card at every width — with no drawer there is nothing to duplicate across
 * the breakpoint, unlike the bid panel.
 */
export default async function AuctionResultSection({
  state,
  rawStatus,
  finishJpy,
  landedMnt,
  schedule,
  auctionLocation,
  town,
  lot,
  quickSpecs,
  actions,
}: Props) {
  const t = await getTranslations("carDetail.result");

  // "other" means the upstream sent a verdict we have no word for; showing it
  // verbatim beats inventing one.
  const statusLabel = state === "other" ? rawStatus : t(state);

  // FINISH on an unsold or cancelled lot is the highest bid the room reached,
  // NOT a sale price — 30 of 33 sampled "Not Sold" rows carry one. Only a sold
  // lot may caption it as what the car fetched.
  const priceLabel = state === "sold" ? t("soldPrice") : t("topBid");
  const landed = landedMnt ?? 0;

  const pill = (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold ring-1 ring-inset",
        PILL[state],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {statusLabel}
    </span>
  );

  return (
    <>
      <section className="flex flex-col gap-4 rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
        {quickSpecs && (
          <>
            {quickSpecs}
            <div className="h-px bg-neutral-100 dark:bg-neutral-800" />
          </>
        )}

        <div className="flex flex-col gap-3">
          <h2 className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-100">
            {t("title")}
          </h2>
          <div className="flex flex-col gap-1">
            {/* Price left, verdict right. With no price the pill simply starts
                the row — no placeholder, no empty column. The landed line
                renders below this row rather than inside its flex-col: a
                third line in that column would grow it and drop `items-end`'s
                bottom edge onto the small grey landed text instead of the ¥
                figure, so it stays out and the row's height — and the pill's
                alignment — stays pinned to the label+price pair. */}
            <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-2">
              {finishJpy > 0 && (
                <div className="flex min-w-0 flex-col gap-0 leading-normal">
                  <span className="text-[11px] font-medium uppercase text-neutral-400 dark:text-neutral-500">
                    {priceLabel}
                  </span>
                  <span className="truncate text-[26px] font-extrabold leading-tight text-neutral-900 dark:text-neutral-100">
                    {formatJpy(finishJpy)}
                  </span>
                </div>
              )}
              {pill}
            </div>
            {finishJpy > 0 && landed > 0 && (
              <span className="truncate text-[12px] font-medium text-neutral-500 dark:text-neutral-400">
                {t("landed", { price: formatMnt(landed) })}
              </span>
            )}
          </div>
        </div>

        <div className="h-px bg-neutral-100 dark:bg-neutral-800" />
        <AuctionMeta
          schedule={schedule}
          auctionLocation={auctionLocation}
          town={town}
          lot={lot}
        />
      </section>

      {/* Mobile sticky bar — the bid CTA's slot, now carrying the result so it
          stays readable while scrolling. `md:pr-24` reserves the rightmost
          ~96px for the AI chat FAB, which otherwise covers the actions between
          768px and 1023px. */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-neutral-100 bg-white/95 px-4 md:pr-24 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur-xl lg:hidden dark:border-neutral-900 dark:bg-neutral-950/95">
        <div
          className="flex min-w-0 flex-1 flex-col items-start gap-1"
          aria-hidden
        >
          {pill}
          {finishJpy > 0 && (
            <span className="truncate text-[17px] font-extrabold leading-tight text-neutral-900 dark:text-neutral-100">
              {formatJpy(finishJpy)}
            </span>
          )}
          {finishJpy > 0 && landed > 0 && (
            <span className="truncate text-[11px] font-semibold leading-tight text-neutral-500 dark:text-neutral-400">
              {`≈ ${formatMnt(landed)}`}
            </span>
          )}
        </div>
        {actions}
      </div>
    </>
  );
}
