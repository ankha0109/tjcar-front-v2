"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/utils";

/**
 * A draggable bottom sheet for phones — what antd's `Drawer placement="bottom"`
 * is not: the user owns the height.
 *
 * Two things it does that the drawer could not:
 *
 * 1. **The height is a gesture, not a measurement.** `Drawer size="auto"` sized
 *    itself to its content, so a list filtered down to two rows collapsed into a
 *    strip. Here the sheet opens at `snap` and the grabber drags it between that
 *    and `TALL`; releasing below the short snap closes it.
 * 2. **It stays out from behind the on-screen keyboard.** Keyboards shrink only
 *    the visual viewport — the layout viewport a `position: fixed` sheet anchors
 *    to stays full-height, so a short sheet sat *under* the keyboard with its
 *    footer buttons unreachable. While the keyboard is up the sheet is pinned to
 *    the visible area and expanded to fill it, the same trick `AiChatPanel` uses
 *    for its composer.
 *
 * Body layout is a flex column — grabber, scrolling body, footer — so a caller
 * can pin a search box with `sticky top-0` and keep it above the keyboard no
 * matter how the list below it scrolls.
 *
 * Phone-sized by intent: it locks body scroll the way antd's drawer does and
 * does not compensate for a desktop scrollbar's width.
 */

/** Share of the visible viewport the tall snap takes. */
const TALL = 0.92;
/** Never open shorter than this — a 40px sheet reads as a glitch. */
const MIN_H = 160;
/** Release below this share of the short snap and the sheet closes. */
const CLOSE_AT = 0.6;
/** Keep in sync with the `duration-[260ms]` classes below. */
const ANIM_MS = 260;

const clamp = (n: number, min: number, max: number) =>
  Math.min(Math.max(n, min), max);

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

