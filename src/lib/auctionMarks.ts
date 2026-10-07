/**
 * Inspection-sheet mark codes, in the order the Japanese auction sheets use
 * them. Each code is localized as a `{ title, description }` pair under
 * `carDetail.evaluationGuide.marks.*`.
 */
export const MARK_CODES = [
  "A1",
  "A2",
  "A3",
  "E1",
  "E2",
  "E3",
  "U1",
  "U2",
  "U3",
  "W1",
  "W2",
  "W3",
  "S1",
  "S2",
  "C1",
  "C2",
  "P",
  "X",
  "XX",
  "B1",
  "B2",
  "B3",
  "Y1",
  "Y2",
  "Y3",
  "X1",
  "R",
  "RX",
  "G",
] as const;

export type MarkCode = (typeof MARK_CODES)[number];
