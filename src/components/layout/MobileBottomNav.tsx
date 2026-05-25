"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { cn } from "@/utils";

// Доод цэс гарахгүй замууд. Шинэ замыг энд нэмж/хасаж тохируулна.
const HIDDEN_PATH_PATTERNS: RegExp[] = [
  /^\/cars\/[^/]+/, // машины дэлгэрэнгүй (Бэлэн)
  /^\/japan\/[^/]+/, // машины дэлгэрэнгүй (Япон)
  /^\/korea\/[^/]+/, // машины дэлгэрэнгүй (Солонгос)
];

const shouldHideOn = (pathname: string) =>
  HIDDEN_PATH_PATTERNS.some((p) => p.test(pathname));

type NavItem = {
  href: string;
  label: string;
  match: (pathname: string) => boolean;
  icon: (active: boolean) => React.ReactNode;
};

const stroke = (active: boolean) => (active ? 2.2 : 1.8);

const USER_ICON = (active: boolean) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={stroke(active)}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-[22px] w-[22px]"
  >
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21v-1a7 7 0 0 1 7-7h2a7 7 0 0 1 7 7v1" />
  </svg>
);

export default function MobileBottomNav() {
  const t = useTranslations("mobileNav");
  const pathname = usePathname();
  const { data: session } = useSession();

  const NAV_ITEMS: NavItem[] = [
    {
      href: "/japan",
      label: t("japan"),
      match: (p) => p === "/japan" || p.startsWith("/japan/"),
      icon: (active) => (
        <svg
          viewBox="0 0 24 24"
          fill={active ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={stroke(active)}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(
            "h-[22px] w-[22px]",
            active && "fill-current/10 stroke-current",
          )}
        >
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      href: "/korea",
      label: t("korea"),
      match: (p) => p === "/korea" || p.startsWith("/korea/"),
      icon: (active) => (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke(active)}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-[22px] w-[22px]"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      ),
    },
    {
      href: "/cars",
      label: t("ready"),
      match: (p) => p === "/cars" || p.startsWith("/cars/"),
      icon: (active) => (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke(active)}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-[22px] w-[22px]"
        >
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
          <circle cx="7" cy="17" r="2" />
          <path d="M9 17h6" />
          <circle cx="17" cy="17" r="2" />
        </svg>
      ),
    },
    {
      href: "/report",
      label: t("check"),
      match: (p) => p === "/report" || p.startsWith("/report/"),
      icon: (active) => (
        <svg
          viewBox="0 0 24 24"
          fill={active ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={stroke(active)}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(
            "h-[22px] w-[22px]",
            active && "fill-current/10 stroke-current",
          )}
        >
          <path d="M20 13c0 5-3.5 7.5-7.7 8.95a1 1 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      ),
    },
  ];

  if (shouldHideOn(pathname)) return null;

  const profileHref = session ? "/dashboard" : "/auth/login";
  const profileActive =
    pathname.startsWith("/auth") || pathname.startsWith("/dashboard");

  return (
    <nav
      aria-label={t("aria")}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-12px_rgba(15,15,15,0.08)] md:hidden dark:border-neutral-800 dark:bg-neutral-950/95"
    >
      <ul className="flex h-16 items-stretch">
        {NAV_ITEMS.map((item) => {
          const active = item.match(pathname);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "group relative flex h-full flex-col items-center justify-center gap-0.5 transition-colors",
                  active ? "text-primary" : "text-neutral-500 dark:text-neutral-400",
                )}
              >
                {active && (
                  <span className="absolute top-0 left-1/2 h-[3px] w-8 -translate-x-1/2 rounded-b-full bg-primary" />
                )}
                <span
                  className={cn(
                    "transition-transform duration-200",
                    active && "-translate-y-0.5 scale-105",
                  )}
                >
                  {item.icon(active)}
                </span>
                <span
                  className={cn(
                    "text-[10px]",
                    active ? "font-semibold" : "font-medium",
                  )}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
        <li className="flex-1">
          <Link
            href={profileHref}
            className={cn(
              "group relative flex h-full flex-col items-center justify-center gap-0.5 transition-colors",
              profileActive ? "text-primary" : "text-neutral-500",
            )}
          >
            {profileActive && (
              <span className="absolute top-0 left-1/2 h-[3px] w-8 -translate-x-1/2 rounded-b-full bg-primary" />
            )}
            <span
              className={cn(
                "transition-transform duration-200",
                profileActive && "-translate-y-0.5 scale-105",
              )}
            >
              {USER_ICON(profileActive)}
            </span>
            <span
              className={cn(
                "text-[10px]",
                profileActive ? "font-semibold" : "font-medium",
              )}
            >
              {t("profile")}
            </span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
