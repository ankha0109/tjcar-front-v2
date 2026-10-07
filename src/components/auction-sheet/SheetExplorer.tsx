"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  HOUSES,
  getHouse,
  houseStops,
  markPosition,
  type AuctionHouse,
  type FieldKey,
  type HouseId,
  type Stop,
} from "@/lib/auctionSheet";
import { fieldMeta } from "@/lib/auctionSheet/fields";
import type { FieldText } from "@/lib/auctionSheet/types";
import type { Device } from "@/lib/device";
import { cn } from "@/utils";
import FieldRail from "./FieldRail";
import SheetPopover, {
  Stepper,
  StopSummary,
  type StopInfo,
} from "./SheetPopover";
import SheetSvg, { type LabelMode } from "./SheetSvg";

type Props = {
  /** The house `?auction=` asked for, already resolved on the server. */
  initialHouse: HouseId;
  /** The field dictionary in the page locale. */
  text: Record<FieldKey, FieldText>;
  /** Translations of what is written on the sheets, for translated labels. */
  glossary: Record<string, string>;
  /** Which shell is on screen — only the phone's header slides away. */
  device: Device;
};

type Box = { x: number; y: number; w: number; h: number };

/**
 * Where a stop is on the sheet. A label and its value box are neighbours, so
 * their union is the natural anchor; a field printed in two far-apart places
 * would give a union covering half the form, so that falls back to its first
 * box.
 */
function stopBox(house: AuctionHouse, stop: Stop): Box {
  if (stop.type === "mark") {
    const at = markPosition(house, stop.mark) ?? { x: 0, y: 0 };
    return { x: at.x - 17, y: at.y - 17, w: 34, h: 34 };
  }
  const [first, ...rest] = stop.cells;
  let x0 = first.x;
  let y0 = first.y;
  let x1 = first.x + first.w;
  let y1 = first.y + first.h;
  let area = first.w * first.h;
  for (const cell of rest) {
    x0 = Math.min(x0, cell.x);
    y0 = Math.min(y0, cell.y);
    x1 = Math.max(x1, cell.x + cell.w);
    y1 = Math.max(y1, cell.y + cell.h);
    area += cell.w * cell.h;
  }
  const union = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  return union.w * union.h <= area * 2.5
    ? union
    : { x: first.x, y: first.y, w: first.w, h: first.h };
}

/**
 * The interactive half of the guide: pick an auction house, see its sheet, and
 * point at any box to learn what it says.
 *
 * `hovered` is the pointer (or keyboard focus); `pinned` is a click or a tap
 * and survives the pointer leaving. Whatever is hovered wins, so a pinned card
 * never stops the reader from glancing at a neighbour.
 */
