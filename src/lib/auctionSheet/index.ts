import type { MarkCode } from "@/lib/auctionMarks";
import type { FieldKey } from "./fields";
import type { AuctionHouse, HouseId, SheetCell, SheetMark } from "./types";
import { arai } from "./houses/arai";
import { bayauc } from "./houses/bayauc";
import { caa } from "./houses/caa";
import { hero } from "./houses/hero";
import { iaa } from "./houses/iaa";
import { ju } from "./houses/ju";
import { laa } from "./houses/laa";
import { mirive } from "./houses/mirive";
import { taa } from "./houses/taa";
import { uss } from "./houses/uss";

export type { AuctionHouse, HouseId, SheetCell, SheetMark } from "./types";
export type { FieldKey } from "./fields";
export { matchHouse } from "./match";

/** Tab order: by how much of our catalogue each house supplies. */
export const HOUSES: AuctionHouse[] = [
  uss,
  taa,
  ju,
  caa,
  mirive,
  bayauc,
  iaa,
  hero,
  arai,
  laa,
];

export const HOUSE_IDS: HouseId[] = HOUSES.map((house) => house.id);

/** The house for a `?auction=` value. Anything unknown gets USS. */
export function getHouse(id: string | undefined): AuctionHouse {
  return HOUSES.find((house) => house.id === id) ?? uss;
}

/**
 * One thing the reader can point at: a field (all of its boxes together) or a
 * damage mark on the diagram.
 */
export type Stop =
  | { id: string; type: "field"; field: FieldKey; cells: SheetCell[] }
  | { id: string; type: "mark"; code: MarkCode; mark: SheetMark };

const stopsCache = new Map<HouseId, Stop[]>();

/** A house's stops in reading order — fields first, then the diagram's marks. */
export function houseStops(house: AuctionHouse): Stop[] {
  const cached = stopsCache.get(house.id);
  if (cached) return cached;

  const byField = new Map<FieldKey, SheetCell[]>();
  for (const cell of house.cells) {
    const cells = byField.get(cell.field);
    if (cells) cells.push(cell);
    else byField.set(cell.field, [cell]);
  }
  const stops: Stop[] = [...byField].map(([field, cells]) => ({
    id: field,
    type: "field",
    field,
    cells,
  }));
  house.marks.forEach((mark, index) => {
    stops.push({ id: `mark-${index}`, type: "mark", code: mark.code, mark });
  });

  stopsCache.set(house.id, stops);
  return stops;
}

/** The diagram box a house's marks are drawn in. */
export function diagramCell(house: AuctionHouse): SheetCell | undefined {
  return house.cells.find((cell) => cell.kind === "diagram");
}

/** `CarDiagram` is drawn in this box; marks are placed as fractions of it. */
export const CAR_BOX = { w: 200, h: 300 };

/** Where the car drawing lands inside a diagram cell: centred, aspect kept. */
export function carPlacement(cell: SheetCell): {
  x: number;
  y: number;
  scale: number;
} {
  const PAD = 10;
  const scale = Math.min(
    (cell.w - PAD * 2) / CAR_BOX.w,
    (cell.h - PAD * 2) / CAR_BOX.h,
  );
  return {
    x: cell.x + (cell.w - CAR_BOX.w * scale) / 2,
    y: cell.y + (cell.h - CAR_BOX.h * scale) / 2,
    scale,
  };
}

/** A mark's centre in viewBox units, or `undefined` on a sheet with no diagram. */
export function markPosition(
  house: AuctionHouse,
  mark: SheetMark,
): { x: number; y: number } | undefined {
  const cell = diagramCell(house);
  if (!cell) return undefined;
  const car = carPlacement(cell);
  return {
    x: car.x + mark.x * CAR_BOX.w * car.scale,
    y: car.y + mark.y * CAR_BOX.h * car.scale,
  };
}
