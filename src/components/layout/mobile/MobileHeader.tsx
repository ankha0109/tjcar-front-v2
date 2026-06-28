"use client";

import { useState, type ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Logo from "@/components/svg/logo.svg";
import { cn } from "@/utils";
import MobileDrawer from "./MobileDrawer";

type CustomerUser = {
  firstname: string;
  lastname: string;
  balance?: number;
  currency?: string;
};

type Props = {
  title?: string;
  back?: { href: string };
  right?: ReactNode;
  customAction?: ReactNode;
  menuButton?: boolean;
};

function getInitials(user: CustomerUser) {
  const f = user.firstname?.[0] ?? "";
  const l = user.lastname?.[0] ?? "";
  return `${f}${l}`.toUpperCase() || "U";
}

function DefaultRight() {
  const t = useTranslations("header");
  const { data: session } = useSession();
  const user = session?.user as CustomerUser | undefined;

  if (session && user) {
    return (
      <Link
        href="/dashboard"
        aria-label={t("menu.open")}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 text-[12px] font-semibold text-white dark:bg-neutral-100 dark:text-neutral-900"
      >
        {getInitials(user)}
      </Link>
    );
  }

  return (
    <Link
      href="/auth/login"
      className="inline-flex h-9 items-center rounded-full bg-neutral-900 px-3 text-[12px] font-semibold text-white dark:bg-neutral-100 dark:text-neutral-900"
    >
      {t("auth.signIn")}
    </Link>
  );
}

export default function MobileHeader({
  title,
  back,
  right,
  customAction,
  menuButton,
}: Props) {
  const t = useTranslations("header");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const leading = back ? (
    <Link
      href={back.href}
      aria-label={t("menu.closeMenu")}
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
    </Link>
  ) : (
    <Link href="/" aria-label={t("menu.homeAria")} className="inline-flex shrink-0">
      <Logo className="h-8 w-auto" />
    </Link>
  );

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-neutral-100 bg-white/95 px-3 backdrop-blur-xl",
          "dark:border-neutral-900 dark:bg-neutral-950/95",
        )}
      >
        {leading}
        {title ? (
          <h1 className="min-w-0 flex-1 truncate text-[15px] font-semibold text-neutral-900 dark:text-neutral-100">
            {title}
          </h1>
        ) : (
          <div className="flex-1" />
        )}
        {customAction}
        {right ?? <DefaultRight />}
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
