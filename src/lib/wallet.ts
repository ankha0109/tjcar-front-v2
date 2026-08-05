/**
 * Wallet top-up constants.
 *
 * Ported verbatim from v1 (`components/dashboard/BankAccountInfo.js` and the
 * contract iframe in `BalanceInfo.js`). The backend exposes only the balance
 * (`GET /balance`) and the "I transferred, please confirm" notification
 * (`POST /balance-requests`) — the account itself is not served by the API, so
 * these stay in the frontend exactly as production v1 shows them.
 */

/** Company bank account customers wire their deposit to. */
export const BANK_ACCOUNT = {
  /** Bank name, as printed on the transfer form. */
  bank: "Хаан банк",
  iban: "MN 05 000500",
  /** Account number, kept in the same 4-4-2 grouping v1 displays. */
  number: "5015 6675 74",
  /** Legal account holder — never translated, it must match the bank record. */
  holder: "Ти Жэй Кар",
} as const;

/** Published (read-only) Google Doc of the auction service agreement. */
export const CONTRACT_URL =
  "https://docs.google.com/document/d/e/2PACX-1vQlISCS612CnqcBunl01B6pDG36fDFPs2I-CUC-djEQbOnGSruzQW8Bg_qbuYWDJA/pub";

/** Same doc, embeddable in an iframe (Google strips its chrome with this flag). */
export const CONTRACT_EMBED_URL = `${CONTRACT_URL}?embedded=true`;

/**
 * What the customer must write in the transfer note so accounting can match the
 * incoming payment to their account. v1 used "firstname phone".
 */
export function transferNote(user?: {
  firstname?: string | null;
  phone?: string | null;
}): string {
  return [user?.firstname, user?.phone].filter(Boolean).join(" ").trim();
}
