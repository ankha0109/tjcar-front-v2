import type { ReactNode } from "react";
import type { Theme } from "@/lib/theme";
import DesktopHeader from "./DesktopHeader";
import DesktopFooter from "./DesktopFooter";

type Props = {
  theme: Theme;
  children: ReactNode;
};

export default function DesktopShell({ theme, children }: Props) {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-neutral-950">
      <DesktopHeader theme={theme} />
      <main className="flex-1 flex flex-col">{children}</main>
      <DesktopFooter />
    </div>
  );
}
