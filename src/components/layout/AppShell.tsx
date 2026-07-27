import type { ReactNode } from "react";
import { getDevice } from "@/lib/device";
import type { Theme } from "@/lib/theme";
import DesktopShell from "./desktop/DesktopShell";
import MobileShell from "./mobile/MobileShell";

type Props = {
  theme: Theme;
  /** Rendered by the mobile shell only — the `@mobileHeader` parallel route. */
  mobileHeader: ReactNode;
  children: ReactNode;
};

/**
 * Picks the shell from the `tjcar-device` cookie (phone UA only), NOT from a
 * breakpoint — a narrow desktop window keeps the desktop shell. The check lives
 * here so the layout doesn't have to thread `device` through; `cookies()` is
 * request-scoped, so reading it again is free.
 */
export default async function AppShell({ theme, mobileHeader, children }: Props) {
  const device = await getDevice();

  return device === "mobile" ? (
    <MobileShell header={mobileHeader}>{children}</MobileShell>
  ) : (
    <DesktopShell theme={theme}>{children}</DesktopShell>
  );
}
