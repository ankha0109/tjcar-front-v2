"use client";

import { useSyncExternalStore, useTransition } from "react";
import { setTheme } from "@/app/actions/theme";
import { useRouter } from "@/i18n/navigation";
import type { Theme } from "@/lib/theme";

// Reads the active theme straight from <html data-theme> (set server-side and
// re-rendered on router.refresh()), so a toggle stays in sync with the DOM
// without prop-drilling `theme` through the mobile-header parallel-route slots.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

function getSnapshot(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function getServerSnapshot(): Theme {
  return "light";
}

export type UseThemeToggleResult = {
  theme: Theme;
  /** The server action is in flight — drive a Switch's `loading` with this. */
  isPending: boolean;
  /** `true` switches to dark. */
  toggle: (dark: boolean) => void;
};

/**
 * The dark-mode switch, shared by the hamburger drawer and the dashboard menu.
 * The cookie is written by a server action, then `router.refresh()` re-renders
 * the tree so `<html data-theme>` — and every server component that reads the
 * theme — follows.
 */
export function useThemeToggle(): UseThemeToggleResult {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = (dark: boolean) => {
    startTransition(async () => {
      await setTheme(dark ? "dark" : "light");
      router.refresh();
    });
  };

  return { theme, isPending, toggle };
}
