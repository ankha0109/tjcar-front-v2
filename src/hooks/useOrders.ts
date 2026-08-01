"use client";

import { useQuery } from "@tanstack/react-query";
import { getOrder, listOrders } from "@/services/orders";

/** Root key — invalidating it refreshes every list page and every open detail. */
export const ORDERS_KEY = ["orders"] as const;

export const ORDERS_PER_PAGE = 10;

/**
 * One page of the customer's orders. A car's location advances while the page
 * is open, so this refetches on focus rather than trusting the first render
 * (same reasoning as `useBidList`).
 */
export function useOrderList(page: number) {
  return useQuery({
    queryKey: [...ORDERS_KEY, "list", page],
    queryFn: () => listOrders(page, ORDERS_PER_PAGE),
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: [...ORDERS_KEY, "detail", id],
    queryFn: () => getOrder(id),
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });
}