export default function BottomSheet({
  open,
  onClose,
  title,
  footer,
  snap = 0.6,
  scrollable = true,
  closeLabel,
  className,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  footer?: React.ReactNode;
  /**
   * Height the sheet opens at: a 0–1 share of the visible viewport, or `"auto"`
   * to measure the content (a date field or a single input has no list to give
   * room to). The tall snap is always reachable by dragging the grabber.
   */
  snap?: "auto" | number;
  /**
   * Whether the body itself scrolls. Pass `false` when the content manages its
   * own scrollers — two side-by-side range columns scroll separately, and one
   * outer scrollbar would move both at once.
   */
  scrollable?: boolean;
  closeLabel?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  /** Ascending heights in px, rederived on open and on every viewport change. */
  const snapsRef = useRef<number[]>([]);
  /** Content height measured at open, for `snap="auto"`. */
  const contentRef = useRef(0);
  /** Where the last drag settled — restored when the keyboard hides again. */
  const snapIndexRef = useRef(0);
  const draggingRef = useRef(false);
  const titleId = useId();

  // `open` drives the transition; `closing` keeps the sheet mounted for one
  // animation past it so it slides out instead of vanishing. Both flips are
  // adjusted during render rather than in an effect — an effect that calls
  // setState synchronously cascades renders.
  const [closing, setClosing] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);
  const [shown, setShown] = useState(false);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (!open) setClosing(true);
  }
  const mounted = open || closing;

  const visibleH = () => window.visualViewport?.height ?? window.innerHeight;

  /**
   * Snaps for a given visible height. Always derived, never edited in place —
   * the keyboard shrinks the viewport and must not leave the short snap
   * permanently clamped once it hides again.
   */
  const snapsFor = useCallback(
    (visH: number) => {
      const tall = Math.round(visH * TALL);
      // A fraction is a share of the screen, not of whatever the keyboard left
      // over: focusing the search box should clamp the list's room, not cut it
      // to 60% of a half-height viewport.
      const wanted =
        snap === "auto"
          ? contentRef.current
          : Math.round(window.innerHeight * snap);
      const short = clamp(wanted, Math.min(MIN_H, tall), tall);
      return short >= tall ? [tall] : [short, tall];
    },
    [snap],
  );

  /** Size the sheet for its content and park it on the shorter snap. */
  const measure = useCallback(
    (el: HTMLDivElement) => {
      if (snap === "auto") {
        // One forced reflow per open: let the content size the box, read it back.
        const prev = el.style.height;
        el.style.height = "auto";
        contentRef.current = el.offsetHeight;
        el.style.height = prev;
      }
      snapsRef.current = snapsFor(visibleH());
      snapIndexRef.current = 0;
      el.style.height = `${snapsRef.current[0]}px`;
    },
    [snap, snapsFor],
  );

  useEffect(() => {
    if (!closing) return;
    const id = window.setTimeout(() => setClosing(false), ANIM_MS);
    return () => window.clearTimeout(id);
  }, [closing]);

  // Size before the slide-in so the sheet animates to its real height. Runs
  // before the keyboard effect below, which reads the snaps it writes. The flag
  // flips inside a frame callback so the browser has a chance to paint the
  // sheet off-screen first — that is what makes it an animation.
  useEffect(() => {
    if (!mounted) return;
    const el = sheetRef.current;
    if (!el) return;
    if (open) measure(el);
    const id = requestAnimationFrame(() => setShown(open));
    return () => window.cancelAnimationFrame(id);
  }, [mounted, open, measure]);

  // Keyboard and rotation. `window.innerHeight - vv.height - vv.offsetTop` is
  // the keyboard's bite out of the layout viewport; offsetting `bottom` by it
  // lifts the sheet — footer buttons included — back into view.
  useEffect(() => {
    if (!mounted) return;
    const el = sheetRef.current;
    const vv = window.visualViewport;
    if (!el || !vv) return;
    let keyboardWasOpen = false;
    const apply = () => {
      const inset = Math.max(
        0,
        window.innerHeight - vv.height - vv.offsetTop,
      );
      const keyboardOpen = inset > 1 || vv.offsetTop > 0;
      el.style.bottom = keyboardOpen ? `${inset}px` : "";

      const snaps = snapsFor(vv.height);
      snapsRef.current = snaps;
      if (draggingRef.current) return;
      if (keyboardOpen || keyboardWasOpen) {
        // Re-snap against the room that is left. The index is the user's last
        // choice and survives the keyboard; only the height it maps to moves.
        const i = Math.min(snapIndexRef.current, snaps.length - 1);
        el.style.height = `${snaps[i]}px`;
      }
      keyboardWasOpen = keyboardOpen;
    };
    apply();
    vv.addEventListener("resize", apply);
    vv.addEventListener("scroll", apply);
    return () => {
      vv.removeEventListener("resize", apply);
      vv.removeEventListener("scroll", apply);
    };
  }, [mounted, snapsFor]);

  // The page behind is held still while the sheet is up. Kept apart from the
  // Esc listener below: callers pass an inline `onClose`, so that effect re-runs
  // on every render and must not take the scroll lock with it.
  useEffect(() => {
    if (!mounted) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mounted, onClose]);

  const onGrabberDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = sheetRef.current;
    if (!el) return;
    // The close button lives in the drag area; let it be a button.
    if ((e.target as HTMLElement).closest("button,a,input")) return;

    const startY = e.clientY;
    const startH = el.getBoundingClientRect().height;
    const snaps = snapsRef.current;
    const max = snaps[snaps.length - 1] ?? startH;
    let height = startH;

    draggingRef.current = true;
    el.style.transition = "none";

    const onMove = (ev: PointerEvent) => {
      height = clamp(startH + (startY - ev.clientY), 0, max);
      el.style.height = `${height}px`;
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      draggingRef.current = false;
      el.style.transition = "";
      if (height < (snaps[0] ?? max) * CLOSE_AT) {
        onClose();
        return;
      }
      let nearest = 0;
      snaps.forEach((s, i) => {
        if (Math.abs(s - height) < Math.abs(snaps[nearest] - height)) nearest = i;
      });
      snapIndexRef.current = nearest;
      el.style.height = `${snaps[nearest]}px`;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  if (!mounted) return null;

  return createPortal(
    // 1000 is antd's drawer layer, so its pickers (1050) still open on top.
    <div className="fixed inset-0 z-[1000]">
      <div
        aria-hidden
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-black/45 transition-opacity duration-[260ms] ease-out",
          shown ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={cn(
          "absolute inset-x-0 bottom-0 flex flex-col overflow-hidden rounded-t-2xl bg-white shadow-[0_-8px_40px_rgba(0,0,0,0.18)] transition-[height,transform] duration-[260ms] ease-out dark:bg-neutral-900",
          shown ? "translate-y-0" : "translate-y-full",
          className,
        )}
      >
        {/* Drag area. `touch-none` keeps the browser from scrolling instead. */}
        <div
          onPointerDown={onGrabberDown}
          className="shrink-0 cursor-grab touch-none select-none active:cursor-grabbing"
        >
          <div className="flex justify-center pb-1 pt-2.5">
            <span className="h-1 w-10 rounded-full bg-neutral-300 dark:bg-neutral-600" />
          </div>
          <div className="flex items-center justify-between gap-3 px-5 pb-3">
            <div
              id={titleId}
              className="min-w-0 flex-1 truncate text-[15px] font-semibold text-neutral-900 dark:text-neutral-100"
            >
              {title}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={closeLabel}
              className="-mr-1.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-400 active:bg-neutral-100 dark:active:bg-neutral-800"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* No `pt` — a `sticky top-0` search box has to sit flush with the title. */}
        <div
          className={cn(
            "min-h-0 flex-1 px-5 pb-4",
            scrollable ? "overflow-y-auto overscroll-contain" : "overflow-hidden",
          )}
        >
          {children}
        </div>

        {footer && (
          <div className="shrink-0 border-t border-neutral-100 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 dark:border-neutral-800">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
