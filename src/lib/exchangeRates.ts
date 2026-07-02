// TODO: Replace static rates with a Mongolbank API hook later.
export const EXCHANGE_RATES = {
  USD: { value: 3450, updatedAt: "2026-05-25T10:00:00Z" },
  JPY: { value: 23.1, updatedAt: "2026-05-25T10:00:00Z" },
} as const;

export function formatRate(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
  }).format(value);
}
