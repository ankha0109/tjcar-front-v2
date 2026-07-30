"use client";

import { useState } from "react";
import { ConfigProvider, Drawer, Segmented } from "antd";
import { SEGMENTED_THEME } from "./segmentedTheme";
import { cn } from "@/utils";

export type ScheduleDayOption = {
  key: string; // "YYYY-MM-DD"
  date: string; // "07/29"
  subLabel?: string; // relative label — only ever set for tomorrow
  count?: number;
};

// Date rail: a caption plus one antd Segmented holding "all" and the upcoming
// days. Shares `SEGMENTED_THEME` with ViewModeSwitcher so the two controls
// standing next to each other read as one system.
export function ScheduleDaySegmented({
  label,
  selected,
  onSelect,
  allLabel,
  allCount,
  allUnit,
  days,
}: {
  label: string;
  selected: string; // "all" | "YYYY-MM-DD"
  onSelect: (key: string) => void;
  allLabel: string;
  allCount?: number;
  allUnit?: string;
  days: ScheduleDayOption[];
}) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="shrink-0 text-[12px] font-medium text-neutral-500">
        {label}
      </span>
      {/* The Segmented keeps its natural width and scrolls instead of
          wrapping — the thumb is positioned from offsetLeft, so a wrapped
          track would leave it stranded on the first row. */}
      <div className="min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ConfigProvider theme={SEGMENTED_THEME}>
          <Segmented<string>
            size="large"
            value={selected}
            onChange={onSelect}
            className="border border-neutral-200/80"
            classNames={{ label: "flex items-center justify-center px-2.5" }}
            options={[
              {
                value: "all",
                tooltip:
                  allCount != null && allUnit
                    ? `${allCount} ${allUnit}`
                    : undefined,
                label: (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="text-[12.5px]/none font-bold">
                      {allLabel}
                    </span>
                    {allCount != null && (
                      <CountBadge
                        value={allCount}
                        isActive={selected === "all"}
                      />
                    )}
                  </span>
                ),
              },
              ...days.map((d) => ({
                value: d.key,
                label: <DayLabel day={d} isActive={selected === d.key} />,
              })),
            ]}
          />
        </ConfigProvider>
      </div>
    </div>
  );
}

// Only tomorrow gets a sub-label, and it sits on the same baseline as the date
// instead of stacking above it — one tall tile in a row of short ones would
// drop its own date below the line every other tile shares.
function DayLabel({
  day,
  isActive,
}: {
  day: ScheduleDayOption;
  isActive: boolean;
}) {
  const isEmpty = day.count === 0;
  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-1.5",
        !isActive && isEmpty && "opacity-45",
      )}
    >
      {day.subLabel && (
        <span
          className={cn(
            "whitespace-nowrap text-[9px]/none font-semibold uppercase",
            isActive ? "opacity-65" : "text-neutral-400",
          )}
        >
          {day.subLabel}
        </span>
      )}
      <span className="text-[12.5px]/none font-bold">{day.date}</span>
      {day.count != null && !isEmpty && (
        <CountBadge value={day.count} isActive={isActive} />
      )}
    </span>
  );
}

function CountBadge({ value, isActive }: { value: number; isActive: boolean }) {
  return (
    <span
      className={cn(
        "rounded-full px-1 text-[9px]/3.5 font-semibold",
        isActive ? "bg-white/20 text-current" : "bg-primary/10 text-primary",
      )}
    >
      {value}
    </span>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/40 py-16">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-neutral-200">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-neutral-400"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </div>
      <p className="mt-3 text-[14px] font-medium text-neutral-700">{title}</p>
      <p className="mt-1 text-[12.5px] text-neutral-500">{description}</p>
    </div>
  );
}

// Mobile replacement for ScheduleDaySegmented: a rail-styled trigger that opens
// a bottom drawer of day options. Parents gate it behind `sm:hidden`; the
// component itself has no breakpoint knowledge.
export function ScheduleDayDrawer({
  selected,
  onSelect,
  allLabel,
  allCount,
  days,
  title,
  emptyLabel,
}: {
  selected: string; // "all" | "YYYY-MM-DD"
  onSelect: (key: string) => void;
  allLabel: string;
  allCount?: number;
  days: ScheduleDayOption[];
  title: string;
  emptyLabel?: string;
}) {
  const [open, setOpen] = useState(false);

  const activeDay = days.find((d) => d.key === selected);
  const triggerLabel =
    selected === "all"
      ? allLabel
      : activeDay
        ? activeDay.subLabel
          ? `${activeDay.subLabel} · ${activeDay.date}`
          : activeDay.date
        : selected;

  const pick = (key: string) => {
    onSelect(key);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-2xl border border-neutral-200/80 bg-neutral-50/70 px-3.5 text-[12.5px] font-bold text-neutral-800 transition-colors hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-100 dark:hover:bg-neutral-800"
      >
        <span className="truncate">{triggerLabel}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0 text-neutral-400"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        placement="bottom"
        size="auto"
        title={title}
        styles={{
          header: { padding: "16px 20px", borderBottom: "1px solid #f5f5f5" },
          body: { padding: "8px 8px 16px" },
          section: { borderTopLeftRadius: 16, borderTopRightRadius: 16 },
        }}
      >
        <div role="listbox" aria-label={title} className="flex flex-col">
          <DrawerRow
            isActive={selected === "all"}
            onClick={() => pick("all")}
            label={allLabel}
            count={allCount}
            emptyLabel={emptyLabel}
          />
          {days.map((d) => (
            <DrawerRow
              key={d.key}
              isActive={selected === d.key}
              onClick={() => pick(d.key)}
              label={d.date}
              topLabel={d.subLabel}
              count={d.count}
              emptyLabel={emptyLabel}
            />
          ))}
        </div>
      </Drawer>
    </>
  );
}

function DrawerRow({
  isActive,
  onClick,
  label,
  topLabel,
  count,
  emptyLabel,
}: {
  isActive: boolean;
  onClick: () => void;
  label: string;
  topLabel?: string;
  count?: number;
  emptyLabel?: string;
}) {
  const isEmpty = count === 0;
  return (
    <button
      type="button"
      role="option"
      aria-selected={isActive}
      onClick={onClick}
      className={cn(
        "flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-colors",
        isActive
          ? "bg-neutral-100 dark:bg-neutral-800"
          : "hover:bg-neutral-50 dark:hover:bg-neutral-800/60",
        !isActive && isEmpty && "opacity-50",
      )}
    >
      <span
        className={cn(
          "inline-flex h-4 w-4 shrink-0 items-center justify-center text-neutral-900 dark:text-neutral-100",
          !isActive && "invisible",
        )}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>
      <span className="flex min-w-0 flex-1 items-baseline gap-1.5">
        {topLabel && (
          <span className="shrink-0 text-[10px] font-semibold uppercase text-neutral-400 dark:text-neutral-500">
            {topLabel}
          </span>
        )}
        <span className="truncate text-[13.5px] font-semibold text-neutral-900 dark:text-neutral-100">
          {label}
        </span>
      </span>
      {count != null && !isEmpty && (
        <span className="rounded-full bg-primary/10 px-1.5 text-[10.5px] font-semibold leading-4.5 text-primary">
          {count}
        </span>
      )}
      {isEmpty && emptyLabel && (
        <span className="text-[10.5px] font-medium text-neutral-400">
          {emptyLabel}
        </span>
      )}
    </button>
  );
}
