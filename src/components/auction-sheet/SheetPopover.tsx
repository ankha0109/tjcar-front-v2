import { cn } from "@/utils";

/** What the reader is told about one stop — a field or a damage mark. */
export type StopInfo = {
  title: string;
  description: string;
  /** The label as the sheet prints it. Fields only. */
  jp?: string;
  /** The mark's code — `A2`, `U1`. Marks only. */
  code?: string;
};

export type StepperLabels = {
  prev: string;
  next: string;
  close: string;
  counter: string;
};

type Box = { x: number; y: number; w: number; h: number };

type Props = {
  info: StopInfo;
  /** The stop's box in the sheet's viewBox units. */
  box: Box;
  sheetHeight: number;
  pinned: boolean;
  labels: StepperLabels;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
};

const WIDTH = 320;

/**
 * The explanation card, anchored to the box it explains: under it, or over it
 * once the box is past the middle of the sheet, and slid sideways just enough
 * to stay on the sheet.
 *
 * While the reader is only hovering it ignores the pointer — otherwise it would
 * sit between the mouse and the next box. Pinning (a click) makes it a real
 * card with a close button and a stepper.
 */
export default function SheetPopover({
  info,
  box,
  sheetHeight,
  pinned,
  labels,
  onPrev,
  onNext,
  onClose,
}: Props) {
  const below = (box.y + box.h / 2) / sheetHeight < 0.55;
  const centre = (box.x + box.w / 2) / 10;

  return (
    <div
      role={pinned ? "dialog" : "tooltip"}
      aria-label={pinned ? info.title : undefined}
      style={{
        width: WIDTH,
        left: `clamp(0px, calc(${centre}% - ${WIDTH / 2}px), calc(100% - ${WIDTH}px))`,
        ...(below
          ? { top: `calc(${((box.y + box.h) / sheetHeight) * 100}% + 8px)` }
          : { bottom: `calc(${(1 - box.y / sheetHeight) * 100}% + 8px)` }),
      }}
      className={cn(
        "absolute z-10 rounded-xl border border-neutral-200 bg-white p-3.5 shadow-xl shadow-neutral-900/10",
        "dark:border-neutral-700 dark:bg-neutral-900 dark:shadow-black/40",
        pinned ? "pointer-events-auto" : "pointer-events-none",
      )}
    >
      <StopSummary info={info} />
      {pinned && (
        <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-2.5 dark:border-neutral-800">
          <Stepper labels={labels} onPrev={onPrev} onNext={onNext} />
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-[12px] font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
          >
            {labels.close}
          </button>
        </div>
      )}
    </div>
  );
}

/** Title, the printed Japanese label, and the explanation. */
export function StopSummary({ info }: { info: StopInfo }) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {info.code && (
          <span className="inline-flex min-w-8 justify-center rounded-md bg-neutral-900 px-1.5 py-0.5 text-[13px] font-bold text-white dark:bg-neutral-700">
            {info.code}
          </span>
        )}
        <span className="text-[14px] font-semibold text-neutral-900 dark:text-neutral-100">
          {info.title}
        </span>
        {info.jp && (
          <span
            lang="ja"
            className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[12px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
          >
            {info.jp}
          </span>
        )}
      </div>
      <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-400">
        {info.description}
      </p>
    </>
  );
}

/** `‹ 12 / 54 ›` — walks every stop on the sheet in reading order. */
export function Stepper({
  labels,
  onPrev,
  onNext,
  className,
}: {
  labels: StepperLabels;
  onPrev: () => void;
  onNext: () => void;
  className?: string;
}) {
  const button =
    "inline-flex size-8 items-center justify-center rounded-full border border-neutral-200 text-neutral-700 transition hover:bg-neutral-100 pointer-coarse:size-10 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800";
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <button
        type="button"
        onClick={onPrev}
        aria-label={labels.prev}
        className={button}
      >
        <Chevron className="rotate-180" />
      </button>
      <span className="min-w-12 text-center text-[12px] font-medium text-neutral-500 dark:text-neutral-400">
        {labels.counter}
      </span>
      <button
        type="button"
        onClick={onNext}
        aria-label={labels.next}
        className={button}
      >
        <Chevron />
      </button>
    </div>
  );
}

function Chevron({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
