"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Drawer, Dropdown } from "antd";
import { useSession, signOut } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import Logo from "@/components/svg/logo.svg";
import { CarIcon, JapanIcon, KoreaIcon, ShieldIcon } from "@/components/icons";
import { cn } from "@/utils";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import ThemeToggle from "@/components/theme/ThemeToggle";
import type { Theme } from "@/lib/theme";
import BrandButton from "@/components/ui/BrandButton";
import CompareDropdown from "@/components/layout/desktop/CompareDropdown";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { useWishlist } from "@/hooks/useWishlist";
import { EXCHANGE_RATES, formatRate } from "@/lib/exchangeRates";

type CustomerUser = {
  firstname: string;
  lastname: string;
  balance: number;
  currency: string;
};

const CONTACT_PHONE_RAW = "+97675115888";
const CONTACT_PHONE_DISPLAY = "+976 7511-5888";

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

const CompareIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M3 7h13l-3-3" />
    <path d="M21 17H8l3 3" />
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

const PhoneIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z" />
  </svg>
);

const ClockIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const MailIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const DollarIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <line x1="12" y1="2" x2="12" y2="22" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const YenIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M6 3l6 9 6-9" />
    <line x1="12" y1="12" x2="12" y2="21" />
    <line x1="5" y1="14" x2="19" y2="14" />
    <line x1="5" y1="18" x2="19" y2="18" />
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
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 dark:focus-visible:ring-neutral-100/20",
        active
          ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
          : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-100",
      )}
    >
      {children}
    </Link>
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
        <div className="px-5 pb-1 pt-2 text-[10.5px] font-semibold uppercase text-neutral-400 dark:text-neutral-500">
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
  external,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
  leading?: React.ReactNode;
  external?: boolean;
}) {
  const className =
    "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-50 dark:text-neutral-100 dark:hover:bg-neutral-900";
  const chevron = (
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
  );
  const inner = (
    <>
      <span className="flex items-center gap-2.5">
        {leading}
        {children}
      </span>
      {chevron}
    </>
  );

  if (external) {
    return (
      <a href={href} onClick={onClick} className={className}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} onClick={onClick} className={className}>
      {inner}
    </Link>
  );
}

