/**
 * The FAQ items rendered on /report. The accordion (ReportFAQ) and the
 * FAQPage JSON-LD (ReportJsonLd) both iterate this list so they can never
 * drift apart.
 */
export const REPORT_FAQ_KEYS = [
  "q1",
  "q2",
  "q3",
  "q4",
  "q5",
  "q6",
  "q7",
  "q8",
  "q9",
  "q10",
] as const;
