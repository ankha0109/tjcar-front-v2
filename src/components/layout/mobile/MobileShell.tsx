import type { ReactNode } from "react";
import MobileBottomNav from "./MobileBottomNav";

type Props = {
  header: ReactNode;
  children: ReactNode;
};

export default function MobileShell({ header, children }: Props) {
  // `min-h-dvh`, not `min-h-screen`: on iOS Safari `100vh` is the *large*
  // viewport — the one you only get once the toolbars collapse. Measured 741px
  // against a 659px visible viewport on an iPhone 15, so `min-h-screen` left
  // every page 82px taller than the screen and even pages whose content fits
  // picked up 82px of empty scroll range for a stray offset to sit in. `100dvh`
  // tracks the viewport that is actually visible. Keep in sync with `DesktopShell`.
  return (
    <div className="flex flex-col min-h-dvh bg-white dark:bg-neutral-950">
      {header}
      {/*
        TEMPORARY — no `pt` here: `MobileHeader` is `sticky` for now, so it holds
        its own 56px in the flow and reserving the space again would double it.
        Restore `pt-(--header-h)` when the header goes back to `fixed`.
        `pb` still reserves the fixed bottom nav.
      */}
      <main className="flex-1 flex flex-col pb-[calc(4rem+env(safe-area-inset-bottom))]">
        {children}
      </main>
      <MobileBottomNav />
    </div>
  );
}
