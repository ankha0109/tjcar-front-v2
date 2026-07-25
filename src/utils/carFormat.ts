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
  return `${engineCc.toLocaleString()} CC`;
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

/** Compact engine tile value: displacement + optional power, e.g. "2,500CC (128HP)". */
export function formatEngineWithPower(
  engineCc: number | undefined,
  powerHp: number | undefined,
): string | undefined {
  const cc = engineCc ? `${engineCc.toLocaleString()}CC` : undefined;
  const hp = powerHp ? `${powerHp.toLocaleString()}HP` : undefined;
  if (cc && hp) return `${cc} (${hp})`;
  return cc ?? hp;
}

export function formatDrivetrain(
  drivetrain: string | undefined,
  t: Translator,
): string | undefined {
  if (!drivetrain) return undefined;
  // AJES layout codes → readable labels; MR/RR and anything unknown fall through raw.
  const code = drivetrain.toUpperCase().replace(/\s+/g, "");
  if (code === "FF") return t("drivetrain.fwd");
  if (code === "FR") return t("drivetrain.rwd");
  if (["4WD", "4", "F4", "R4"].includes(code)) return t("drivetrain.fourWd");
  if (code === "AWD") return t("drivetrain.awd");
  return drivetrain;
}
