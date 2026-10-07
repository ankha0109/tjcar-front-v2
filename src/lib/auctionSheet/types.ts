import type { MarkCode } from "@/lib/auctionMarks";
import type { FieldKey } from "./fields";

/**
 * How a box is drawn.
 *
 * - `field`   printed label top-left, the inspector's value centred (default)
 * - `label`   the printed label only — its value sits in a neighbouring box
 * - `value`   the value only
 * - `note`    free text: label top-left, handwriting running down from it
 * - `check`   an equipment abbreviation, circled in ink when fitted
 * - `diagram` the unfolded car outline with its damage marks
 */
export type CellKind =
  | "field"
  | "label"
  | "value"
  | "note"
  | "check"
  | "diagram";

/** One box on a sheet. Coordinates are viewBox units; every sheet is 1000 wide. */
export type SheetCell = {
  /** Cells sharing a field light up together and explain the same thing. */
  field: FieldKey;
  x: number;
  y: number;
  w: number;
  h: number;
  kind?: CellKind;
  /** The label as this house prints it, when it differs from the field's. */
  jp?: string;
  sample?: string | string[];
  options?: string[];
  picked?: number;
};

/** A damage mark on the diagram; `x`/`y` are 0–1 inside the diagram cell. */
export type SheetMark = { code: MarkCode; x: number; y: number };

export type HouseId =
  | "uss"
  | "taa"
  | "caa"
  | "mirive"
  | "bayauc"
  | "iaa"
  | "hero"
  | "arai"
  | "laa"
  | "ju";

export type AuctionHouse = {
  id: HouseId;
  /** Shown on the tab — a proper name, never translated. */
  name: string;
  /** viewBox height; the width is always 1000. */
  height: number;
  cells: SheetCell[];
  marks: SheetMark[];
};

/** What a field means, in one locale. */
export type FieldText = {
  title: string;
  /** In-box label for translated mode, when `title` is too long for a box. */
  short?: string;
  description: string;
};
