import type { ReactNode } from "react";
import MobileBottomNav from "./MobileBottomNav";

type Props = {
  header: ReactNode;
  children: ReactNode;
};

export default function MobileShell({ header, children }: Props) {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-neutral-950">
      {header}
      <main className="flex-1 flex flex-col pb-[calc(4rem+env(safe-area-inset-bottom))]">
        {children}
      </main>
      <MobileBottomNav />
    </div>
  );
}
