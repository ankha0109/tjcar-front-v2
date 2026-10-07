"use client";

import { memo } from "react";
import {
  carPlacement,
  houseStops,
  markPosition,
  type AuctionHouse,
  type FieldKey,
  type SheetCell,
  type Stop,
} from "@/lib/auctionSheet";
import { fieldMeta } from "@/lib/auctionSheet/fields";
import { fitText, textWidth, type Fit } from "@/lib/auctionSheet/fit";
import type { FieldText } from "@/lib/auctionSheet/types";
import CarDiagram from "./CarDiagram";

/** Printed labels in the Japanese original, or translated into the page locale. */
export type LabelMode = "jp" | "local";

type Texts = Record<FieldKey, FieldText>;
/** Japanese → page locale, for what is written or circled on the sheet. */
type Glossary = Record<string, string>;

type Handlers = {
  onEnter: (id: string) => void;
  onLeave: () => void;
  onSelect: (id: string) => void;
};

type Props = Handlers & {
  house: AuctionHouse;
  text: Texts;
  glossary: Glossary;
  labelMode: LabelMode;
  activeId: string | null;
  /** Accessible name of a stop — its title, as the popover would show it. */
  stopLabel: (stop: Stop) => string;
  ariaLabel: string;
};

const PAD = 5;
/** What the form prints. */
const PRINTED = "fill-neutral-500 dark:fill-neutral-400";
/** Printed, but meant to be read: choices and equipment abbreviations. */
const PRINTED_STRONG = "fill-neutral-800 dark:fill-neutral-200";
/** What the inspector writes in. */
const INK = "fill-blue-700 dark:fill-sky-300";
const INK_STROKE = "stroke-blue-700 dark:stroke-sky-300";

/**
 * One auction house's sheet as a vector drawing. Everything is laid out from
 * the house's cell list, so the same component draws all ten forms.
 *
 * Two layers: the form itself, memoised because fitting ~60 labels is the only
 * real work here and none of it depends on the pointer, and a highlight layer
 * on top that is the only thing to re-render as the reader moves around.
 */
export default function SheetSvg({
  house,
  text,
  glossary,
  labelMode,
  activeId,
  stopLabel,
  ariaLabel,
  onEnter,
  onLeave,
  onSelect,
}: Props) {
  const active = houseStops(house).find((stop) => stop.id === activeId);

  return (
    <svg
      viewBox={`0 0 1000 ${house.height}`}
      role="group"
      aria-label={ariaLabel}
      // Leaving a box for the gap beside it must not blink the popover, so
      // hover is only dropped once the pointer is off the sheet altogether.
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") onLeave();
      }}
      className="block h-auto w-full select-none"
    >
      <rect
        width="1000"
        height={house.height}
        className="fill-neutral-100 dark:fill-neutral-950"
      />
      <SheetBase
        house={house}
        text={text}
        glossary={glossary}
        labelMode={labelMode}
        stopLabel={stopLabel}
        onEnter={onEnter}
        onLeave={onLeave}
        onSelect={onSelect}
      />
      {active && <Highlight house={house} stop={active} />}
    </svg>
  );
}

const SheetBase = memo(function SheetBase({
  house,
  text,
  glossary,
  labelMode,
  stopLabel,
  onEnter,
  onLeave,
  onSelect,
}: Omit<Props, "activeId" | "ariaLabel">) {
  const stops = houseStops(house);
  const byId = new Map(stops.map((stop) => [stop.id, stop]));
  // Only a stop's first box takes focus — a label and its value are one stop.
  const focusable = new Set<SheetCell>();
  for (const stop of stops) {
    if (stop.type === "field") focusable.add(stop.cells[0]);
  }
  const handlers = { onEnter, onLeave, onSelect };

  // A field printed as several differently-labelled boxes — IAA's strip of six
  // parts, each with its own heading — has one title between them, so
  // translating would print that title six times. Those keep their Japanese.
  const multiLabel = new Set<string>();
  for (const stop of stops) {
    if (stop.type !== "field") continue;
    const labels = new Set(
      stop.cells
        .filter((cell) => cell.kind !== "value" && cell.jp !== undefined)
        .map((cell) => cell.jp),
    );
    if (labels.size >= 3) multiLabel.add(stop.id);
  }

  return (
    <>
      {house.cells.map((cell, index) => {
        const stop = byId.get(cell.field);
        return (
          <StopGroup
            key={index}
            id={cell.field}
            label={
              stop && focusable.has(cell) ? stopLabel(stop) : undefined
            }
            {...handlers}
          >
            <Cell
              cell={cell}
              text={text}
              // Only handed over in translated mode, so `jp` stays untouched.
              glossary={labelMode === "local" ? glossary : undefined}
              printedMode={multiLabel.has(cell.field) ? "jp" : labelMode}
            />
          </StopGroup>
        );
      })}

      {stops.map((stop) => {
        if (stop.type !== "mark") return null;
        const at = markPosition(house, stop.mark);
        if (!at) return null;
        return (
          <StopGroup
            key={stop.id}
            id={stop.id}
            label={stopLabel(stop)}
            {...handlers}
          >
            {/* Generous target — the code itself is two glyphs wide. */}
            <circle cx={at.x} cy={at.y} r="17" fill="transparent" />
            <text
              x={at.x}
              y={at.y + 5.5}
              fontSize="16"
              fontWeight="700"
              textAnchor="middle"
              // A paper-coloured halo keeps the code legible over the outline.
              paintOrder="stroke"
              strokeWidth="4"
              strokeLinejoin="round"
              className={`${INK} stroke-neutral-100 dark:stroke-neutral-950`}
            >
              {stop.code}
            </text>
          </StopGroup>
        );
      })}
    </>
  );
});

