"use client";

import { useEffect, useState } from "react";
import { Button, Drawer, Dropdown } from "antd";
import { useSession, signOut } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link, usePathname } from "@/i18n/navigation";
import Logo from "@/components/svg/logo.svg";
import { CarIcon, JapanIcon, KoreaIcon, ShieldIcon } from "@/components/icons";
import { cn } from "@/utils";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import ThemeToggle from "@/components/theme/ThemeToggle";
import type { Theme } from "@/lib/theme";
import BrandButton from "../ui/BrandButton";

type CustomerUser = {
  firstname: string;
  lastname: string;
  balance: number;
  currency: string;
};

const HeartIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const SparkleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 2l1.8 5.8L19.6 9.6 13.8 11.4 12 17.2 10.2 11.4 4.4 9.6 10.2 7.8z" />
    <path
      d="M19 14l.9 2.9L22.8 17.8l-2.9.9L19 21.6l-.9-2.9L15.2 17.8l2.9-.9z"
      opacity="0.6"
    />
  </svg>
);

const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const InfoIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const TrendingIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <polyline points="3 17 9 11 13 15 21 7" />
    <polyline points="14 7 21 7 21 14" />
  </svg>
);

function formatBalance(amount: number, currency: string) {
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(amount ?? 0);
  return `${formatted} ${currency || "₮"}`;
}

function getInitials(user: CustomerUser) {
  const f = user.firstname?.[0] ?? "";
  const l = user.lastname?.[0] ?? "";
  return `${f}${l}`.toUpperCase() || "U";
}

function NavLink({
  href,
  active,
  children,
  onClick,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "group relative inline-flex shrink-0 items-center gap-1.5 px-1 py-3 text-[13px] transition-colors",
        active
          ? "font-semibold text-neutral-900 dark:text-neutral-100"
          : "font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100",
      )}
    >
      {children}
      <span
        className={cn(
          "pointer-events-none absolute inset-x-0 -bottom-px h-[2px] origin-left rounded-full bg-neutral-900 transition-transform duration-300 ease-out dark:bg-neutral-100",
          active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
        )}
      />
    </Link>
  );
}

function UtilityButton({
  icon,
  label,
  onClick,
  href,
  badge,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
  badge?: number;
  className?: string;
}) {
  const inner = (
    <span
      className={cn(
        "group flex h-12 w-15 flex-col items-center justify-center gap-0.5 rounded-lg transition-colors",
        "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900",
        className,
      )}
    >
      <span className="relative inline-flex h-5 w-5 items-center justify-center">
        {icon}
        {badge && badge > 0 ? (
          <span className="absolute -right-1.5 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold leading-none text-white">
            {badge > 9 ? "9+" : badge}
          </span>
        ) : null}
      </span>
      <span className="text-[10.5px] font-medium leading-none">{label}</span>
    </span>
  );

  if (href) {
    return (
      <Link href={href} aria-label={label}>
        {inner}
      </Link>
    );
  }
  return (
    <Button
      type="text"
      onClick={onClick}
      aria-label={label}
      className="h-auto! p-0! border-0! bg-transparent! hover:bg-transparent!"
    >
      {inner}
    </Button>
  );
}

function DrawerSection({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-neutral-100 py-2 last:border-b-0 dark:border-neutral-900">
      {title ? (
        <div className="px-5 pb-1 pt-2 text-[10.5px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
          {title}
        </div>
      ) : null}
      <div className="px-2">{children}</div>
    </div>
  );
}

function DrawerLink({
  href,
  onClick,
  children,
  leading,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
  leading?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center justify-between rounded-lg px-3 py-2.5 text-[14px] font-medium text-neutral-900 transition-colors hover:bg-neutral-50 dark:text-neutral-100 dark:hover:bg-neutral-900"
    >
      <span className="flex items-center gap-2.5">
        {leading}
        {children}
      </span>
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-neutral-300 dark:text-neutral-600"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </Link>
  );
}

