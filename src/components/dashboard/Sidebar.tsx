"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

const NAV_HREFS = [
  {
    href: "/dashboard",
    key: "overview",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="7" height="9" x="3" y="3" rx="1" />
        <rect width="7" height="5" x="14" y="3" rx="1" />
        <rect width="7" height="9" x="14" y="12" rx="1" />
        <rect width="7" height="5" x="3" y="16" rx="1" />
      </svg>
    ),
  },
  {
    href: "/dashboard/profile",
    key: "profile",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    href: "/dashboard/bids",
    key: "bids",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m14.5 12.5-8 8a2.119 2.119 0 1 1-3-3l8-8" />
        <path d="m16 16 6-6" />
        <path d="m8 8 6-6" />
        <path d="m9 7 8 8" />
        <path d="m21 11-8-8" />
      </svg>
    ),
  },
  {
    href: "/dashboard/reports",
    key: "reports",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="9" x2="15" y1="13" y2="13" />
        <line x1="9" x2="15" y1="17" y2="17" />
      </svg>
    ),
  },
  {
    href: "/wishlist",
    key: "tracking",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
      </svg>
    ),
  },
] as const;

export default function Sidebar() {
  const path = usePathname();
  const t = useTranslations("dashboard.sidebar");

  const NAV = NAV_HREFS.map((item) => ({
    ...item,
    label: t(item.key as "overview" | "profile" | "bids" | "reports" | "tracking"),
  }));

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-neutral-200 bg-white h-full dark:border-neutral-800 dark:bg-neutral-950">
      <div className="px-4 py-5 border-b border-neutral-200 dark:border-neutral-800">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-neutral-900 text-white flex items-center justify-center text-xs font-bold dark:bg-neutral-100 dark:text-neutral-900">
            T
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">TJCAR</span>
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400">{t("title")}</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        <p className="px-2 py-2 text-[11px] font-medium uppercaser text-neutral-500 dark:text-neutral-400">
          {t("menuHeading")}
        </p>
        <ul className="space-y-0.5">
          {NAV.map((item) => {
            const active =
              item.href === "/dashboard"
                ? path === "/dashboard"
                : path.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors ${
                    active
                      ? "bg-neutral-100 text-neutral-900 font-medium dark:bg-neutral-800 dark:text-neutral-100"
                      : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-100"
                  }`}
                >
                  <span
                    className={
                      active
                        ? "text-neutral-900 dark:text-neutral-100"
                        : "text-neutral-400 dark:text-neutral-500"
                    }
                  >
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-neutral-200 p-3 dark:border-neutral-800">
        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">TJCAR · v0.2</p>
      </div>
    </aside>
  );
}