/** Pointer, focus and keyboard wiring shared by boxes and damage marks. */
function StopGroup({
  id,
  label,
  onEnter,
  onLeave,
  onSelect,
  children,
}: Handlers & { id: string; label?: string; children: React.ReactNode }) {
  return (
    <g
      {...(label ? { tabIndex: 0, role: "button", "aria-label": label } : {})}
      className="cursor-pointer outline-none"
      // Touch fires no hover: a tap goes straight to `onSelect`. Reacting to
      // its synthetic enter would leave the box stuck "hovered" afterwards.
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") onEnter(id);
      }}
      onClick={() => onSelect(id)}
      // Keyboard focus reads as hover; a mouse click's focus must not, or the
      // box would stay lit after the pointer has moved on.
      onFocus={(event) => {
        if (event.currentTarget.matches(":focus-visible")) onEnter(id);
      }}
      onBlur={onLeave}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(id);
        }
      }}
    >
      {children}
    </g>
  );
}

function Highlight({ house, stop }: { house: AuctionHouse; stop: Stop }) {
  if (stop.type === "mark") {
    const at = markPosition(house, stop.mark);
    if (!at) return null;
    return (
      <circle
        cx={at.x}
        cy={at.y}
        r="17"
        strokeWidth="2.4"
        pointerEvents="none"
        className="fill-primary/15 stroke-primary"
      />
    );
  }
  return (
    <>
      {stop.cells.map((cell, index) => (
        <rect
          key={index}
          x={cell.x}
          y={cell.y}
          width={cell.w}
          height={cell.h}
          strokeWidth="2.4"
          pointerEvents="none"
          className="fill-primary/15 stroke-primary"
        />
      ))}
    </>
  );
}

// ── Cells ───────────────────────────────────────────────────────────────────

function labelOf(cell: SheetCell, mode: LabelMode, text: Texts): string {
  if (mode === "jp") return cell.jp ?? fieldMeta(cell.field).jp;
  const entry = text[cell.field];
  return entry.short ?? entry.title;
}

type Value =
  | { type: "lines"; lines: string[] }
  | { type: "options"; options: string[]; picked: number }
  | null;

/**
 * What goes in a box's value area. A house's own `sample` wins outright; then
 * printed choices; then the field's sample. With a glossary — translated mode —
 * every line and every choice is looked up in it, and whatever it does not know
 * stays in Japanese.
 */
function valueOf(cell: SheetCell, glossary: Glossary | undefined): Value {
  const meta = fieldMeta(cell.field);
  const say = (jp: string) => glossary?.[jp] ?? jp;
  const toLines = (sample: string | string[]): Value => {
    const lines = (Array.isArray(sample) ? sample : [sample]).filter(Boolean);
    return lines.length ? { type: "lines", lines: lines.map(say) } : null;
  };

  if (cell.sample !== undefined) return toLines(cell.sample);
  const options = cell.options ?? meta.options;
  if (options) {
    return {
      type: "options",
      picked: cell.picked ?? meta.picked ?? -1,
      options: options.map(say),
    };
  }
  return meta.sample === undefined ? null : toLines(meta.sample);
}

type Box = { x: number; y: number; w: number; h: number };

