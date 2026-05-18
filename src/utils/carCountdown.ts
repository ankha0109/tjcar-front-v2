import dayjs from "dayjs";
import type { CarSource } from "@/types/car";

export type Countdown =
  | { kind: "today"; urgent: true; passed: false }
  | { kind: "tomorrow"; urgent: true; passed: false }
  | { kind: "days"; days: number; urgent: boolean; passed: false }
  | { kind: "date"; label: string; urgent: false; passed: true }
  | null;

export function getCountdown(dateStr: string | undefined): Countdown {
  if (!dateStr) return null;
  const d = dayjs(dateStr);
  if (!d.isValid()) return null;
  const days = d.startOf("day").diff(dayjs().startOf("day"), "day");
  if (days < 0)
    return {
      kind: "date",
      label: d.format("YYYY-MM-DD"),
      urgent: false,
      passed: true,
    };
  if (days === 0) return { kind: "today", urgent: true, passed: false };
  if (days === 1) return { kind: "tomorrow", urgent: true, passed: false };
  if (days <= 2) return { kind: "days", days, urgent: true, passed: false };
  return { kind: "days", days, urgent: false, passed: false };
}

// Japan auction data arrives in GMT+9; convert to GMT+8 (Mongolia).
// Korea/China data already arrives in GMT+8.
export function formatAuctionTime(
  dateStr: string | undefined,
  source: CarSource,
): string | null {
  if (!dateStr) return null;
  const d = dayjs(dateStr);
  if (!d.isValid()) return null;
  const displayed = source === "japan" ? d.subtract(1, "hour") : d;
  return `${displayed.format("YYYY-MM-DD HH:mm")} (GMT+8)`;
}

export function formatCountdownLabel(
  countdown: Countdown,
  t: (key: string, params?: Record<string, string | number | Date>) => string,
): string | null {
  if (!countdown) return null;
  if (countdown.kind === "today") return t("today");
  if (countdown.kind === "tomorrow") return t("tomorrow");
  if (countdown.kind === "days") return t("daysLeft", { days: countdown.days });
  return countdown.label;
}
