// Group a sorted list of strings into A–Z buckets keyed by their first letter.

export type LetterGroup = { letter: string; items: string[] };

/**
 * Bucket `items` by their uppercased first character ("Camry" → "C"); anything
 * that doesn't start with A–Z (digits, symbols) lands under "#". Assumes
 * `items` is already sorted A–Z, so buckets and their contents stay ordered;
 * the "#" bucket is pushed last.
 */
export function groupByInitial(items: string[]): LetterGroup[] {
  const order: string[] = [];
  const buckets = new Map<string, string[]>();

  for (const item of items) {
    const first = item.trim().charAt(0).toUpperCase();
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