export default function Header({ theme }: { theme: Theme }) {
  const t = useTranslations("header");
  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const user = session?.user as CustomerUser | undefined;

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isPathActive = (href: string) => {
    const base = href.split("?")[0];
    if (base === "/") return pathname === "/";
    return pathname === base;
  };

  const isSortActive = (value: string) =>
    pathname === "/cars" && searchParams.get("sort") === value;

  const FEATURED = [
    {
      key: "trending",
      labelKey: "nav2.trending" as const,
      href: "/cars?sort=trending",
      sort: "trending",
      icon: <TrendingIcon className="h-3.5 w-3.5" />,
      dot: null,
    },
    {
      key: "new",
      labelKey: "nav2.new" as const,
      href: "/cars?sort=new",
      sort: "new",
      icon: null,
      dot: "green" as const,
    },
    {
      key: "ending",
      labelKey: "nav2.endingSoon" as const,
      href: "/cars?sort=ending",
      sort: "ending",
      icon: null,
      dot: "red" as const,
    },
  ];

  const MAIN_NAV: {
    key: string;
    label: string;
    href: string;
    Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  }[] = [
    { key: "japan", label: t("nav.japan"), href: "/japan", Icon: JapanIcon },
    { key: "korea", label: t("nav.korea"), href: "/korea", Icon: KoreaIcon },
    { key: "ready", label: t("nav.ready"), href: "/cars", Icon: CarIcon },
    {
      key: "report",
      label: t("nav.report"),
      href: "/report",
      Icon: ShieldIcon,
    },
    { key: "about", label: t("nav.about"), href: "/about", Icon: InfoIcon },
  ];

  const renderDot = (dot: "green" | "red" | null) => {
    if (dot === "red") {
      return (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-70" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
        </span>
      );
    }
    if (dot === "green") {
      return <span className="h-2 w-2 rounded-full bg-emerald-500" />;
    }
    return null;
  };

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full border-b backdrop-blur-xl transition-[background-color,border-color] duration-200",
          scrolled
            ? "border-neutral-200 bg-white/95 dark:border-neutral-800 dark:bg-neutral-950/95"
            : "border-neutral-100 bg-white dark:border-neutral-900 dark:bg-neutral-950",
        )}
      >
        {/* Row 1 — main */}
        <div className="mx-auto flex h-17 max-w-7xl items-center gap-3 px-4 md:gap-4">
          {/* Logo + language */}
          <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
            <Link
              href="/"
              aria-label={t("menu.homeAria")}
              className="inline-flex items-center transition-opacity hover:opacity-80"
            >
              <Logo className="h-8 w-auto" />
            </Link>
            <LanguageSwitcher />
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Primary CTA — auto.ru style green */}
          {/* <Link href="/cars" className="hidden sm:inline-flex">
            <button
              type="button"
              className={cn(
                "group inline-flex h-11 items-center gap-2 rounded-xl px-4 text-[13.5px] font-semibold leading-tight transition-all",
                "bg-emerald-500 text-white shadow-[0_1px_0_rgba(255,255,255,0.4)_inset,0_2px_8px_-2px_rgba(16,185,129,0.4)] hover:bg-emerald-600",
                "active:translate-y-px",
              )}
            >
              <PlusIcon className="h-4 w-4" />
              <span className="hidden whitespace-nowrap md:inline">
                {t("orderCar")}
              </span>
            </button>
          </Link> */}

          {/* Utility cluster — desktop only */}
          <div className="hidden items-center gap-0.5 lg:flex">
            <UtilityButton
              href="/dashboard/profile?ai=1"
              icon={
                <SparkleIcon className="h-4.5 w-4.5 text-violet-500 transition-transform group-hover:scale-110" />
              }
              label={t("tjcarAi")}
            />
            <UtilityButton
              href="/dashboard/tracking"
              icon={<HeartIcon className="h-4.5 w-4.5" />}
              label={t("wishlist")}
            />
          </div>

          {/* Theme */}
          <ThemeToggle theme={theme} />

          {/* User block */}
          {session && user ? (
            <Dropdown
              trigger={["click"]}
              placement="bottomRight"
              open={userOpen}
              onOpenChange={setUserOpen}
              menu={{
                items: [
                  {
                    key: "header",
                    type: "group",
                    label: (
                      <div className="px-1 py-1">
                        <div className="text-[13px] font-semibold text-neutral-900">
                          {user.firstname} {user.lastname}
                        </div>
                        <div className="mt-0.5 text-[11px] tabular-nums text-neutral-500">
                          {t("menu.balanceLabel")} ·{" "}
                          {formatBalance(user.balance, user.currency)}
                        </div>
                      </div>
                    ),
                  },
                  { type: "divider" },
                  {
                    key: "dashboard",
                    label: <Link href="/dashboard">{t("menu.dashboard")}</Link>,
                  },
                  {
                    key: "profile",
                    label: (
                      <Link href="/dashboard/profile">{t("menu.profile")}</Link>
                    ),
                  },
                  {
                    key: "bids",
                    label: <Link href="/dashboard/bids">{t("menu.bids")}</Link>,
                  },
                  { type: "divider" },
                  {
                    key: "signout",
                    label: t("menu.signout"),
                    danger: true,
                    onClick: () => signOut({ callbackUrl: `/${locale}` }),
                  },
                ],
              }}
            >
              <Button
                type="text"
                shape="circle"
                aria-label={t("menu.open")}
                className="relative! p-0! transition-transform! hover:scale-105! hover:bg-transparent!"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 text-[12px] font-semibold text-white ring-2 ring-white dark:bg-neutral-100 dark:text-neutral-900 dark:ring-neutral-950">
                  {getInitials(user)}
                </span>
                <span className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-neutral-950" />
              </Button>
            </Dropdown>
          ) : (
            <>
              <Link href="/auth/login" className="hidden md:inline-flex">
                <Button
                  type="text"
                  className="text-[13px]! font-semibold! text-neutral-900! dark:text-neutral-100!"
                >
                  {t("auth.signIn")}
                </Button>
              </Link>
              <Link href="/auth/register" className="hidden md:inline-flex">
                <BrandButton>{t("auth.signUp")}</BrandButton>
              </Link>
            </>
          )}

          {/* Mobile menu */}
          <Button
            type="text"
            shape="circle"
            onClick={() => setMobileOpen(true)}
            className="text-neutral-700! lg:hidden! dark:text-neutral-300!"
            aria-label={t("menu.openMenu")}
          >
            <svg
              width="20"
              height="20"
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
          </Button>
        </div>

        {/* Row 2 — categories (auto.ru-style icon nav) */}
        <nav aria-label="Categories" className="hidden md:block">
          <div className="mx-auto flex max-w-7xl items-center gap-5 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {/* Main routes with icons — auto.ru's primary affordance */}
            {MAIN_NAV.map((item) => (
              <NavLink
                key={item.key}
                href={item.href}
                active={isPathActive(item.href)}
              >
                <item.Icon
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-neutral-500 dark:text-neutral-400"
                />
                <span>{item.label}</span>
              </NavLink>
            ))}

            <span className="h-4 w-px shrink-0 bg-neutral-200 dark:bg-neutral-800" />

            {/* Featured tabs — secondary discovery */}
            {/* {FEATURED.map((tab) => (
              <NavLink
                key={tab.key}
                href={tab.href}
                active={isSortActive(tab.sort)}
              >
                {renderDot(tab.dot)}
                {tab.icon}
                <span>{t(tab.labelKey)}</span>
              </NavLink>
            ))} */}

            <div className="ml-auto flex shrink-0 items-center gap-1.5 py-2">
              <Link
                href="/how-it-works"
                className="inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium text-sky-600 transition-colors hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-950/40"
              >
                <InfoIcon className="h-3 w-3" />
                <span>{t("howItWorks")}</span>
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile drawer */}
      <Drawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        placement="right"
        size={340}
        closable={false}
        styles={{
          body: { padding: 0 },
          header: { padding: "16px 20px", borderBottom: "1px solid #f5f5f5" },
        }}
        title={
          <div className="flex items-center justify-between">
            <Logo className="h-8 w-auto" />
            <Button
              type="text"
              shape="circle"
              onClick={() => setMobileOpen(false)}
              className="text-neutral-600!"
              aria-label={t("menu.closeMenu")}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" x2="6" y1="6" y2="18" />
                <line x1="6" x2="18" y1="6" y2="18" />
              </svg>
            </Button>
          </div>
        }
      >
        <div className="flex h-full flex-col">
          {/* User block */}
          {session && user && (
            <div className="border-b border-neutral-100 px-5 py-4 dark:border-neutral-900">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-[13px] font-semibold text-white dark:bg-neutral-100 dark:text-neutral-900">
                  {getInitials(user)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-semibold text-neutral-900 dark:text-neutral-100">
                    {user.firstname} {user.lastname}
                  </div>
                  <div className="text-[11.5px] uppercase text-neutral-400 dark:text-neutral-500">
                    {t("menu.balanceLabel")}
                  </div>
                  <div className="text-[13px] font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
                    {formatBalance(user.balance, user.currency)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Order CTA — mobile prominent */}
          <div className="border-b border-neutral-100 px-5 py-3 dark:border-neutral-900">
            <Link
              href="/cars"
              onClick={() => setMobileOpen(false)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-[14px] font-semibold text-white shadow-[0_2px_8px_-2px_rgba(16,185,129,0.5)] transition-colors hover:bg-emerald-600"
            >
              <PlusIcon className="h-4 w-4" />
              {t("orderCar")}
            </Link>
          </div>

          {/* Nav sections */}
          <div className="flex-1 overflow-y-auto">
            <DrawerSection title={t("nav2.regions")}>
              {MAIN_NAV.map((item) => (
                <DrawerLink
                  key={item.key}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  leading={
                    <item.Icon
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 text-neutral-500 dark:text-neutral-400"
                    />
                  }
                >
                  {item.label}
                </DrawerLink>
              ))}
            </DrawerSection>

            <DrawerSection title={t("nav2.discover")}>
              {FEATURED.map((tab) => (
                <DrawerLink
                  key={tab.key}
                  href={tab.href}
                  onClick={() => setMobileOpen(false)}
                  leading={tab.dot ? renderDot(tab.dot) : tab.icon}
                >
                  {t(tab.labelKey)}
                </DrawerLink>
              ))}
            </DrawerSection>

            <DrawerSection>
              <DrawerLink
                href="/dashboard/tracking"
                onClick={() => setMobileOpen(false)}
                leading={<HeartIcon className="h-4 w-4 text-rose-500" />}
              >
                {t("wishlist")}
              </DrawerLink>
              <DrawerLink
                href="/dashboard/profile?ai=1"
                onClick={() => setMobileOpen(false)}
                leading={<SparkleIcon className="h-4 w-4 text-violet-500" />}
              >
                {t("tjcarAi")}
              </DrawerLink>
              <DrawerLink
                href="/how-it-works"
                onClick={() => setMobileOpen(false)}
                leading={<InfoIcon className="h-4 w-4 text-sky-500" />}
              >
                <span className="text-sky-600 dark:text-sky-400">
                  {t("howItWorks")}
                </span>
              </DrawerLink>
            </DrawerSection>
          </div>

          {/* Bottom actions */}
          <div className="space-y-2 border-t border-neutral-100 px-5 py-4 dark:border-neutral-900">
            {session && user ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="flex w-full items-center justify-center rounded-full bg-neutral-900 px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
                >
                  {t("menu.dashboard")}
                </Link>
                <Button
                  block
                  size="large"
                  onClick={() => {
                    setMobileOpen(false);
                    signOut({ callbackUrl: `/${locale}` });
                  }}
                  className="rounded-full! border-neutral-200! text-[13px]! font-medium! text-neutral-700! hover:bg-neutral-50! dark:border-neutral-800! dark:text-neutral-300! dark:hover:bg-neutral-900!"
                >
                  {t("menu.signout")}
                </Button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex w-full items-center justify-center rounded-full border border-neutral-200 px-4 py-2.5 text-[13px] font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900"
                >
                  {t("auth.signIn")}
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setMobileOpen(false)}
                  className="flex w-full items-center justify-center rounded-full bg-primary px-4 py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
                >
                  {t("auth.signUp")}
                </Link>
              </>
            )}
          </div>
        </div>
      </Drawer>
    </>
  );
}
