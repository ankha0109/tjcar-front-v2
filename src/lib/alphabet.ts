// Group a list into A–Z buckets keyed by the first letter of a derived label.

export type LetterGroup<T> = { letter: string; items: T[] };

/**
 * Bucket `items` by the uppercased first character of `label(item)`
 * ("Camry" → "C"); anything not starting with A–Z (digits, symbols, Hangul)
 * lands under "#". Assumes `items` is already sorted by that same label, so
 * buckets and their contents stay ordered; the "#" bucket is pushed last.
 */
export function groupByInitial<T>(
  items: T[],
  label: (item: T) => string,
): LetterGroup<T>[] {
  const order: string[] = [];
  const buckets = new Map<string, T[]>();

  for (const item of items) {
    const first = label(item).trim().charAt(0).toUpperCase();
    const letter = first >= "A" && first <= "Z" ? first : "#";
    let bucket = buckets.get(letter);
    if (!bucket) {
      bucket = [];
      buckets.set(letter, bucket);
      order.push(letter);
    }
    bucket.push(item);
  }

  return order
    .sort((a, b) => (a === "#" ? 1 : b === "#" ? -1 : a.localeCompare(b)))
    .map((letter) => ({ letter, items: buckets.get(letter)! }));
}
