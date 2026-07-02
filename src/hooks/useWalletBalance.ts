"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
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

  return {
    balance: query.data ?? seed ?? 0,
    currency: sessionUser?.currency ?? "₮",
    isFetching: query.isFetching,
    isAuthenticated,
  };
}
