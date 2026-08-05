"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import BrandButton from "@/components/ui/BrandButton";
import { useWalletBalance, WALLET_BALANCE_KEY } from "@/hooks/useWalletBalance";
import { MINIMUM_BALANCE, formatMnt } from "@/lib/bidConfig";
import { cn } from "@/utils";

// Same shape MobileDrawer casts the session user to — the augmented next-auth
// type does not surface these fields here.
type CustomerUser = {
  firstname?: string;
  lastname?: string;
  name?: string;
};

type Props = {
  /** Opens the top-up drawer, which the parent owns. */
  onTopUp: () => void;
};

/**
 * The phone's version of {@link WalletBalanceCard}: who you are and what you
 * can spend, in one card that has to leave room for the menu underneath it.
 *
 * That is why the desktop card's four-line "what Premium buys you" list is not
 * here — the top-up drawer makes the same argument at the moment it matters.
 * The progress bar stays: below the threshold the number alone does not say
 * how far off bidding is.
 */
export default function MobileAccountCard({ onTopUp }: Props) {
  const t = useTranslations("dashboard.wallet");
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const user = session?.user as CustomerUser | undefined;
  const { balance, isFetching, isAuthenticated } = useWalletBalance();

  const isPremium = balance >= MINIMUM_BALANCE;
  const missing = Math.max(MINIMUM_BALANCE - balance, 0);
  const progress = Math.min(Math.round((balance / MINIMUM_BALANCE) * 100), 100);

  const fullName =
    [user?.firstname, user?.lastname].filter(Boolean).join(" ") ||
    user?.name ||
    "";
  const initials =
    `${user?.firstname?.[0] ?? ""}${user?.lastname?.[0] ?? ""}`.toUpperCase() ||
    "U";

  // `/dashboard` sits behind the proxy auth guard, so this is only the blink
  // before the session hydrates on the client.
  if (!isAuthenticated) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="h-10 w-40 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
        <div className="mt-4 h-9 w-48 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
      </div>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      {/* Warm brand haze in the corner — the one bit of colour on an otherwise
          neutral screen, so the balance reads as its subject. */}
      <div
        className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />

      <div className="relative flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white dark:bg-neutral-100 dark:text-neutral-900">
          {initials}
        </span>
        {fullName && (
          <p className="min-w-0 flex-1 truncate text-[15px] font-semibold text-neutral-900 dark:text-neutral-100">
            {fullName}
          </p>
        )}
        <button
          type="button"
          onClick={() =>
            queryClient.invalidateQueries({ queryKey: WALLET_BALANCE_KEY })
          }
          disabled={isFetching}
          aria-label={t("refresh")}
          className="ml-auto inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 disabled:opacity-60 dark:border-neutral-700 dark:text-neutral-400"
        >
          <RefreshIcon className={isFetching ? "animate-spin" : undefined} />
        </button>
      </div>

      <div className="relative mt-4">
        <p className="text-[11px] font-semibold uppercase text-neutral-500 dark:text-neutral-400">
          {t("balanceLabel")}
        </p>
        <p className="mt-1 text-[32px] font-semibold leading-none tabular-nums text-neutral-900 dark:text-neutral-100">
          {formatMnt(balance)}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span
            className={cn(
              "h-1.5 w-1.5 shrink-0 rounded-full",
              isPremium ? "bg-emerald-500" : "bg-amber-500",
            )}
            aria-hidden
          />
          <p className="text-[13px] text-neutral-600 dark:text-neutral-400">
            {isPremium
              ? t("premiumActive")
              : t("shortBy", { amount: formatMnt(missing) })}
          </p>
        </div>
      </div>

      {!isPremium && (
        <div className="relative mt-4">
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t("progressAria")}
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500"
              style={{ width: `${Math.max(progress, 2)}%` }}
            />
          </div>
          <p className="mt-2 text-[12px] text-neutral-500 dark:text-neutral-400">
            {t("minimumHint", { amount: formatMnt(MINIMUM_BALANCE) })}
          </p>
        </div>
      )}

      <div className="relative mt-5">
        <BrandButton block size="large" onClick={onTopUp}>
          {t("topUp")}
        </BrandButton>
      </div>
    </section>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <polyline points="21 3 21 9 15 9" />
    </svg>
  );
}
