"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import Logo from "@/components/svg/logo.svg";
import { useCompare } from "@/hooks/useCompare";
import { cn } from "@/utils";
import MobileDrawer from "./MobileDrawer";

type Props = {
  title?: string;
  /**
   * Second line under {@link title}, muted and smaller — the car's grade on lot
   * detail pages. Both lines still fit the 56px bar. Ignored without a title.
   */
  subtitle?: string;
  back?: { href: string };
  /**
   * Drop the home logo from the left. For a bar whose title *is* the subject —
   * the dashboard account screen — the logo only eats width. Ignored when
   * {@link back} is set, since the arrow takes that slot anyway.
   */
  hideLogo?: boolean;
  /** Right-hand action. Omit for the compare tray; pass `null` for none. */
  right?: ReactNode;
  customAction?: ReactNode;
  menuButton?: boolean;
};

// Compare tray entry point. Auth lives in the bottom nav's profile tab, so
// the header's right slot goes to compare instead of sign-in/avatar.
function DefaultRight() {
  const t = useTranslations("header");
  const { count } = useCompare();

  return (
    <Link
      href="/compare"
      aria-label={t("compare")}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-900"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M3 7h13l-3-3" />
        <path d="M21 17H8l3 3" />
      </svg>
      {count > 0 && (
        <span className="absolute top-0 right-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold leading-none text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}

export default function MobileHeader({
  title,
  subtitle,
  back,
  hideLogo,
  right,
  customAction,
  menuButton,
}: Props) {
  const t = useTranslations("header");
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Go back through browser history so the previous list page restores its
  // scroll position, URL filters and cached state. Only fall back to a fresh
  // navigation to `href` when there is no in-app history to return to (direct
  // entry, shared link, opened in a new tab).
  const handleBack = (href: string) => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(href);
    }
  };

  const leading = back ? (
    <button
      type="button"
      onClick={() => handleBack(back.href)}
      aria-label={t("menu.back")}
      className="-ml-1 inline-flex h-9 w-9 items-center justify-center rounded-full text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-900"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <polyline points="15 18 9 12 15 6" />
      </svg>
    </button>
  ) : hideLogo ? null : (
    <Link
      href="/"
      aria-label={t("menu.homeAria")}
      className="inline-flex shrink-0"
    >
      <Logo className="h-8 w-auto" />
    </Link>
  );

  return (
    <>
      {/*
        Slides out of the way while scrolling down and comes straight back on the
        first upward scroll — the direction comes from `<html data-scroll-dir>`
        (see `ScrollState`), so this is a pure CSS transform with no React state
        behind it. `MobileBottomNav` rides the same signal in the other direction.

        Being `fixed`, the bar holds no space in the flow: `MobileShell`'s
        `<main>` reserves it with `pt-(--header-h)`, and `--header-h` is 3.5rem
        on mobile (set on `<html>` in the locale layout) — exactly this `h-14`,
        border folded in by `border-box`.
      */}
      <header
        data-app-chrome
        className={cn(
          "fixed inset-x-0 top-0 z-50 flex h-14 items-center gap-2 border-b border-neutral-100 bg-white/95 px-4 backdrop-blur-xl",
          "dark:border-neutral-900 dark:bg-neutral-950/95",
          "transition-transform duration-300 ease-out motion-reduce:transition-none",
          "scroll-down:-translate-y-full",
        )}
      >
        {leading}
        {title ? (
          // Tight leading so title + subtitle stay inside the 56px bar. Both
          // lines truncate: a long lot name must never push the actions out.
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[15px] font-semibold leading-tight text-neutral-900 dark:text-neutral-100">
              {title}
            </h1>
            {subtitle && (
              <p className="truncate text-[11px] leading-tight text-neutral-500 dark:text-neutral-400">
                {subtitle}
              </p>
            )}
          </div>
        ) : (
          <div className="flex-1" />
        )}
        {customAction}
        {/* `??` would swallow an explicit `right={null}`, so compare is the
            default only when the prop is genuinely absent. The dashboard passes
            `null`: a "compare cars" button has no business on an account
            screen. */}
        {right === undefined ? <DefaultRight /> : right}
        {menuButton && (
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label={t("menu.openMenu")}
            className="-mr-1 inline-flex h-9 w-9 items-center justify-center rounded-full text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-900"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="4" x2="20" y1="7" y2="7" />
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="14" y1="17" y2="17" />
            </svg>
          </button>
        )}
      </header>
      {menuButton && (
        <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      )}
    </>
  );
}
