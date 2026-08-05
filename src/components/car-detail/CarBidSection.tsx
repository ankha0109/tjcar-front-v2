"use client";

import { useState } from "react";
import { Drawer, Typography } from "antd";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { useLandedPrice } from "@/hooks/useLandedPrice";
import BrandButton from "@/components/ui/BrandButton";
import CarBidForm from "./CarBidForm";
import AuctionCountdown from "./AuctionCountdown";
import AuctionSchedule, { type AuctionScheduleTimes } from "./AuctionSchedule";
import { MINIMUM_BALANCE, BID_CUTOFF_HOURS, formatMnt } from "@/lib/bidConfig";
import { parseJapanAuctionDate } from "@/utils/auctionTime";

/** Session user fields the bid panel needs (balance comes from useWalletBalance). */
type BidUser = { type: number };

type Props = {
  /** AJES lot id — POST /bids `auction_id`. */
  auctionId: string;
  /** JPY start (opening) price. */
  startPrice: number;
  status: string;
  auctionDate: string;
  /** Japan + Ulaanbaatar clocks for {@link auctionDate}, formatted server-side. */
  schedule: AuctionScheduleTimes | null;
  /** Auction house / venue (AUCTION). */
  auctionLocation: string;
  /** Location town/region (TOWN) — often empty; shown only when present. */
  town?: string;
  /** Lot number (LOT). */
  lot: string;
  /** Calculator inputs. */
  chassis: string;
  engineSize: string;
  year: string;
  rate: string;
  /** Live JPY → MNT rate from /config. */
  jpyRate: number;
  /** Quick-spec grid rendered at the top of the card, above a divider. */
  quickSpecs?: React.ReactNode;
  /**
   * Secondary actions for the mobile sticky bar, right of the bid CTA (wishlist
   * + compare on the Japan lot page). The `lg` layout puts those in the page's
   * title header instead, so this slot is effectively mobile-only.
   */
  actions?: React.ReactNode;
};

/**
 * Best-effort closed check. The backend is the source of truth (it rejects bids
 * placed less than {@link BID_CUTOFF_HOURS} hours before the auction); here we
 * only surface an obviously-closed state: sold, or the auction time has passed.
 * The auction time is Japan (GMT+9); {@link parseJapanAuctionDate} anchors it and
 * returns null for the 00:00:00 "not scheduled" sentinel, so those stay open.
 */
function isAuctionClosed(status: string, auctionDate: string): boolean {
  if (["SOLD", "Sold"].includes(status)) return true;
  const d = parseJapanAuctionDate(auctionDate);
  if (!d) return false;
  return Date.now() > d.getTime();
}

