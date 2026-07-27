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
      {/* `pt` reserves the fixed header, `pb` the fixed bottom nav. */}
      <main className="flex-1 flex flex-col pt-(--header-h) pb-[calc(4rem+env(safe-area-inset-bottom))]">
        {children}
      </main>
      <MobileBottomNav />
    </div>
  );
}