export default function SheetExplorer({
  initialHouse,
  text,
  glossary,
  device,
}: Props) {
  const t = useTranslations("auctionSheet.explorer");
  const tMarks = useTranslations("carDetail.evaluationGuide.marks");

  const [houseId, setHouseId] = useState<HouseId>(initialHouse);
  const [labelMode, setLabelMode] = useState<LabelMode>("jp");
  const [zoomed, setZoomed] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  // Bumped whenever the pinned stop should be scrolled to — a counter, because
  // re-revealing the stop that is already pinned changes no other state.
  const [reveal, setReveal] = useState(0);
  const anchorRef = useRef<HTMLSpanElement>(null);

  const house = getHouse(houseId);
  const stops = houseStops(house);

  const infos = useMemo(() => {
    const map = new Map<string, StopInfo>();
    for (const stop of houseStops(getHouse(houseId))) {
      if (stop.type === "mark") {
        map.set(stop.id, {
          code: stop.code,
          title: tMarks(`${stop.code}.title`),
          description: tMarks(`${stop.code}.description`),
        });
      } else {
        const entry = text[stop.field];
        // The printed label of whichever box actually carries one.
        const printed = stop.cells.find((cell) => cell.kind !== "value");
        map.set(stop.id, {
          title: entry.title,
          description: entry.description,
          jp: printed?.jp ?? fieldMeta(stop.field).jp,
        });
      }
    }
    return map;
  }, [houseId, text, tMarks]);

  const activeId = hovered ?? pinned;
  const active = stops.find((stop) => stop.id === activeId) ?? null;
  const activeInfo = active ? infos.get(active.id) : undefined;
  const activeBox = active ? stopBox(house, active) : null;
  const position = active ? stops.indexOf(active) + 1 : 0;

  const enter = useCallback((id: string) => setHovered(id), []);
  const leave = useCallback(() => setHovered(null), []);
  const select = useCallback((id: string) => {
    setPinned((current) => (current === id ? null : id));
  }, []);
  const revealStop = useCallback((id: string) => {
    setPinned(id);
    setHovered(null);
    setReveal((tick) => tick + 1);
  }, []);
  const stopLabel = useCallback(
    (stop: Stop) => infos.get(stop.id)?.title ?? stop.id,
    [infos],
  );

  const step = (delta: number) => {
    const from = stops.findIndex((stop) => stop.id === (pinned ?? hovered));
    const start = from === -1 ? (delta > 0 ? -1 : 0) : from;
    const next = stops[(start + delta + stops.length) % stops.length];
    if (next) revealStop(next.id);
  };
  const close = () => {
    setPinned(null);
    setHovered(null);
  };

  const pickHouse = (id: HouseId) => {
    if (id === houseId) return;
    setHouseId(id);
    close();
    // Rewrites the query without a navigation: the tab is shareable, and the
    // page does not jump back to the top the way a route change would.
    const url = new URL(window.location.href);
    url.searchParams.set("auction", id);
    window.history.replaceState(null, "", url);
  };

  useEffect(() => {
    if (reveal === 0) return;
    anchorRef.current?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: "smooth",
    });
  }, [reveal]);

  const stepper = {
    prev: t("prev"),
    next: t("next"),
    close: t("close"),
    counter: t("counter", { index: position || "–", total: stops.length }),
  };

  // Rendered twice — beside the label toggle on wide screens, in the sticky bar
  // below `lg` — and only ever visible in one of them.
  const zoomButton = (
    <button
      type="button"
      aria-pressed={zoomed}
      onClick={() => setZoomed((value) => !value)}
      className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-1.5 text-[12px] font-medium text-neutral-600 transition hover:bg-neutral-50 hover:text-neutral-900 pointer-coarse:h-10 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
    >
      <ZoomIcon out={zoomed} />
      {zoomed ? t("zoomOut") : t("zoomIn")}
    </button>
  );

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-6 lg:py-12">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h2 className="text-[17px] font-semibold text-neutral-900 lg:text-[20px] dark:text-neutral-100">
            {t("pickAuction")}
          </h2>
          <p className="mt-1 text-[13px] text-neutral-500 dark:text-neutral-400">
            {t(`houses.${house.id}`)}
          </p>
        </div>

        {/* Below `lg` the label toggle is dropped and zoom moves into the bar
            beside the stepper, where the thumb already is. */}
        <div className="hidden flex-wrap items-center gap-2 lg:flex">
          <div
            role="group"
            aria-label={t("labels")}
            className="inline-flex rounded-full border border-neutral-200 p-0.5 dark:border-neutral-700"
          >
            {(["jp", "local"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                aria-pressed={labelMode === mode}
                onClick={() => setLabelMode(mode)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[12px] font-medium transition",
                  labelMode === mode
                    ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                    : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white",
                )}
              >
                {mode === "jp" ? t("labelsJp") : t("labelsLocal")}
              </button>
            ))}
          </div>
          {zoomButton}
        </div>
      </div>

      {/* Bleeds to the screen edge on phones so the row can scroll under it. */}
      <div
        role="tablist"
        aria-label={t("pickAuction")}
        className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0"
      >
        {HOUSES.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={entry.id === houseId}
            onClick={() => pickHouse(entry.id)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-[13px] font-semibold transition",
              entry.id === houseId
                ? "border-primary bg-primary text-white"
                : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800",
            )}
          >
            {entry.name}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="min-w-0">
          {/*
            Below `lg` the explanation lives in this bar rather than in a
            popover: it stays put under the header while the sheet scrolls, so
            the stepper is always under the same thumb. Its height is fixed —
            explanations differ in length, and a bar that grew would shove the
            sheet up and down with every step.
          */}
          <div
            className={cn(
              "sticky top-(--header-h) z-20 -mx-4 mb-3 border-b border-neutral-200 bg-white/95 px-4 py-2.5 backdrop-blur lg:hidden dark:border-neutral-800 dark:bg-neutral-950/95",
              device === "mobile" &&
                "transition-[top] duration-300 ease-out scroll-down:top-0 motion-reduce:transition-none",
            )}
          >
            <div className="h-22 overflow-y-auto" aria-live="polite">
              {activeInfo ? (
                <StopSummary info={activeInfo} />
              ) : (
                <>
                  <p className="text-[14px] font-semibold text-neutral-900 dark:text-neutral-100">
                    {t("hintTitle")}
                  </p>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-400">
                    {t("hintTouch")}
                  </p>
                </>
              )}
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              {zoomButton}
              <Stepper
                labels={stepper}
                onPrev={() => step(-1)}
                onNext={() => step(1)}
              />
            </div>
          </div>

          <p className="mb-2 hidden text-[13px] text-neutral-500 lg:block dark:text-neutral-400">
            {t("hintMouse")}
          </p>

          <div
            role="tabpanel"
            className={cn(
              "rounded-2xl border border-neutral-200 dark:border-neutral-800",
              zoomed && "overflow-x-auto overscroll-x-contain",
            )}
          >
            <div
              className={cn(
                "relative",
                zoomed ? "w-[240%] lg:w-[170%]" : "w-full",
              )}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight") step(1);
                else if (event.key === "ArrowLeft") step(-1);
                else if (event.key === "Escape") close();
              }}
            >
              <div className="overflow-hidden rounded-[15px]">
                <SheetSvg
                  house={house}
                  text={text}
                  glossary={glossary}
                  labelMode={labelMode}
                  activeId={activeId}
                  stopLabel={stopLabel}
                  ariaLabel={t("sheetAria", { house: house.name })}
                  onEnter={enter}
                  onLeave={leave}
                  onSelect={select}
                />
              </div>

              {/* What "bring it into view" scrolls to. The margins keep the
                  box clear of the header and the bar above, and leave room
                  for the popover beside it. */}
              {activeBox && (
                <span
                  ref={anchorRef}
                  aria-hidden
                  className="pointer-events-none absolute scroll-mt-[calc(var(--header-h)+11rem)] scroll-mb-48"
                  style={{
                    left: `${activeBox.x / 10}%`,
                    top: `${(activeBox.y / house.height) * 100}%`,
                    width: `${activeBox.w / 10}%`,
                    height: `${(activeBox.h / house.height) * 100}%`,
                  }}
                />
              )}

              {activeInfo && activeBox && (
                <div className="hidden lg:block">
                  <SheetPopover
                    info={activeInfo}
                    box={activeBox}
                    sheetHeight={house.height}
                    pinned={pinned === activeId}
                    labels={stepper}
                    onPrev={() => step(-1)}
                    onNext={() => step(1)}
                    onClose={close}
                  />
                </div>
              )}
            </div>
          </div>

          <p className="mt-3 text-[12px] leading-relaxed text-neutral-500 dark:text-neutral-400">
            {t("typicalNote")}
          </p>
        </div>

        <FieldRail
          stops={stops}
          infos={infos}
          activeId={activeId}
          heading={t("fieldsHeading")}
          count={t("fieldsCount", { count: stops.length })}
          groupLabel={(group) => t(`groups.${group}`)}
          onEnter={enter}
          onLeave={leave}
          onReveal={revealStop}
        />
      </div>
    </section>
  );
}

function ZoomIcon({ out }: { out: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5M8 11h6" />
      {!out && <path d="M11 8v6" />}
    </svg>
  );
}