export default function CarBidSection(props: Props) {
  const {
    auctionId,
    startPrice,
    status,
    auctionDate,
    schedule,
    auctionLocation,
    town,
    lot,
    chassis,
    engineSize,
    year,
    rate,
    jpyRate,
    quickSpecs,
    actions,
  } = props;

  const t = useTranslations("carDetail.bid");
  const tSpecs = useTranslations("carDetail.specs");
  const pathname = usePathname();
  const { data: session, status: authStatus } = useSession();
  const { balance: liveBalance } = useWalletBalance();
  const [open, setOpen] = useState(false);

  const user = session?.user as BidUser | undefined;
  const closed = isAuctionClosed(status, auctionDate);
  const loggedIn = authStatus === "authenticated" && !!user;
  // Live balance (fresh from GET /balance) so an admin recharge unlocks the form
  // on refresh/focus — the JWT `user.balance` is only a login-time snapshot.
  const hasDeposit = liveBalance >= MINIMUM_BALANCE;
  const showForm = !closed && loggedIn && hasDeposit;

  // MNT minimum bid (price basis = START) — only fetched once the form is shown.
  const { data: minAmount = 0, isLoading: loadingMin } = useLandedPrice({
    auctionId,
    chassis,
    engineSize,
    year,
    rate,
    price: startPrice,
    enabled: showForm,
  });

  // Everything you need before bidding — both clocks, then venue/lot/town.
  // Grouped inside the "join the auction" block rather than with the car specs:
  // these describe the sale, not the car. Always visible, even to guests.
  const auctionMeta = (
    <div className="flex flex-col gap-3">
      <AuctionSchedule schedule={schedule} />
      {/* Same label/value recipe as the quick specs above: 11px uppercase
          label, 13px semibold value, gap-0 + leading-normal, value truncates. */}
      <dl className="grid grid-cols-2 gap-x-3 gap-y-4">
        <div className="flex min-w-0 flex-col gap-0 leading-normal">
          <dt className="text-[11px] font-medium uppercase text-neutral-400 dark:text-neutral-500">
            {tSpecs("auction")}
          </dt>
          <dd className="truncate text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
            {auctionLocation || "-"}
          </dd>
        </div>
        <div className="flex min-w-0 flex-col gap-0 leading-normal">
          <dt className="text-[11px] font-medium uppercase text-neutral-400 dark:text-neutral-500">
            {tSpecs("lot")}
          </dt>
          <dd className="flex items-center gap-1 text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
            <span className="truncate">{lot || "-"}</span>
            {/* Bare antd copy control — the number keeps its own typography and
                only the button comes from antd. Its tooltip ("Хуулбарлах" /
                "Хуулсан") ships with the ConfigProvider locale, so mn/en/ru all
                read correctly without extra message keys. */}
            {lot ? <Typography.Text copyable={{ text: lot }} /> : null}
          </dd>
        </div>
        {town && (
          <div className="flex min-w-0 flex-col gap-0 leading-normal">
            <dt className="text-[11px] font-medium uppercase text-neutral-400 dark:text-neutral-500">
              {tSpecs("location")}
            </dt>
            <dd className="truncate text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
              {town}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );

  const gateCard = (title: string, body: string, actions?: React.ReactNode) => (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-6 text-center dark:border-neutral-800 dark:bg-neutral-900">
      <h3 className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-100">
        {title}
      </h3>
      <p className="max-w-sm text-[13px] text-neutral-500 dark:text-neutral-400">
        {body}
      </p>
      {actions && <div className="mt-1 flex items-center gap-2">{actions}</div>}
    </div>
  );

  const renderBody = (onSubmitted?: () => void) => {
    if (closed) {
      return gateCard(
        t("closedTitle"),
        t("closedBody", { hours: BID_CUTOFF_HOURS }),
      );
    }
    if (authStatus === "loading") {
      return (
        <div className="h-28 animate-pulse rounded-2xl bg-neutral-100 dark:bg-neutral-900" />
      );
    }
    if (!loggedIn) {
      return gateCard(
        t("guestTitle"),
        t("guestBody"),
        <>
          <Link
            href={`/auth/login?callbackUrl=${encodeURIComponent(pathname)}`}
          >
            <BrandButton size="middle">{t("login")}</BrandButton>
          </Link>
          <span className="text-[12px] text-neutral-400">{t("or")}</span>
          <Link
            href={`/auth/register?callbackUrl=${encodeURIComponent(pathname)}`}
          >
            <BrandButton size="middle" ghost>
              {t("register")}
            </BrandButton>
          </Link>
        </>,
      );
    }
    if (!hasDeposit) {
      return gateCard(
        t("depositTitle"),
        t("depositBody", { amount: formatMnt(MINIMUM_BALANCE) }),
        <Link href="/dashboard?topup=1">
          <BrandButton size="middle">{t("topUp")}</BrandButton>
        </Link>,
      );
    }
    return (
      <CarBidForm
        auctionId={auctionId}
        startPrice={startPrice}
        minAmount={minAmount}
        loadingMin={loadingMin}
        canChooseCurrency={user?.type === 2}
        jpyRate={jpyRate}
        onSubmitted={onSubmitted}
      />
    );
  };

  return (
    <>
      {/* Desktop — one card: quick specs, then the join-the-auction block
          (countdown, both clocks, venue/lot) and the bid form. */}
      <section className="hidden flex-col gap-4 rounded-2xl border border-neutral-200 p-4 lg:flex dark:border-neutral-800">
        {quickSpecs && (
          <>
            {quickSpecs}
            <div className="h-px bg-neutral-100 dark:bg-neutral-800" />
          </>
        )}
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <h2 className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-100">
            {t("panelTitle")}
          </h2>
          {/* Countdown beside the title as a compact, understated timer. */}
          <AuctionCountdown auctionDate={auctionDate} variant="inline" />
        </div>
        {auctionMeta}
        {renderBody()}
      </section>

      {/* Mobile — same blocks inline (the form itself lives in the drawer the
          sticky bar opens). */}
      <div className="lg:hidden">
        <section className="flex flex-col gap-4 rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
          {quickSpecs && (
            <>
              {quickSpecs}
              <div className="h-px bg-neutral-100 dark:bg-neutral-800" />
            </>
          )}
          <h2 className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-100">
            {t("panelTitle")}
          </h2>
          <AuctionCountdown auctionDate={auctionDate} />
          {auctionMeta}
        </section>

        <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-2 border-t border-neutral-100 bg-white/95 px-4 md:pr-24 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur-xl dark:border-neutral-900 dark:bg-neutral-950/95">
          <BrandButton
            size="large"
            className="min-w-0 flex-1"
            onClick={() => setOpen(true)}
          >
            {t("cta")}
          </BrandButton>
          {actions}
        </div>

        <Drawer
          title={t("panelTitle")}
          placement="bottom"
          size="auto"
          open={open}
          onClose={() => setOpen(false)}
          styles={{ body: { paddingTop: 12 } }}
        >
          {renderBody(() => setOpen(false))}
        </Drawer>
      </div>
    </>
  );
}
