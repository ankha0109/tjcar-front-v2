import type { CarCurrency } from "@/types/car";

export const CURRENCY_SYMBOL: Record<CarCurrency, string> = {
  JPY: "¥",
  KRW: "₩",
  CNY: "¥",
  USD: "$",
};

type Translator = (
  key: string,
  params?: Record<string, string | number | Date>,
) => string;

export function formatMileage(
  mileageKm: number | undefined,
  t: Translator,
): string | undefined {
  if (!mileageKm) return undefined;
  return `${mileageKm.toLocaleString()} ${t("mileageUnit")}`;
}

export function formatEngine(engineCc: number | undefined): string | undefined {
  if (!engineCc) return undefined;
  return `${(engineCc / 100).toFixed(1)}L`;
}

export function formatTransmission(
  transmission: string | undefined,
  t: Translator,
): string | undefined {
  if (!transmission) return undefined;
  const code = transmission.toUpperCase();
  // AJES codes (MT/AT/FAT/IAT/CVT) + normalized Encar values (auto/manual/semi-auto/cvt).
  if (["MT", "MANUAL"].includes(code)) return t("transmission.manual");
  if (["AT", "FAT", "IAT", "CVT", "AUTO"].includes(code)) {
    return t("transmission.auto");
  }
  if (code === "SEMI-AUTO") return t("transmission.semiAuto");
  return transmission;
}