function Cell({
  cell,
  text,
  glossary,
  printedMode,
}: {
  cell: SheetCell;
  text: Texts;
  /** Set in translated mode: turns the values and choices into the locale. */
  glossary: Glossary | undefined;
  /** Language of the box's own label — see `multiLabel`. */
  printedMode: LabelMode;
}) {
  const kind = cell.kind ?? "field";
  const label = labelOf(cell, printedMode, text);

  if (kind === "diagram") {
    const car = carPlacement(cell);
    return (
      <>
        {/* No border — the real forms leave the outline unboxed. The rect is
            only there to be hovered. */}
        <rect {...rectProps(cell)} fill="transparent" />
        <CarDiagram x={car.x} y={car.y} scale={car.scale} />
      </>
    );
  }

  const frame = (
    <rect
      {...rectProps(cell)}
      strokeWidth="1.2"
      className="fill-white stroke-neutral-700 dark:fill-neutral-900 dark:stroke-neutral-500"
    />
  );

  if (kind === "label") {
    return (
      <>
        {frame}
        <LabelOnly box={cell} label={label} stack={printedMode === "jp"} />
      </>
    );
  }

  if (kind === "check") {
    const picked = (cell.picked ?? fieldMeta(cell.field).picked ?? -1) === 0;
    const fit = fitText(label, cell.w - 8, cell.h - 6, {
      max: 13,
      min: 6,
      lines: 2,
    });
    const width = Math.max(0, ...fit.lines.map((l) => textWidth(l, fit.size)));
    return (
      <>
        {frame}
        <Block
          fit={fit}
          box={cell}
          className={PRINTED_STRONG}
          fontWeight="600"
        />
        {picked && (
          <InkEllipse
            cx={cell.x + cell.w / 2}
            cy={cell.y + cell.h / 2}
            rx={Math.min(cell.w / 2 - 3, width / 2 + 7)}
            ry={Math.min(cell.h / 2 - 3, blockHeight(fit) / 2 + 5)}
          />
        )}
      </>
    );
  }

  const value = valueOf(cell, glossary);

  if (kind === "value") {
    return (
      <>
        {frame}
        <ValueArea value={value} box={inset(cell, 4, 3)} />
      </>
    );
  }

  if (kind === "note") {
    const head = fitText(label, cell.w - PAD * 2, 14, { max: 11, min: 6.5 });
    const top = cell.y + PAD + head.size + 8;
    return (
      <>
        {frame}
        <Block
          fit={head}
          box={{ x: cell.x + PAD, y: cell.y + PAD, w: 0, h: 0 }}
          align="start"
          className={PRINTED}
        />
        {value?.type === "lines" && (
          <Handwriting
            lines={value.lines}
            box={{
              x: cell.x + PAD + 6,
              y: top,
              w: cell.w - PAD * 2 - 12,
              h: cell.y + cell.h - top - PAD,
            }}
          />
        )}
      </>
    );
  }

  // `field`: the label and the value share the box. Squat boxes put them side
  // by side, everything else stacks the value under a top-left label.
  if (cell.h < 40 && value) {
    const head = fitText(label, cell.w * 0.46, cell.h - 6, {
      max: 10,
      min: 6,
      lines: cell.h >= 26 ? 2 : 1,
    });
    const used = Math.max(0, ...head.lines.map((l) => textWidth(l, head.size)));
    return (
      <>
        {frame}
        <Block
          fit={head}
          box={{ x: cell.x + PAD, y: cell.y, w: 0, h: cell.h }}
          align="start"
          className={PRINTED}
        />
        <ValueArea
          value={value}
          box={{
            x: cell.x + PAD + used + 4,
            y: cell.y + 3,
            w: cell.w - PAD * 2 - used - 4,
            h: cell.h - 6,
          }}
        />
      </>
    );
  }

  const head = fitText(label, cell.w - PAD * 2, value ? 24 : cell.h - PAD * 2, {
    max: 10.5,
    min: 6,
    lines: cell.w < 110 || !value ? 2 : 1,
  });
  const headHeight = blockHeight(head);
  return (
    <>
      {frame}
      <Block
        fit={head}
        box={{ x: cell.x + PAD, y: cell.y + PAD, w: 0, h: 0 }}
        align="start"
        className={PRINTED}
      />
      <ValueArea
        value={value}
        box={{
          x: cell.x + 4,
          y: cell.y + PAD + headHeight + 2,
          w: cell.w - 8,
          h: cell.h - PAD - headHeight - 5,
        }}
      />
    </>
  );
}

