"use client";

import { useEffect, useState } from "react";
import { Button, Drawer, Dropdown, Tooltip } from "antd";
import { useSession, signOut } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
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

// TODO: Replace with Mongolbank API hook later
const EXCHANGE_RATES = {
  USD: { value: 3450, updatedAt: "2026-05-25T10:00:00Z" },
  JPY: { value: 23.1, updatedAt: "2026-05-25T10:00:00Z" },
};

const CONTACT_PHONE_RAW = "+97670000000";
const CONTACT_PHONE_DISPLAY = "+976 7000-0000";

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

function formatRate(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
  }).format(value);
}

function formatUpdatedTime(iso: string, locale: string) {
  try {
    return new Date(iso).toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
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

function UtilityPill({
  icon,
  label,
  onClick,
  href,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
  badge?: number;
}) {
  const inner = (
    <span
      className={cn(
        "group inline-flex h-8 items-center gap-1.5 rounded-full px-2 transition-colors",
        "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/15 dark:focus-visible:ring-neutral-100/15",
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
      <span className="hidden text-sm font-medium leading-none md:inline">
        {label}
      </span>
    </span>
  );

  if (href) {
    return (
      <Link href={href} aria-label={label} title={label}>
        {inner}
      </Link>
    );
  }
  return (
    <Button type="text" onClick={onClick} aria-label={label} title={label}>
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

function RateBadge({
  CurrencyIcon,
  code,
  value,
  updatedAt,
  locale,
  updatedLabelTemplate,
  iconClass,
}: {
  CurrencyIcon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  code: string;
  value: number;
  updatedAt: string;
  locale: string;
  updatedLabelTemplate: (time: string) => string;
  iconClass: string;
}) {
  const updatedTime = formatUpdatedTime(updatedAt, locale);
  return (
    <Tooltip
      title={updatedLabelTemplate(updatedTime)}
      placement="bottom"
      mouseEnterDelay={0.15}
    >
      <span className="inline-flex shrink-0 items-center gap-1.5 text-[11.5px] font-medium tabular-nums text-neutral-600 dark:text-neutral-400">
        <CurrencyIcon className={cn("h-3 w-3", iconClass)} aria-hidden="true" />
        <span className="font-semibold text-neutral-700 dark:text-neutral-300">
          {code}
        </span>
        <span>{formatRate(value)}</span>
        <span className="text-neutral-400 dark:text-neutral-500">₮</span>
      </span>
    </Tooltip>
  );
}

function TopBarLink({
  href,
  label,
  ariaLabel,
  icon,
  external,
}: {
  href: string;
  label: React.ReactNode;
  ariaLabel: string;
  icon: React.ReactNode;
  external?: boolean;
}) {
  const className =
    "group inline-flex shrink-0 items-center gap-1.5 rounded-md px-1.5 py-1 text-[11.5px] font-medium text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100";
  const inner = (
    <>
      <span className="inline-flex h-3.5 w-3.5 items-center justify-center text-neutral-500 transition-colors group-hover:text-neutral-800 dark:text-neutral-500 dark:group-hover:text-neutral-200">
        {icon}
      </span>
      <span className="tabular-nums">{label}</span>
    </>
  );

  if (external) {
    return (
      <a href={href} aria-label={ariaLabel} className={className}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} aria-label={ariaLabel} className={className}>
      {inner}
    </Link>
  );
}

export default function Header({ theme }: { theme: Theme }) {
  const t = useTranslations("header");
  const locale = useLocale();
  const pathname = usePathname();
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

  const FEATURED = [
    {
      key: "ending",
      labelKey: "nav.about" as const,
      href: "/about",
      sort: "ending",
    },
    {
      key: "ending",
      labelKey: "howItWorks" as const,
      href: "/how-it-works",
      sort: "ending",
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

  const updatedLabel = (time: string) =>
    t("topbar.rates.updated", { time: time || "—" });

  const hoursTooltip = (
    <div className="space-y-0.5 py-0.5 text-[12px] leading-relaxed">
      <div>{t("topbar.hours.schedule.weekdays")}</div>
      <div>{t("topbar.hours.schedule.saturday")}</div>
      <div className="text-neutral-300">
        {t("topbar.hours.schedule.sunday")}
      </div>
    </div>
  );

  return (
    <>
      {/* Row 0 — Topbar (rates + contact) — non-sticky, scrolls away */}
      <div className="border-b border-neutral-100 bg-neutral-50 dark:border-neutral-900 dark:bg-neutral-900/40">
        <div className="mx-auto flex h-9 max-w-7xl items-center gap-3 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:gap-6">
          {/* Left — exchange rates */}
          <div className="flex shrink-0 items-center gap-3 md:gap-4">
            <RateBadge
              CurrencyIcon={DollarIcon}
              code={t("topbar.rates.usd")}
              value={EXCHANGE_RATES.USD.value}
              updatedAt={EXCHANGE_RATES.USD.updatedAt}
              locale={locale}
              updatedLabelTemplate={updatedLabel}
              iconClass="text-emerald-600 dark:text-emerald-400"
            />
            <span
              aria-hidden="true"
              className="h-3 w-px shrink-0 bg-neutral-200 dark:bg-neutral-800"
            />
            <RateBadge
              CurrencyIcon={YenIcon}
              code={t("topbar.rates.jpy")}
              value={EXCHANGE_RATES.JPY.value}
              updatedAt={EXCHANGE_RATES.JPY.updatedAt}
              locale={locale}
              updatedLabelTemplate={updatedLabel}
              iconClass="text-rose-500 dark:text-rose-400"
            />
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right — contact + hours */}
          <div className="flex shrink-0 items-center gap-1 md:gap-2">
            <TopBarLink
              href={`tel:${CONTACT_PHONE_RAW}`}
              ariaLabel={t("topbar.phone.aria")}
              icon={<PhoneIcon className="h-3.5 w-3.5" />}
              label={CONTACT_PHONE_DISPLAY}
              external
            />
            <span
              aria-hidden="true"
              className="hidden h-3 w-px shrink-0 bg-neutral-200 dark:bg-neutral-800 sm:block"
            />
            <Tooltip
              title={hoursTooltip}
              placement="bottom"
              mouseEnterDelay={0.15}
            >
              <span className="hidden shrink-0 items-center gap-1.5 rounded-md px-1.5 py-1 text-[11.5px] font-medium text-neutral-600 dark:text-neutral-400 sm:inline-flex">
                <ClockIcon className="h-3.5 w-3.5 text-neutral-500 dark:text-neutral-500" />
                <span className="tabular-nums">{t("topbar.hours.short")}</span>
              </span>
            </Tooltip>
            <span
              aria-hidden="true"
              className="hidden h-3 w-px shrink-0 bg-neutral-200 dark:bg-neutral-800 md:block"
            />
            {/* TODO: replace href with /contact once that route exists */}
            <TopBarLink
              href="/about"
              ariaLabel={t("topbar.contact.aria")}
              icon={<MailIcon className="h-3.5 w-3.5" />}
              label={
                <span className="hidden md:inline">
                  {t("topbar.contact.label")}
                </span>
              }
            />
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      <header
        className={cn(
          "sticky top-0 z-50 w-full border-b backdrop-blur-xl transition-[background-color,border-color,box-shadow] duration-200",
          scrolled
            ? "border-neutral-200 bg-white/35 dark:border-neutral-800 dark:bg-neutral-950/95"
            : "border-transparent bg-white shadow-none dark:bg-neutral-950",
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

          {/* Mobile menu */}
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

        {/* Row 1 bottom divider — inside container padding */}
        <div className="mx-auto max-w-7xl px-4">
          <div className="border-b border-neutral-100 dark:border-neutral-900" />
        </div>

        {/* Row 2 — secondary nav (h-10, md+) */}
        <div className="hidden border-b border-neutral-100 dark:border-neutral-900 md:block">
          <nav
            aria-label="Secondary"
            className="mx-auto flex h-10 max-w-7xl items-center gap-5 px-4"
          >
            {FEATURED.map((tab) => {
              const active = isPathActive(tab.href);
              return (
                <Link
                  key={tab.key}
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md py-1 text-sm font-medium transition-colors",
                    active
                      ? "text-neutral-900 dark:text-neutral-100"
                      : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-500 dark:hover:text-neutral-200",
                  )}
                >
                  {t(tab.labelKey)}
                </Link>
              );
            })}
            <div className="ml-auto flex items-center gap-1">
              <Link
                href="/dashboard/profile?ai=1"
                aria-label={t("tjcarAi")}
                title={t("tjcarAi")}
                className={cn(
                  "group relative inline-flex h-8 items-center gap-1.5 overflow-hidden rounded-full px-2.5 transition-all",
                  "bg-gradient-to-r from-violet-50 via-fuchsia-50 to-violet-50 ring-1 ring-violet-200/70 hover:ring-violet-300",
                  "dark:from-violet-950/40 dark:via-fuchsia-950/40 dark:to-violet-950/40 dark:ring-violet-800/60 dark:hover:ring-violet-700",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400",
                )}
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full dark:via-white/10"
                />
                <SparkleIcon className="relative h-4 w-4 text-violet-600 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110 dark:text-violet-300" />
                <span className="relative hidden bg-gradient-to-r from-violet-700 to-fuchsia-600 bg-clip-text text-sm font-semibold leading-none text-transparent dark:from-violet-200 dark:to-fuchsia-200 md:inline">
                  {t("tjcarAi")}
                </span>
                <span
                  aria-hidden="true"
                  className="relative ml-0.5 hidden h-1.5 w-1.5 animate-pulse rounded-full bg-fuchsia-500 shadow-[0_0_6px_rgba(217,70,239,0.6)] md:inline-block"
                />
              </Link>
              <UtilityPill
                href="/dashboard/tracking"
                icon={<HeartIcon className="h-4 w-4" />}
                label={t("wishlist")}
              />
            </div>
          </nav>
        </div>
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
                    {formatBalance(user.balance, user.currency)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rates card */}
          <div className="border-b border-neutral-100 px-5 py-3 dark:border-neutral-900">
            <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
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

          {/* Order CTA — mobile prominent */}
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
