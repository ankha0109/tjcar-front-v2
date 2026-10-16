import type { ReactNode } from "react";
import { cn } from "@/utils";

/**
 * The small "new" pill beside a fresh nav entry (Хятад машин). Uppercased in
 * CSS so the message stays an ordinary word — "Шинэ", "New", "Новое".
 *
 * Red-700 on the 10% brand tint rather than the brand orange itself: white or
 * orange text at 10px needs 4.5:1, and `#f1472c` gets nowhere near it.
 */
export default function NewBadge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-4 shrink-0 items-center rounded-full bg-primary/10 px-1.5 text-[10px]/none font-bold uppercase text-red-700",
        "dark:bg-primary/20 dark:text-orange-300",
        className,
      )}
    >
      {children}
    </span>
  );
}