function rectProps(cell: SheetCell) {
  return { x: cell.x, y: cell.y, width: cell.w, height: cell.h };
}

function inset(box: Box, dx: number, dy: number): Box {
  return {
    x: box.x + dx,
    y: box.y + dy,
    w: box.w - dx * 2,
    h: box.h - dy * 2,
  };
}

function blockHeight(fit: Fit): number {
  if (!fit.lines.length) return 0;
  return (fit.lines.length - 1) * fit.lineHeight + fit.size;
}

/**
 * A fitted block of text. `align="start"` pins it to the box's left edge and —
 * when the box has no height — to its top; otherwise it is centred both ways.
 */
function Block({
  fit,
  box,
  align = "middle",
  className,
  fontWeight = "500",
}: {
  fit: Fit;
  box: Box;
  align?: "start" | "middle";
  className: string;
  fontWeight?: string;
}) {
  const x = align === "start" ? box.x : box.x + box.w / 2;
  const top = box.h ? box.y + (box.h - blockHeight(fit)) / 2 : box.y;
  return (
    <text
      x={x}
      // 0.86em ≈ the cap-to-baseline drop, so `top` is where the glyphs start.
      y={top + fit.size * 0.86}
      fontSize={fit.size}
      fontWeight={fontWeight}
      textAnchor={align}
      className={className}
    >
      {fit.lines.map((line, index) => (
        <tspan key={index} x={x} dy={index === 0 ? 0 : fit.lineHeight}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

/**
 * A box that holds nothing but its printed label. Tall, narrow strips — the
 * `外色` / `燃料` gutters down the side of a block — run the text vertically:
 * Japanese stacked glyph by glyph as printed, a translation turned on its side.
 */
function LabelOnly({
  box,
  label,
  stack,
}: {
  box: Box;
  label: string;
  stack: boolean;
}) {
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const strip = box.h > box.w * 1.5 && box.w < 64;

  if (strip && stack) {
    const glyphs = [...label.replace(/\s+/g, "")];
    const size = Math.min(11, box.w - 8, (box.h - 8) / glyphs.length);
    if (size >= 6) {
      const top = cy - (glyphs.length * size) / 2;
      return (
        <text
          fontSize={size}
          fontWeight="500"
          textAnchor="middle"
          className={PRINTED}
        >
          {glyphs.map((glyph, index) => (
            <tspan key={index} x={cx} y={top + (index + 0.86) * size}>
              {glyph}
            </tspan>
          ))}
        </text>
      );
    }
  }

  if (strip) {
    const fit = fitText(label, box.h - 8, box.w - 6, {
      max: 10,
      min: 6,
      lines: 2,
    });
    return (
      <g transform={`rotate(-90 ${cx} ${cy})`}>
        <Block
          fit={fit}
          box={{ x: cx, y: cy - blockHeight(fit) / 2, w: 0, h: 0 }}
          className={PRINTED}
        />
      </g>
    );
  }

  const fit = fitText(label, box.w - 8, box.h - 6, {
    max: 11,
    min: 6,
    lines: box.h >= 26 ? 2 : 1,
  });
  return <Block fit={fit} box={box} className={PRINTED} />;
}

function ValueArea({ value, box }: { value: Value; box: Box }) {
  if (!value || box.w < 8 || box.h < 6) return null;
  if (value.type === "options") {
    return <Options options={value.options} picked={value.picked} box={box} />;
  }
  if (value.lines.length > 1) {
    // A roomy box is a note without its own label — the label sits in the
    // strip beside it — so the writing starts at the top like any note.
    return box.h > 70 ? (
      <Handwriting lines={value.lines} box={inset(box, 8, 6)} />
    ) : (
      <Handwriting lines={value.lines} box={box} centred />
    );
  }
  const fit = fitText(value.lines[0], box.w, box.h, {
    max: Math.min(22, Math.floor(box.h * 1.6) / 2),
    min: 7,
    lines: box.h >= 30 ? 2 : 1,
  });
  return <Block fit={fit} box={box} className={INK} fontWeight="600" />;
}

/** Several lines of the inspector's writing, all at one size. */
function Handwriting({
  lines,
  box,
  centred = false,
}: {
  lines: string[];
  box: Box;
  centred?: boolean;
}) {
  const LEADING = 1.5;
  let size = Math.min(15, box.h / (lines.length * LEADING));
  while (
    size > 7 &&
    lines.some((line) => textWidth(line, size) > box.w)
  ) {
    size -= 0.5;
  }
  if (size < 5) return null;
  const visible = lines.slice(0, Math.max(1, Math.floor(box.h / (size * LEADING))));
  const fit: Fit = { size, lines: visible, lineHeight: size * LEADING };
  return centred ? (
    <Block fit={fit} box={box} className={INK} fontWeight="600" />
  ) : (
    <Block
      fit={fit}
      box={{ x: box.x, y: box.y, w: 0, h: 0 }}
      align="start"
      className={INK}
      fontWeight="600"
    />
  );
}

/**
 * Printed choices with one circled in ink — `2WD ・ 4WD`, `有 ・ 無`. They run
 * along the box, or down it when the box is taller than it is wide.
 */
function Options({
  options,
  picked,
  box,
}: {
  options: string[];
  picked: number;
  box: Box;
}) {
  const vertical = box.h > box.w * 1.15 && options.length > 1;
  const widest = (size: number) =>
    Math.max(...options.map((option) => textWidth(option, size)));

  let size = 15;
  if (vertical) {
    const row = () => size * 1.7;
    while (size > 5.5 && (widest(size) > box.w - 6 || row() * options.length > box.h)) {
      size -= 0.5;
    }
    const top = box.y + (box.h - row() * options.length) / 2;
    return (
      <>
        {options.map((option, index) => {
          const cy = top + row() * (index + 0.5);
          return (
            <Option
              key={index}
              text={option}
              size={size}
              cx={box.x + box.w / 2}
              cy={cy}
              picked={index === picked}
            />
          );
        })}
      </>
    );
  }

  // A long legend (MIRIVE's nine "sent later" items) is unreadable on one
  // line, so try one, two and three rows and keep whichever prints largest.
  const layout = (rows: number) => {
    const perRow = Math.ceil(options.length / rows);
    const lines = Array.from({ length: rows }, (_, row) =>
      options.slice(row * perRow, (row + 1) * perRow),
    ).filter((line) => line.length > 0);
    const width = (line: string[], at: number) =>
      line.reduce((sum, option) => sum + textWidth(option, at), 0) +
      at * 1.1 * (line.length - 1);
    let at = 15;
    while (
      at > 5 &&
      (lines.some((line) => width(line, at) > box.w - 6) ||
        lines.length * at * 1.6 > box.h)
    ) {
      at -= 0.5;
    }
    return { lines, at, width };
  };
  const best = [1, 2, 3]
    .filter((rows) => rows === 1 || options.length >= rows * 2 + 1)
    .map(layout)
    .reduce((a, b) => (b.at > a.at ? b : a));
  size = best.at;
  const rowHeight = size * 1.6;
  const top = box.y + (box.h - rowHeight * best.lines.length) / 2;

  let index = 0;
  return (
    <>
      {best.lines.map((line, row) => {
        let x = box.x + (box.w - best.width(line, size)) / 2;
        return line.map((option) => {
          const width = textWidth(option, size);
          const cx = x + width / 2;
          x += width + size * 1.1;
          const at = index++;
          return (
            <Option
              key={at}
              text={option}
              size={size}
              cx={cx}
              cy={top + rowHeight * (row + 0.5)}
              picked={at === picked}
            />
          );
        });
      })}
    </>
  );
}

function Option({
  text,
  size,
  cx,
  cy,
  picked,
}: {
  text: string;
  size: number;
  cx: number;
  cy: number;
  picked: boolean;
}) {
  return (
    <>
      <text
        x={cx}
        y={cy + size * 0.36}
        fontSize={size}
        fontWeight="600"
        textAnchor="middle"
        className={PRINTED_STRONG}
      >
        {text}
      </text>
      {picked && (
        <InkEllipse
          cx={cx}
          cy={cy}
          rx={textWidth(text, size) / 2 + size * 0.4}
          ry={size * 0.8}
        />
      )}
    </>
  );
}

/** The inspector's pen circling a printed choice — tilted, so it reads as drawn. */
function InkEllipse({
  cx,
  cy,
  rx,
  ry,
}: {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}) {
  if (rx <= 0 || ry <= 0) return null;
  return (
    <ellipse
      cx={cx}
      cy={cy}
      rx={rx}
      ry={ry}
      fill="none"
      strokeWidth="1.5"
      transform={`rotate(-8 ${cx} ${cy})`}
      className={INK_STROKE}
    />
  );
}
