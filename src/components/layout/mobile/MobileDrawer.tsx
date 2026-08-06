"use client";

import { Button, Drawer, Switch } from "antd";
import { useSession, signOut } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CarIcon, JapanIcon, KoreaIcon, ShieldIcon } from "@/components/icons";
import ExchangeRateList from "@/components/layout/ExchangeRateList";
import { CONTACT_PHONE_DISPLAY, CONTACT_PHONE_RAW } from "@/lib/contact";
import { useCompare } from "@/hooks/useCompare";
import { useThemeToggle } from "@/hooks/useThemeToggle";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { useWishlist } from "@/hooks/useWishlist";

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

const MoonIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

function formatBalance(amount: number, currency: string) {
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount ?? 0)} ${currency || "₮"}`;
}

function getInitials(user: CustomerUser) {
  const f = user.firstname?.[0] ?? "";
  const l = user.lastname?.[0] ?? "";
  return `${f}${l}`.toUpperCase() || "U";
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

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function MobileDrawer({ open, onClose }: Props) {
  const t = useTranslations("header");
  const locale = useLocale();
  const { data: session } = useSession();
  const user = session?.user as CustomerUser | undefined;
  const { balance: liveBalance, currency: liveCurrency } = useWalletBalance();
  const { count: wishlistCount } = useWishlist();
  const { count: compareCount } = useCompare();
  const {
    theme,
    isPending: isThemePending,
    toggle: onToggleTheme,
  } = useThemeToggle();

  const MAIN_NAV: {
    key: string;
    label: string;
    href: string;
    Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  }[] = [
    { key: "japan", label: t("nav.japan"), href: "/japan", Icon: JapanIcon },
    { key: "korea", label: t("nav.korea"), href: "/korea", Icon: KoreaIcon },
    { key: "ready", label: t("nav.ready"), href: "/garage", Icon: CarIcon },
    {
      key: "report",
      label: t("nav.report"),
      href: "/report",
      Icon: ShieldIcon,
    },
  ];

  // The phone shell has no footer, so the drawer is the only way to /terms.
  const FEATURED = [
    { key: "about", labelKey: "nav.about" as const, href: "/about" },
    { key: "posts", labelKey: "nav.posts" as const, href: "/posts" },
    { key: "terms", labelKey: "nav.terms" as const, href: "/terms" },
  ];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      placement="right"
      size={340}
      closable={false}
      styles={{ body: { padding: 0 } }}
    >
      <div className="relative flex h-full flex-col">
        <Button
          type="text"
          shape="circle"
          onClick={onClose}
          aria-label={t("menu.closeMenu")}
          className="absolute right-2 top-2 z-10 bg-white/60 backdrop-blur-sm hover:bg-white! dark:bg-neutral-950/60 dark:hover:bg-neutral-900!"
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
                <Link
                  href="/dashboard?topup=1"
                  onClick={onClose}
                  className="block text-neutral-900 dark:text-neutral-100"
                >
                  <div className="text-[11.5px] uppercase text-neutral-400 dark:text-neutral-500">
                    {t("menu.balanceLabel")}
                  </div>
                  <div className="flex flex-wrap items-baseline gap-x-2 text-sm font-semibold">
                    {formatBalance(liveBalance, liveCurrency)}
                    <span className="text-[11px] font-medium text-primary">
                      {t("menu.topUp")}
                    </span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          <ExchangeRateList
            variant="menu"
            className="border-b border-neutral-100 px-5 py-3 dark:border-neutral-900"
          />
          <DrawerSection title={t("nav2.regions")}>
            {MAIN_NAV.map((item) => (
              <DrawerLink
                key={item.key}
                href={item.href}
                onClick={onClose}
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
              <DrawerLink key={tab.key} href={tab.href} onClick={onClose}>
                {t(tab.labelKey)}
              </DrawerLink>
            ))}
          </DrawerSection>

          <DrawerSection>
            <DrawerLink
              href="/wishlist"
              onClick={onClose}
              leading={<HeartIcon className="h-4 w-4 text-rose-500" />}
            >
              <span className="flex items-center gap-2">
                {t("wishlist")}
                {wishlistCount > 0 && (
                  <span className="rounded-full bg-rose-500 px-1.5 text-[11px] font-semibold leading-5 text-white">
                    {wishlistCount}
                  </span>
                )}
              </span>
            </DrawerLink>
            <DrawerLink
              href="/compare"
              onClick={onClose}
              leading={<CompareIcon className="h-4 w-4 text-neutral-500" />}
            >
              <span className="flex items-center gap-2">
                {t("compare")}
                {compareCount > 0 && (
                  <span className="rounded-full bg-neutral-900 px-1.5 text-[11px] font-semibold leading-5 text-white dark:bg-neutral-100 dark:text-neutral-900">
                    {compareCount}
                  </span>
                )}
              </span>
            </DrawerLink>
            <div className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-900 dark:text-neutral-100">
              <span className="flex items-center gap-2.5">
                <MoonIcon className="h-4 w-4 text-indigo-500" />
                {t("theme.darkMode")}
              </span>
              <Switch
                size="small"
                checked={theme === "dark"}
                loading={isThemePending}
                onChange={onToggleTheme}
                aria-label={
                  theme === "dark"
                    ? t("theme.switchToLight")
                    : t("theme.switchToDark")
                }
              />
            </div>
          </DrawerSection>

          <DrawerSection title={t("nav2.info")}>
            <DrawerLink
              href={`tel:${CONTACT_PHONE_RAW}`}
              onClick={onClose}
              leading={<PhoneIcon className="h-4 w-4 text-emerald-500" />}
              external
            >
              {CONTACT_PHONE_DISPLAY}
            </DrawerLink>
            <DrawerLink
              href="/contact"
              onClick={onClose}
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
        </div>

        <div className="space-y-2 border-t border-neutral-100 px-5 py-4 dark:border-neutral-900">
          {session && user ? (
            <>
              <Link
                href="/dashboard"
                onClick={onClose}
                className="flex w-full items-center justify-center rounded-full bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
              >
                {t("menu.dashboard")}
              </Link>
              <Button
                block
                size="large"
                shape="round"
                onClick={() => {
                  onClose();
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
                onClick={onClose}
                className="flex w-full items-center justify-center rounded-full border border-neutral-200 px-4 py-2.5 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900"
              >
                {t("auth.signIn")}
              </Link>
              <Link
                href="/auth/register"
                onClick={onClose}
                className="flex w-full items-center justify-center rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                {t("auth.signUp")}
              </Link>
            </>
          )}
        </div>
      </div>
    </Drawer>
  );
}
