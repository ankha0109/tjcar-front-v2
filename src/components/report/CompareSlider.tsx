"use client";

import { useRef, useState } from "react";
import Image, { type StaticImageData } from "next/image";
import { cn } from "@/utils";

type CompareSliderProps = {
  /** Shown on the LEFT of the divider (clipped top layer). */
  left: StaticImageData;
  /** Shown on the RIGHT of the divider (base layer). */
  right: StaticImageData;
  altLeft: string;
  altRight: string;
  labelLeft: string;
  labelRight: string;
  /** "Drag to compare" microcopy — fades out after the first interaction. */
  hint: string;
  ariaLabel: string;
  /** Small transparency badge, e.g. "illustrative example". */
  badge?: string;
  className?: string;
};

/**
 * Before/after image reveal. The position lives in a CSS custom property
 * (`--pos`) written imperatively inside rAF, so dragging never re-renders
 * React — the clip-path, divider and handle all follow the one variable.
 */
export default function CompareSlider({
  left,
  right,
  altLeft,
  altRight,
  labelLeft,
  labelRight,
  hint,
  ariaLabel,
  badge,
  className,
}: CompareSliderProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const pos = useRef(50);
  const rect = useRef<DOMRect | null>(null);
  const raf = useRef(0);
  const hintedRef = useRef(false);
  const [hinted, setHinted] = useState(false);

  const apply = () => {
    raf.current = 0;
    const el = boxRef.current;
    if (!el) return;
    el.style.setProperty("--pos", `${pos.current}%`);
    el.setAttribute("aria-valuenow", String(Math.round(pos.current)));
  };

  const set = (pct: number) => {
    pos.current = Math.min(100, Math.max(0, pct));
    if (!raf.current) raf.current = requestAnimationFrame(apply);
    if (!hintedRef.current) {
      hintedRef.current = true;
      setHinted(true);
    }
  };

  const fromX = (clientX: number) => {
    const r = rect.current;
    if (!r) return pos.current;
    return ((clientX - r.left) / r.width) * 100;
  };

  const endGesture = () => {
    rect.current = null;
  };

  return (
    <div
      ref={boxRef}
      role="slider"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={50}
      className={cn(
        "relative aspect-[4/3] w-full cursor-ew-resize touch-pan-y select-none overflow-hidden rounded-2xl border border-neutral-200 bg-white outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:aspect-[16/9] md:aspect-[2/1] dark:border-neutral-800 dark:bg-neutral-900",
        className,
      )}
      style={{ "--pos": "50%" } as React.CSSProperties}
      onPointerDown={(e) => {
        const el = boxRef.current;
        if (!el) return;
        rect.current = el.getBoundingClientRect();
        el.setPointerCapture(e.pointerId);
        set(fromX(e.clientX));
      }}
      onPointerMove={(e) => {
        if (rect.current) set(fromX(e.clientX));
      }}
      onPointerUp={endGesture}
      onPointerCancel={endGesture}
      onLostPointerCapture={endGesture}
      onKeyDown={(e) => {
        const step = e.shiftKey ? 10 : 5;
        if (e.key === "ArrowLeft") set(pos.current - step);
        else if (e.key === "ArrowRight") set(pos.current + step);
        else if (e.key === "Home") set(0);
        else if (e.key === "End") set(100);
        else return;
        e.preventDefault();
      }}
    >
      {/* studio backdrop */}
      <div
        aria-hidden="true"
        className="absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.05)_1px,transparent_0)] [background-size:22px_22px] dark:[background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 [background:radial-gradient(55%_70%_at_50%_100%,rgba(241,71,44,0.07),transparent_70%)]"
      />

      {/* base layer — visible RIGHT of the divider */}
      <Image
        src={right}
        alt={altRight}
        fill
        draggable={false}
        sizes="(min-width: 1024px) 960px, 100vw"
        className="object-contain p-6 sm:p-10 md:p-14"
      />
      {/* top layer — revealed to the LEFT of the divider via nested,
          mutually-cancelling translateX transforms. Unlike clip-path this
          stays on the compositor: dragging never repaints the layer. */}
      <div
        className="absolute inset-0 overflow-hidden will-change-transform"
        style={{ transform: "translateX(calc(var(--pos) - 100%))" }}
      >
        <div
          className="absolute inset-0 bg-white will-change-transform dark:bg-neutral-900"
          style={{ transform: "translateX(calc(100% - var(--pos)))" }}
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.05)_1px,transparent_0)] [background-size:22px_22px] dark:[background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)]"
          />
          <Image
            src={left}
            alt={altLeft}
            fill
            draggable={false}
            sizes="(min-width: 1024px) 960px, 100vw"
            className="object-contain p-6 sm:p-10 md:p-14"
          />
        </div>
      </div>

      {/* divider + handle — one transform-driven positioner (no `left`
          layout per frame); translateX(%) of a full-width element equals
          % of the container. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 will-change-transform"
        style={{ transform: "translateX(var(--pos))" }}
      >
        <div className="absolute inset-y-0 left-0 w-px -translate-x-1/2 bg-neutral-900/20 shadow-[0_0_10px_rgba(0,0,0,0.25)] dark:bg-white/30" />
        <div className="cmp-handle pointer-events-auto absolute left-0 top-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 touch-none place-items-center rounded-full border-2 border-white bg-primary text-white shadow-lg">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="m9 6-5 6 5 6" />
            <path d="m15 6 5 6-5 6" />
          </svg>
        </div>
      </div>

      {/* floating labels — each one lives inside its own layer, so the divider
          wipes it exactly like the image underneath: drag far enough left and
          the left label is gone, far enough right and the right one is.
          No backdrop-blur: a blur above the moving layer would force an
          expensive re-filter on every dragged frame. */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden will-change-transform"
        style={{ transform: "translateX(calc(var(--pos) - 100%))" }}
      >
        <div
          className="absolute inset-0 will-change-transform"
          style={{ transform: "translateX(calc(100% - var(--pos)))" }}
        >
          <span className="absolute left-3 top-3 rounded-full bg-neutral-950/75 px-3 py-1 text-[11.5px] font-medium text-white sm:left-4 sm:top-4 sm:text-[12px]">
            {labelLeft}
          </span>
        </div>
      </div>
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden will-change-transform"
        style={{ transform: "translateX(var(--pos))" }}
      >
        <div
          className="absolute inset-0 will-change-transform"
          style={{ transform: "translateX(calc(-1 * var(--pos)))" }}
        >
          <span className="absolute right-3 top-3 rounded-full bg-primary/90 px-3 py-1 text-[11.5px] font-medium text-white sm:right-4 sm:top-4 sm:text-[12px]">
            {labelRight}
          </span>
        </div>
      </div>

      {badge ? (
        <span className="absolute bottom-3 left-3 rounded-full bg-neutral-950/60 px-2.5 py-1 text-[10px] uppercase text-white/85 sm:bottom-4 sm:left-4">
          {badge}
        </span>
      ) : null}

      {/* drag hint — fades after first interaction */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-neutral-950/75 px-3.5 py-1.5 text-[12px] font-medium text-white transition-opacity duration-500 sm:bottom-5",
          hinted && "opacity-0",
        )}
      >
        {hint}
      </span>
    </div>
  );
}
