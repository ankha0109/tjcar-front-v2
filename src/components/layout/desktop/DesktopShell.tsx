import type { ReactNode } from "react";
import type { Theme } from "@/lib/theme";
import DesktopHeader from "./DesktopHeader";
import DesktopFooter from "./DesktopFooter";

type Props = {
  theme: Theme;
  children: ReactNode;
};

export default function DesktopShell({ theme, children }: Props) {
  // `min-h-dvh` for the same reason as `MobileShell`: a narrow window on a
  // mobile browser gets the desktop shell too, and `100vh` there is the toolbar-
  // collapsed viewport, which adds scroll range a page that fits should not have.
  // Identical to `100vh` on a desktop browser.
  return (
    <div className="flex flex-col min-h-dvh bg-white dark:bg-neutral-950">
      <DesktopHeader theme={theme} />
      <main className="flex-1 flex flex-col">{children}</main>
      <DesktopFooter />
    </div>
  );
}
