"use client";

import { useEffect, useRef } from "react";
import type { Stop } from "@/lib/auctionSheet";
import {
  FIELD_GROUPS,
  fieldMeta,
  type FieldGroup,
} from "@/lib/auctionSheet/fields";
import { cn } from "@/utils";
import type { StopInfo } from "./SheetPopover";

type Props = {
  stops: Stop[];
  infos: Map<string, StopInfo>;
  activeId: string | null;
  heading: string;
  count: string;
  groupLabel: (group: FieldGroup) => string;
  onEnter: (id: string) => void;
  onLeave: () => void;
  /** A row was chosen — pin it and bring its box into view. */
  onReveal: (id: string) => void;
};

/**
 * Every box on the current sheet as a list, grouped the way a buyer reads one.
 * It mirrors the drawing — pointing at a row lights its box and the other way
 * round — and it is also the page's indexable content: each title and
 * explanation is in the HTML here, where a tooltip's text never is.
 */
export default function FieldRail({
  stops,
  infos,
  activeId,
  heading,
  count,
  groupLabel,
  onEnter,
  onLeave,
  onReveal,
}: Props) {
  const railRef = useRef<HTMLElement>(null);
  const rows = useRef(new Map<string, HTMLLIElement>());
  /** True while the pointer is on the rail — its own hovers must not scroll it. */
  const inside = useRef(false);

  // Follow the sheet: keep the active row inside the rail's own scroller. Done
  // by hand because `scrollIntoView` would drag the whole page along with it.
  useEffect(() => {
    const rail = railRef.current;
    const row = activeId ? rows.current.get(activeId) : undefined;
    if (!rail || !row || inside.current) return;
    if (rail.scrollHeight <= rail.clientHeight) return;
    const box = rail.getBoundingClientRect();
    const at = row.getBoundingClientRect();
    const top = box.top + 52; // clears the sticky heading
    if (at.top < top) rail.scrollTop -= top - at.top;
    else if (at.bottom > box.bottom - 8) {
      rail.scrollTop += at.bottom - box.bottom + 8;
    }
  }, [activeId]);

  const groups = FIELD_GROUPS.map((group) => ({
    group,
    stops: stops.filter((stop) =>
      stop.type === "mark"
        ? group === "diagram"
        : fieldMeta(stop.field).group === group,
    ),
  })).filter((entry) => entry.stops.length > 0);

  return (
    <aside
      ref={railRef}
      onPointerEnter={() => {
        inside.current = true;
      }}
      onPointerLeave={(event) => {
        inside.current = false;
        if (event.pointerType === "mouse") onLeave();
      }}
      className="rounded-2xl border border-neutral-200 bg-white lg:sticky lg:top-[calc(var(--header-h)+1rem)] lg:max-h-[calc(100dvh-var(--header-h)-2rem)] lg:self-start lg:overflow-y-auto dark:border-neutral-800 dark:bg-neutral-950"
    >
      <div className="top-0 z-10 flex items-baseline justify-between gap-3 rounded-t-2xl border-b border-neutral-100 bg-white/95 px-4 py-3 backdrop-blur lg:sticky dark:border-neutral-900 dark:bg-neutral-950/95">
        <h3 className="text-[14px] font-semibold text-neutral-900 dark:text-neutral-100">
          {heading}
        </h3>
        <span className="shrink-0 text-[12px] text-neutral-500 dark:text-neutral-400">
          {count}
        </span>
      </div>

      {groups.map(({ group, stops: members }) => (
        <section key={group} className="px-2 pt-3 pb-1">
          <h4 className="px-2 pb-1 text-[11px] font-semibold uppercase text-neutral-400 dark:text-neutral-500">
            {groupLabel(group)}
          </h4>
          <ul>
            {members.map((stop) => {
              const info = infos.get(stop.id);
              if (!info) return null;
              const active = stop.id === activeId;
              return (
                <li
                  key={stop.id}
                  ref={(node) => {
                    if (node) rows.current.set(stop.id, node);
                    else rows.current.delete(stop.id);
                  }}
                >
                  <button
                    type="button"
                    onPointerEnter={(event) => {
                      if (event.pointerType === "mouse") onEnter(stop.id);
                    }}
                    onFocus={(event) => {
                      if (event.currentTarget.matches(":focus-visible")) {
                        onEnter(stop.id);
                      }
                    }}
                    onClick={() => onReveal(stop.id)}
                    className={cn(
                      "block w-full rounded-lg px-2 py-2 text-left transition-colors",
                      active
                        ? "bg-primary/10"
                        : "hover:bg-neutral-50 dark:hover:bg-neutral-900",
                    )}
                  >
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      {info.code && (
                        <span className="inline-flex min-w-7 justify-center rounded bg-neutral-900 px-1 text-[11px] font-bold text-white dark:bg-neutral-700">
                          {info.code}
                        </span>
                      )}
                      <span
                        className={cn(
                          "text-[13px] font-semibold",
                          active
                            ? "text-primary"
                            : "text-neutral-900 dark:text-neutral-100",
                        )}
                      >
                        {info.title}
                      </span>
                      {info.jp && (
                        <span
                          lang="ja"
                          className="text-[11px] text-neutral-400 dark:text-neutral-500"
                        >
                          {info.jp}
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-[12px]/snug text-neutral-500 dark:text-neutral-400">
                      {info.description}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </aside>
  );
}
