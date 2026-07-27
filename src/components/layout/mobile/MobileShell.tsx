import type { ReactNode } from "react";
import MobileBottomNav from "./MobileBottomNav";

type Props = {
  header: ReactNode;
  children: ReactNode;
};

export default function MobileShell({ header, children }: Props) {
  return (
    <div className="flex flex-col min-h-dvh bg-white dark:bg-neutral-950">
      {header}
      {/*
        TEMPORARY — no `pt` here: `MobileHeader` carries no positioning for now,
        so it holds its own 56px in the flow and reserving the space again would
        double it. Restore `pt-(--header-h)` when the header goes back to `fixed`.
        `pb` still reserves the fixed bottom nav.
      */}
      <main className="flex-1 flex flex-col pb-[calc(4rem+env(safe-area-inset-bottom))]">
        {children}
      </main>
      <MobileBottomNav />
    </div>
  );
}
