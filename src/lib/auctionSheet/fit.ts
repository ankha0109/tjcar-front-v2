/**
 * Text fitting for the sheet SVG.
 *
 * SVG `<text>` neither wraps nor clips, and the sheet is server-rendered, so
 * nothing can be measured in the DOM. Widths are estimated from character
 * classes instead — close enough for Inter and the system CJK faces, and
 * deterministic, which keeps the server and client markup identical. The
 * figures lean wide (they are Inter's semibold advances): an estimate that runs
 * short lets text cross a rule, one that runs long only costs half a point.
 */

const CJK = /[\u3000-\u30ff\u3400-\u9fff\uff00-\uffef]/;
const WIDE = /[A-ZА-ЯЁӨҮMW@%]/;
const NARROW = /[\s.,:;'!|ilI1()/・\-]/;

function charEm(ch: string): number {
  if (ch === "・") return 0.6;
  if (CJK.test(ch)) return 1;
  if (ch === " ") return 0.28;
  if (NARROW.test(ch)) return 0.34;
  if (/\d/.test(ch)) return 0.66;
  if (WIDE.test(ch)) return 0.74;
  return 0.6;
}

/** Estimated advance width of `text` at `size`. */
export function textWidth(text: string, size: number): number {
  let em = 0;
  for (const ch of text) em += charEm(ch);
  return em * size;
}

/** Greedy wrap at spaces; a CJK run too long for the line breaks per glyph. */
function wrap(text: string, width: number, size: number): string[] {
  const lines: string[] = [];
  let line = "";
  const push = (word: string) => {
    const next = line ? `${line} ${word}` : word;
    if (textWidth(next, size) <= width) {
      line = next;
      return;
    }
    if (line) lines.push(line);
    line = word;
  };
  for (const word of text.split(" ").filter(Boolean)) {
    if (textWidth(word, size) <= width || !CJK.test(word)) {
      push(word);
      continue;
    }
    for (const ch of word) {
      if (textWidth(line + ch, size) <= width) line += ch;
      else {
        if (line) lines.push(line);
        line = ch;
      }
    }
  }
  if (line) lines.push(line);
  return lines;
}

function truncate(line: string, width: number, size: number): string {
  if (textWidth(line, size) <= width) return line;
  const chars = [...line];
  while (chars.length > 1 && textWidth(`${chars.join("")}…`, size) > width) {
    chars.pop();
  }
  return `${chars.join("").trimEnd()}…`;
}

export type Fit = { size: number; lines: string[]; lineHeight: number };

/**
 * Largest size between `max` and `min` at which `text` fits a `w × h` box in at
 * most `lines` lines. If even `min` does not fit, the text is truncated with an
 * ellipsis — it must never spill over the neighbouring box.
 */
export function fitText(
  text: string,
  w: number,
  h: number,
  opts: { max: number; min: number; lines?: number },
): Fit {
  const maxLines = opts.lines ?? 1;
  const LEADING = 1.18;
  for (let size = opts.max; size >= opts.min; size -= 0.5) {
    const lines = wrap(text, w, size);
    const fits =
      lines.length <= maxLines &&
      lines.length * size * LEADING <= h &&
      lines.every((line) => textWidth(line, size) <= w);
    if (fits) return { size, lines, lineHeight: size * LEADING };
  }
  const size = opts.min;
  const room = Math.max(1, Math.min(maxLines, Math.floor(h / (size * LEADING))));
  const wrapped = wrap(text, w, size);
  const lines = wrapped.slice(0, room);
  if (wrapped.length > room) {
    lines[room - 1] = truncate(`${lines[room - 1]}…`, w, size);
  }
  return {
    size,
    lines: lines.map((line) => truncate(line, w, size)),
    lineHeight: size * LEADING,
  };
}
