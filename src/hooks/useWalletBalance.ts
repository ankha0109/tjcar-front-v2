"use client";

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { MINIMUM_BALANCE } from "@/lib/bidConfig";
import { getBalance } from "@/services/wallet";

/** Shared query key so any component (and the bid mutation) can invalidate it. */
export const WALLET_BALANCE_KEY = ["wallet", "balance"] as const;

type UseWalletBalanceResult = {
  /** Live balance if fetched, else the session seed, else 0. Never undefined. */
  balance: number;
  /** Currency label from the session (GET /balance does not return it). */
  currency: string;
  isFetching: boolean;
  isAuthenticated: boolean;
  /** `balance` has reached {@link MINIMUM_BALANCE} — bidding is unlocked. */
  isPremium: boolean;
  /** How far short of {@link MINIMUM_BALANCE} the balance is. 0 once premium. */
  missing: number;
  /** Progress towards {@link MINIMUM_BALANCE}, 0-100, capped at 100. */
  progress: number;
  /** Refetch the balance now — the manual refresh both wallet cards offer. */
  refresh: () => void;
};

/**
 * Live wallet balance for the authenticated customer.
 *
 * The balance stored in the NextAuth JWT is only captured at login, so an admin
 * recharge is invisible until re-login. This hook treats `GET /balance` as the
 * source of truth on the client while seeding from the session to avoid a flash
 * of stale/gated content on first paint. It refetches on mount and on window
 * focus (per-query overrides of the global `refetchOnWindowFocus: false`), so a
 * page refresh or tab return pulls the fresh amount and unlocks gated features.
 */
export function useWalletBalance(): UseWalletBalanceResult {
  const { data: session, status } = useSession();
  // Session user is cast the same way the other consumers do (the augmented
  // next-auth type doesn't surface these fields directly here).
  const sessionUser = session?.user as
    | { balance?: number; currency?: string }
    | undefined;
  const isAuthenticated = status === "authenticated" && !!session?.user;
  const seed = sessionUser?.balance;

  const query = useQuery({
    queryKey: WALLET_BALANCE_KEY,
    queryFn: getBalance,
    enabled: isAuthenticated,
    // Seed from the JWT so gating renders correctly on the first synchronous
    // paint, then reconcile with a fresh fetch.
    initialData: typeof seed === "number" ? seed : undefined,
    // Mark the seed as stale so `refetchOnMount: "always"` still pulls fresh.
    initialDataUpdatedAt: 0,
    staleTime: 30_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const queryClient = useQueryClient();
  const balance = query.data ?? seed ?? 0;

  const refresh = useCallback(
    () => queryClient.invalidateQueries({ queryKey: WALLET_BALANCE_KEY }),
    [queryClient],
  );

  return {
    balance,
    currency: sessionUser?.currency ?? "₮",
    isFetching: query.isFetching,
    isAuthenticated,
    // Derived here rather than in each card: the premium threshold is a rule
    // about the balance, so two cards computing it apart is two places to fix
    // when the rule moves.
    isPremium: balance >= MINIMUM_BALANCE,
    missing: Math.max(MINIMUM_BALANCE - balance, 0),
    progress: Math.min(Math.max(Math.round((balance / MINIMUM_BALANCE) * 100), 0), 100),
    refresh,
  };
}
