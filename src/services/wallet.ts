import Api from "@/services/Api";

/** Backend GET /api/balance response envelope. */
type BalanceResponse = { data?: { balance?: number } };

/**
 * GET /balance — the authenticated customer's current wallet balance (MNT).
 *
 * The backend shape is `{ "data": { "balance": 150000.0 } }`; we unwrap it to a
 * plain number. Unlike `GET /user` this endpoint returns only the amount (no
 * currency), which is exactly what changes when an admin recharges the wallet.
 */
export async function getBalance(): Promise<number> {
  const res = await Api.get<BalanceResponse>("/balance");
  return Number(res?.data?.balance) || 0;
}
