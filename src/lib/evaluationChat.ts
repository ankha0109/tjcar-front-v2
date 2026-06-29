/**
 * Static (no-backend) logic for the auction evaluation-sheet AI assistant.
 *
 * The conversational copy lives in `messages/*.json` under
 * `carDetail.evaluation.ai.*`. This module only decides WHICH canned answer a
 * free-typed question maps to, so the component stays purely presentational and
 * can later be swapped for the real `/ai/chat` backend without touching copy.
 */

export type EvalAnswerKey = "rate" | "interior" | "equipment" | "damage" | "fallback";

/**
 * Suggested questions (`carDetail.evaluation.ai.suggested`) map 1:1 by index to
 * these answer keys, so a clicked suggestion never needs keyword matching.
 */
export const SUGGESTED_ANSWER_KEYS: EvalAnswerKey[] = [
  "rate",
  "interior",
  "equipment",
  "damage",
];

// Order matters: more specific topics are checked before the broad "rate"
// bucket (an "interior grade" question also contains the word "grade").
const KEYWORDS: Array<[Exclude<EvalAnswerKey, "fallback">, string[]]> = [
  [
    "damage",
    [
      "damage", "scratch", "dent", "repair", "accident",
      "повреж", "царапин", "вмятин", "ремонт", "дтп", "авар",
      "гэмт", "маажил", "зураас", "засвар", "осол", "хонхойл",
    ],
  ],
  [
    "equipment",
    [
      "equip", "feature", "option",
      "оборудов", "комплектац", "опци", "функц",
      "тоног", "тоноглол", "онцлог", "хэрэгсэл",
    ],
  ],
  [
    "interior",
    [
      "interior", "cabin", "inside", "seat",
      "салон", "интерьер", "сидень",
      "дотор", "суудал",
    ],
  ],
  [
    "rate",
    [
      "rate", "grade", "overall", "score",
      "оценк", "балл", "класс",
      "үнэлгээ", "ерөнхий", "нийт", "оноо",
    ],
  ],
];

/** Map an arbitrary user question to the closest canned answer key. */
export function matchEvaluationQuestion(text: string): EvalAnswerKey {
  const lower = text.toLowerCase();
  for (const [key, words] of KEYWORDS) {
    if (words.some((w) => lower.includes(w))) return key;
  }
  return "fallback";
}
