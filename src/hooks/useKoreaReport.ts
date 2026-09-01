"use client";

import { useQuery } from "@tanstack/react-query";
import Api from "@/services/Api";
import type { KoreaInspection, KoreaInsurance } from "@/types/korea";

/**
 * Each of these costs Encar an upstream call, so they are deliberately NOT part
 * of the detail payload: the page renders on one call and a report is fetched
 * only when the buyer opens its modal. Too many calls per page view is what
 * gets our server's IP blocked.
 *
 * `null` is a valid answer and means the report does not exist. An upstream
 * that could not be reached is a 503 instead, so the modal can tell "this car
 * has no accident history on file" apart from "we could not look it up" and
 * offer a retry on the second.
 */
const REPORT_STALE_TIME = 30 * 60_000;

export function useKoreaInspection(id: string, enabled: boolean) {
  return useQuery<KoreaInspection | null>({
    queryKey: ["korea-inspection", id],
    queryFn: async () => {
      const { data } = await Api.get<{ data: KoreaInspection | null }>(
        `/korea/${id}/inspection`,
      );
      return data;
    },
    enabled,
    staleTime: REPORT_STALE_TIME,
  });
}

export function useKoreaInsurance(id: string, enabled: boolean) {
  return useQuery<KoreaInsurance | null>({
    queryKey: ["korea-insurance", id],
    queryFn: async () => {
      const { data } = await Api.get<{ data: KoreaInsurance | null }>(
        `/korea/${id}/insurance`,
      );
      return data;
    },
    enabled,
    staleTime: REPORT_STALE_TIME,
  });
}
