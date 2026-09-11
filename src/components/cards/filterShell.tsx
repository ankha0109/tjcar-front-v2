"use client";

import { Children, useRef, useState } from "react";
import { Button, DatePicker, Input } from "antd";
import { useTranslations } from "next-intl";
import dayjs from "dayjs";
import BottomSheet from "@/components/ui/BottomSheet";
import { cn } from "@/utils";

/**
 * Presentation shell for a browser's filter sidebar, extracted from
 * `JapanAuctionFilters` so every market (Japan, Korea, …) shares one layout:
 *
 * - below `lg`: a horizontally scrolling pill row, one pill per field, each
 *   opening a bottom drawer with that field's mobile control;
 * - at `lg`+: a sticky sidebar listing every field's desktop control.
 *
 * It knows nothing about any market's filter shape — a caller hands it a
 * `FieldDef[]` (label, active state, summary, desktop control, mobile control,
 * clear) and keeps its own state. Labels come from `featured.filters`.
 */

export type RangeOpt = { value: number; label: string };

type RangeCol = {
  options: RangeOpt[];
  value: number | null;
  onChange: (v: number | null) => void;
  placeholder: string;
};

/** How a field is edited inside the mobile drawer. */
export type MobileControl =
  | {
      type: "single";
      options: { value: string; label: React.ReactNode; searchText: string }[];
      value: string | null;
      onSelect: (v: string | null) => void;
    }
  // A range may be one-sided (Korea's mileage only has a max) — the missing
  // side is simply not rendered.
  | { type: "range"; from?: RangeCol; to?: RangeCol }
  | {
      type: "date";
      value: string | null;
      onChange: (v: string | null) => void;
      placeholder: string;
    }
  | {
      type: "text";
      value: string;
      onChange: (v: string) => void;
      placeholder: string;
    };

// One flat list — no collapse, no group headings. Array order is the panel
// order AND the mobile pill order, so the fields buyers filter by first lead.
export type FieldDef = {
  key: string;
  label: string;
  active: boolean;
  summary: string | null;
  control: React.ReactNode;
  mobile: MobileControl;
  clear: () => void;
};

/**
 * How tall each control wants its sheet, and who owns the scrolling.
 *
 * Anything with a list takes a fixed share of the screen rather than its content
 * height: filtering a thousand marks down to two rows must not collapse the
 * sheet onto the keyboard. A range's columns scroll independently, so the sheet
 * body must not scroll them together. Only a lone text input is short enough to
 * size itself — the date field needs room for its calendar, which opens inside
 * the sheet.
 */
const sheetShape = (
  m: MobileControl,
): { snap: "auto" | number; scrollable: boolean } => {
  switch (m.type) {
    case "single":
      return { snap: 0.6, scrollable: true };
    case "range":
      return { snap: 0.6, scrollable: false };
    case "date":
      return { snap: 0.6, scrollable: true };
    case "text":
      return { snap: "auto", scrollable: true };
  }
};

/** Short "from–to" label for range pills and chips ("…" for an open bound). */
export const rangeSummary = (
  from: number | null,
  to: number | null,
  fmt: (n: number) => string,
): string | null => {
  if (from == null && to == null) return null;
  return `${from != null ? fmt(from) : "…"}–${to != null ? fmt(to) : "…"}`;
};

export function FilterIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

