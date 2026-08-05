import type { ReactNode } from "react";
import { cn } from "@/utils";

type Props = {
  /** Uppercase heading above the card. Omit for a standalone card. */
  title?: string;
  children: ReactNode;
};

/**
 * A titled block of {@link MobileMenuRow}s — the iOS-settings shape: a small
 * grey heading over one white card with hairlines between its rows.
 *
 * The vertical rhythm lives here rather than on the parent so an untitled card
 * (sign out) keeps the same gap a titled one gets from its heading.
 */
export default function MobileMenuGroup({ title, children }: Props) {
  return (
    <div>
      {title ? (
        <h2 className="px-1 pb-2 pt-5 text-[11px] font-semibold uppercase text-neutral-400 dark:text-neutral-500">
          {title}
        </h2>
      ) : null}
      <div
        className={cn(
          "divide-y divide-neutral-100 overflow-hidden rounded-xl border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900",
          !title && "mt-5",
        )}
      >
        {children}
      </div>
    </div>
  );
}