export default function DesktopHeader({ theme }: { theme: Theme }) {
  const t = useTranslations("header");
  const locale = useLocale();
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user as CustomerUser | undefined;
  const { balance: liveBalance, currency: liveCurrency } = useWalletBalance();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const { count: wishlistCount } = useWishlist();

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

  const FEATURED = [
    {
      key: "about",
      labelKey: "nav.about" as const,
      href: "/about",
    },
    {
      key: "howItWorks",
      labelKey: "howItWorks" as const,
      href: "/how-it-works",
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
  ];

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full border-b backdrop-blur-xl transition-[background-color,border-color,box-shadow] duration-200",
          scrolled
            ? "border-neutral-200 bg-white/35 dark:border-neutral-800 dark:bg-neutral-950/95"
            : "border-neutral-100 bg-white shadow-none dark:bg-neutral-950",
        )}
      >
        {/* Row 1 — primary (h-16) */}
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-1.5 px-4 md:gap-2">
          {/* Logo */}
          <Link
            href="/"
            aria-label={t("menu.homeAria")}
            className="inline-flex shrink-0 items-center rounded-md transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 dark:focus-visible:ring-neutral-100/20"
          >
            <Logo className="h-10 w-auto" />
          </Link>

          {/* Main nav — desktop (lg+) */}
          <nav
            aria-label="Primary"
            className="ml-1 hidden items-center gap-0.5 lg:flex"
          >
            {MAIN_NAV.map((item) => {
              const active = isPathActive(item.href);
              return (
                <NavLink key={item.key} href={item.href} active={active}>
                  <item.Icon
                    aria-hidden="true"
                    className={cn(
                      "h-4 w-4 shrink-0",
                      active ? "" : "text-neutral-500 dark:text-neutral-400",
                    )}
                  />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Wishlist */}
          <Link
            href="/wishlist"
            aria-label={t("wishlist")}
            title={t("wishlist")}
            className="inline-flex shrink-0"
          >
            <Badge count={wishlistCount} size="small">
              <Button type="text" shape="circle" aria-label={t("wishlist")}>
                <HeartIcon className="h-5 w-5 text-neutral-600 dark:text-neutral-300" />
              </Button>
            </Badge>
          </Link>

          {/* Compare */}
          <CompareDropdown />

          {/* Language */}
          <LanguageSwitcher />

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
                        <div className="text-sm font-semibold text-neutral-900">
                          {user.firstname} {user.lastname}
                        </div>
                        <div className="mt-0.5 text-[11px] tabular-nums text-neutral-500">
                          {t("menu.balanceLabel")} ·{" "}
                          {formatBalance(liveBalance, liveCurrency)}
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
              <Button type="text" shape="circle" aria-label={t("menu.open")}>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 text-[12px] font-semibold text-white ring-2 ring-white dark:bg-neutral-100 dark:text-neutral-900 dark:ring-neutral-950">
                  {getInitials(user)}
                </span>
                <span className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-neutral-950" />
              </Button>
            </Dropdown>
          ) : (
            <>
              <Link href="/auth/login" className="hidden md:inline-flex">
                <Button type="text">{t("auth.signIn")}</Button>
              </Link>
              <Link href="/auth/register" className="hidden md:inline-flex">
                <BrandButton>{t("auth.signUp")}</BrandButton>
              </Link>
            </>
          )}

          {/* Tablet menu (md ↔ lg) */}
          <Button
            type="text"
            shape="circle"
            onClick={() => setMobileOpen(true)}
            className="lg:hidden"
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

      </header>

      {/* Tablet drawer (md ↔ lg) */}
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
            <div className="border-b border-neutral-200 px-5 py-4 dark:border-neutral-900">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white dark:bg-neutral-100 dark:text-neutral-900">
                  {getInitials(user)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {user.firstname} {user.lastname}
                  </div>
                  <div className="text-[11.5px] uppercase text-neutral-400 dark:text-neutral-500">
                    {t("menu.balanceLabel")}
                  </div>
                  <div className="text-sm font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
                    {formatBalance(liveBalance, liveCurrency)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rates card */}
          <div className="border-b border-neutral-100 px-5 py-3 dark:border-neutral-900">
            <div className="mb-1.5 text-[10.5px] font-semibold uppercase text-neutral-400 dark:text-neutral-500">
              {t("topbar.rates.label")}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <DollarIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[12px] font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
                  {t("topbar.rates.usd")} {formatRate(EXCHANGE_RATES.USD.value)}
                </span>
                <span className="text-[11px] text-neutral-400">₮</span>
              </div>
              <span className="h-3 w-px bg-neutral-200 dark:bg-neutral-800" />
              <div className="flex items-center gap-1.5">
                <YenIcon className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400" />
                <span className="text-[12px] font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
                  {t("topbar.rates.jpy")} {formatRate(EXCHANGE_RATES.JPY.value)}
                </span>
                <span className="text-[11px] text-neutral-400">₮</span>
              </div>
            </div>
          </div>

          {/* Order CTA */}
          <div className="border-b border-neutral-100 px-5 py-3 dark:border-neutral-900">
            <Link
              href="/cars"
              onClick={() => setMobileOpen(false)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_2px_8px_-2px_rgba(16,185,129,0.5)] transition-colors hover:bg-emerald-600"
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
                >
                  {t(tab.labelKey)}
                </DrawerLink>
              ))}
            </DrawerSection>

            <DrawerSection title={t("nav2.info")}>
              <DrawerLink
                href={`tel:${CONTACT_PHONE_RAW}`}
                onClick={() => setMobileOpen(false)}
                leading={<PhoneIcon className="h-4 w-4 text-emerald-500" />}
                external
              >
                {CONTACT_PHONE_DISPLAY}
              </DrawerLink>
              <DrawerLink
                href="/about"
                onClick={() => setMobileOpen(false)}
                leading={<MailIcon className="h-4 w-4 text-sky-500" />}
              >
                {t("topbar.contact.label")}
              </DrawerLink>
              <div className="flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-sm">
                <ClockIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <div className="flex-1 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                  <div>{t("topbar.hours.schedule.weekdays")}</div>
                  <div>{t("topbar.hours.schedule.saturday")}</div>
                  <div className="text-neutral-400 dark:text-neutral-500">
                    {t("topbar.hours.schedule.sunday")}
                  </div>
                </div>
              </div>
            </DrawerSection>

            <DrawerSection>
              <DrawerLink
                href="/wishlist"
                onClick={() => setMobileOpen(false)}
                leading={<HeartIcon className="h-4 w-4 text-rose-500" />}
              >
                {t("wishlist")}
              </DrawerLink>
              <DrawerLink
                href="/compare"
                onClick={() => setMobileOpen(false)}
                leading={<CompareIcon className="h-4 w-4 text-neutral-500" />}
              >
                {t("compare")}
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
                  className="flex w-full items-center justify-center rounded-full bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
                >
                  {t("menu.dashboard")}
                </Link>
                <Button
                  block
                  size="large"
                  shape="round"
                  onClick={() => {
                    setMobileOpen(false);
                    signOut({ callbackUrl: `/${locale}` });
                  }}
                >
                  {t("menu.signout")}
                </Button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex w-full items-center justify-center rounded-full border border-neutral-200 px-4 py-2.5 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900"
                >
                  {t("auth.signIn")}
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setMobileOpen(false)}
                  className="flex w-full items-center justify-center rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
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