export function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function ChevronIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CloseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export default function FilterShell({
  fields,
  hasFilters,
  onClearAll,
}: {
  fields: FieldDef[];
  hasFilters: boolean;
  /** Reset every filter. Owned by the caller — each market keeps its own
   *  "sticky" values (Japan keeps the auction date). */
  onClearAll: () => void;
}) {
  const t = useTranslations("featured.filters");
  const [openField, setOpenField] = useState<string | null>(null);
  const sheetBodyRef = useRef<HTMLDivElement>(null);

  // One per field with anything set — a from–to range counts once, matching the
  // chip row rather than the raw number of bounds.
  const totalCount = fields.filter((f) => f.active).length;
  const activeField = fields.find((f) => f.key === openField) ?? null;
  const shape = activeField
    ? sheetShape(activeField.mobile)
    : { snap: 0.6, scrollable: true };

  const renderMobileControl = (m: MobileControl) => {
    switch (m.type) {
      case "single":
        return (
          <OptionList
            options={m.options}
            selected={m.value}
            searchPlaceholder={t("search")}
            emptyLabel={t("noResults")}
            onSelect={(v) => {
              m.onSelect(v);
              setOpenField(null);
            }}
          />
        );
      case "range":
        return <RangeColumns from={m.from} to={m.to} />;
      case "date":
        return (
          <div className="pt-1">
            <DatePicker
              placeholder={m.placeholder}
              allowClear
              inputReadOnly
              value={m.value ? dayjs(m.value) : null}
              onChange={(d) => {
                m.onChange(d ? d.format("YYYY-MM-DD") : null);
                if (d) setOpenField(null);
              }}
              variant="filled"
              format="YYYY-MM-DD"
              style={{ width: "100%" }}
              getPopupContainer={() => sheetBodyRef.current ?? document.body}
            />
          </div>
        );
      case "text":
        return (
          <div className="pt-1">
            <Input
              placeholder={m.placeholder}
              allowClear
              prefix={<SearchIcon className="h-3.5 w-3.5 text-neutral-400" />}
              value={m.value}
              onChange={(e) => m.onChange(e.target.value)}
              variant="filled"
            />
          </div>
        );
    }
  };

  return (
    <>
      {/* Mobile pill row — visible below lg */}
      <div className="mb-3 lg:hidden">
        <div className="-mx-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex items-center gap-2">
            {fields.map((f) => (
              <FilterPill
                key={f.key}
                label={f.label}
                summary={f.summary}
                active={f.active}
                clearLabel={t("clear")}
                onOpen={() => setOpenField(f.key)}
                onClear={f.clear}
              />
            ))}
            {hasFilters && (
              <Button
                type="text"
                onClick={onClearAll}
                className="!shrink-0 !text-neutral-500"
              >
                {t("clear")}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Desktop sidebar — visible at lg+ */}
      <aside className="tj-filters hidden lg:sticky lg:top-[calc(var(--header-h)+1rem)] lg:block lg:w-[280px] lg:shrink-0 lg:self-start">
        <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900">
                <FilterIcon className="h-3.5 w-3.5" />
              </span>
              <span className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
                {t("title")}
              </span>
              {totalCount > 0 && (
                <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">
                  {totalCount}
                </span>
              )}
            </div>
            <Button
              type="text"
              onClick={onClearAll}
              disabled={!hasFilters}
              className="h-auto! p-0! border-0! bg-transparent! text-[11px]! font-medium! text-neutral-500! hover:text-neutral-900! hover:bg-transparent! disabled:cursor-not-allowed! disabled:text-neutral-300! disabled:hover:text-neutral-300! dark:text-neutral-400! dark:hover:text-neutral-100! dark:disabled:text-neutral-600! dark:disabled:hover:text-neutral-600!"
            >
              {t("clear")}
            </Button>
          </div>
          <div className="max-h-[calc(100dvh-var(--header-h)-8rem)] overflow-y-auto px-4">
            <div className="space-y-3 py-4">
              {fields.map((f) => (
                <Field key={f.key} label={f.label}>
                  {f.control}
                </Field>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile per-field bottom sheet — drag the grabber to resize. */}
      <BottomSheet
        open={activeField != null}
        onClose={() => setOpenField(null)}
        title={activeField?.label}
        closeLabel={t("close")}
        className="tj-filters"
        snap={shape.snap}
        scrollable={shape.scrollable}
        footer={
          activeField ? (
            <div className="flex items-center justify-between gap-2">
              <Button
                type="text"
                onClick={() => {
                  activeField.clear();
                  if (
                    activeField.mobile.type !== "range" &&
                    activeField.mobile.type !== "text"
                  )
                    setOpenField(null);
                }}
                disabled={!activeField.active}
                className="!text-neutral-500"
              >
                {t("clear")}
              </Button>
              {(activeField.mobile.type === "range" ||
                activeField.mobile.type === "text") && (
                <Button type="primary" onClick={() => setOpenField(null)}>
                  {t("search")}
                </Button>
              )}
            </div>
          ) : null
        }
      >
        {/* `h-full` when the content owns its scrollers, `min-h-full` when the
            sheet body does — so an empty list still fills the sheet. */}
        <div
          ref={sheetBodyRef}
          className={cn("relative", shape.scrollable ? "min-h-full" : "h-full")}
        >
          {activeField && renderMobileControl(activeField.mobile)}
        </div>
      </BottomSheet>
    </>
  );
}

function FilterPill({
  label,
  summary,
  active,
  clearLabel,
  onOpen,
  onClear,
}: {
  label: string;
  summary: string | null;
  active: boolean;
  clearLabel: string;
  onOpen: () => void;
  onClear: () => void;
}) {
  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-[13px] transition-colors",
        active
          ? "border-primary/30 bg-primary/10 text-primary"
          : "border-neutral-200 bg-white text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200",
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        className="inline-flex items-center gap-1"
      >
        <span className="whitespace-nowrap font-medium">
          {active && summary ? `${label}: ${summary}` : label}
        </span>
        {!active && <ChevronIcon className="h-3 w-3 opacity-60" />}
      </button>
      {active && (
        <button
          type="button"
          aria-label={clearLabel}
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-primary/70 hover:bg-primary/20 hover:text-primary"
        >
          <CloseIcon className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

function OptionList({
  options,
  selected,
  onSelect,
  searchPlaceholder,
  emptyLabel,
  searchThreshold = 8,
}: {
  options: { value: string; label: React.ReactNode; searchText: string }[];
  selected: string | null;
  onSelect: (value: string) => void;
  searchPlaceholder: string;
  emptyLabel: string;
  searchThreshold?: number;
}) {
  const [query, setQuery] = useState("");
  const showSearch = options.length > searchThreshold;
  const filtered =
    showSearch && query
      ? options.filter((o) =>
          o.searchText.toLowerCase().includes(query.toLowerCase()),
        )
      : options;
  // The sheet owns the height now, so the list has no cap of its own — it just
  // fills whatever the user dragged the sheet to.
  return (
    <div className="flex min-h-full flex-col">
      {showSearch && (
        // Pinned to the top of the sheet body: the box the keyboard is serving
        // must not scroll away under the user's own typing.
        <div className="sticky top-0 z-10 -mx-1 bg-white px-1 pb-2 pt-1 dark:bg-neutral-900">
          <Input
            placeholder={searchPlaceholder}
            allowClear
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            prefix={<SearchIcon className="h-3.5 w-3.5 text-neutral-400" />}
            variant="filled"
          />
        </div>
      )}
      <div className="-mx-1 flex flex-1 flex-col">
        {filtered.length === 0 ? (
          <div className="flex flex-1 items-center justify-center px-3 py-10 text-center text-[13px] text-neutral-400">
            {emptyLabel}
          </div>
        ) : (
          filtered.map((o, i) => {
            const active = o.value === selected;
            return (
              <button
                key={`${o.value}::${i}`}
                type="button"
                onClick={() => onSelect(o.value)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-[14px] transition-colors",
                  active
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-neutral-700 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-800",
                )}
              >
                <span className="min-w-0 flex-1 truncate">{o.label}</span>
                {active && <CheckIcon className="h-4 w-4 shrink-0" />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function RangeColumns({ from, to }: { from?: RangeCol; to?: RangeCol }) {
  const cols = [from, to].filter((c): c is RangeCol => !!c);
  // Each column scrolls on its own and together they fill the sheet, so dragging
  // the sheet taller makes both lists longer.
  return (
    <div
      className={cn(
        "grid h-full gap-3 pt-1",
        cols.length > 1 ? "grid-cols-2" : "grid-cols-1",
      )}
    >
      {cols.map((col) => (
        <div key={col.placeholder} className="flex min-h-0 min-w-0 flex-col">
          <div className="mb-1.5 shrink-0 text-[11px] font-semibold uppercase text-neutral-500">
            {col.placeholder}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-lg border border-neutral-100 dark:border-neutral-800">
            {col.options.length === 0 ? (
              <div className="px-3 py-6 text-center text-[13px] text-neutral-400">
                -
              </div>
            ) : (
              col.options.map((o, i) => {
                const active = o.value === col.value;
                return (
                  <button
                    key={`${o.value}::${i}`}
                    type="button"
                    onClick={() => col.onChange(active ? null : o.value)}
                    className={cn(
                      "flex w-full items-center justify-between gap-1 px-3 py-2 text-left text-[13px] transition-colors",
                      active
                        ? "bg-primary/10 font-medium text-primary"
                        : "text-neutral-700 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-800",
                    )}
                  >
                    <span className="truncate">{o.label}</span>
                    {active && <CheckIcon className="h-3.5 w-3.5 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* Two controls of a from–to pair. A real gap (not `Space.Compact`) keeps the
   two filled boxes readable as separate inputs. */
export function RangePair({ children }: { children: React.ReactNode }) {
  const [from, to] = Children.toArray(children);
  return (
    <div className="flex items-center gap-2">
      <div className="min-w-0 flex-1">{from}</div>
      <span
        aria-hidden
        className="shrink-0 text-neutral-400 dark:text-neutral-500"
      >
        –
      </span>
      <div className="min-w-0 flex-1">{to}</div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1 text-[13px] font-normal text-neutral-600 dark:text-neutral-400">
        {label}
      </div>
      {children}
    </div>
  );
}
