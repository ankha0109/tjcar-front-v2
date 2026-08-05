"use client";

import { useTranslations } from "next-intl";
import BrandButton from "@/components/ui/BrandButton";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { MINIMUM_BALANCE, formatMnt } from "@/lib/bidConfig";
import { cn } from "@/utils";

/** Shared with the Premium modal on car pages so the two lists never drift. */
const BENEFIT_KEYS = ["benefit1", "benefit2", "benefit3", "benefit4"] as const;

type Props = {
  /** Opens the top-up drawer. */
  onTopUp: () => void;
};

/**
 * The customer's wallet, at the top of the dashboard.
 *
 * The amount is read live from `GET /balance` (see {@link useWalletBalance}) —
 * an admin credits the account by hand after a bank transfer, so the JWT copy
 * captured at login goes stale within minutes of a top-up. The Premium
 * threshold is {@link MINIMUM_BALANCE} rather than copy, so this card, the bid
 * gate and the premium modal can never quote different numbers.
 *
 * Below the threshold the card also argues *why* to top up; above it, that
 * space is not worth spending on someone who already paid.
 */
export default function WalletBalanceCard({ onTopUp }: Props) {
  const t = useTranslations("dashboard.wallet");
  const tPremium = useTranslations("car.premiumInfo");
  const { balance, isFetching, isAuthenticated, isPremium, missing, progress, refresh } = useWalletBalance();

  if (!isAuthenticated) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-5 sm:p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="h-3 w-24 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
        <div className="mt-3 h-9 w-48 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
      </div>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-xl border border-neutral-200 bg-white p-5 sm:p-6 dark:border-neutral-800 dark:bg-neutral-900">
      {/* Warm brand haze in the corner — the one bit of colour on an otherwise
          neutral dashboard, so the balance reads as the page's subject. */}
      <div
        className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />

      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase text-neutral-500 dark:text-neutral-400">
            {t("balanceLabel")}
          </p>
          <p className="mt-2 text-[32px] font-semibold leading-none tabular-nums text-neutral-900 sm:text-[38px] dark:text-neutral-100">
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

        <button
          type="button"
          onClick={refresh}
          disabled={isFetching}
          className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 px-2.5 py-1.5 text-[12px] font-medium text-neutral-600 transition-colors hover:border-neutral-300 hover:text-neutral-900 disabled:opacity-60 dark:border-neutral-700 dark:text-neutral-300 dark:hover:text-neutral-100"
        >
          <RefreshIcon className={isFetching ? "animate-spin" : undefined} />
          {t("refresh")}
        </button>
      </div>

      {/* Below the threshold the number alone says little — the bar turns it
          into "how far from being able to bid". */}
      {!isPremium && (
        <div className="relative mt-5">
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

      {isPremium && (
        <p className="relative mt-4 text-[12.5px] text-neutral-500 dark:text-neutral-400">
          {t("premiumActiveHint")}
        </p>
      )}

      {!isPremium && (
        <div className="relative mt-5 border-t border-neutral-100 pt-5 dark:border-neutral-800">
          <p className="text-[11px] font-semibold uppercase text-neutral-500 dark:text-neutral-400">
            {t("benefitsHeading", { amount: formatMnt(MINIMUM_BALANCE) })}
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {BENEFIT_KEYS.map((key) => (
              <li key={key} className="flex items-start gap-2.5">
                <CheckIcon />
                <span className="text-[12.5px] leading-snug text-neutral-600 dark:text-neutral-400">
                  {tPremium(key)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="relative mt-5">
        <BrandButton size="large" onClick={onTopUp}>
          {t("topUp")}
        </BrandButton>
      </div>
    </section>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-0.5 shrink-0 text-primary"
      aria-hidden
    >
      <path d="m5 13 4 4L19 7" />
    </svg>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg
      width="13"
      height="13"
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
