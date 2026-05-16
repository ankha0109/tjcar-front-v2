"use client";

import { useEffect, useState } from "react";
import { Button, Drawer, Dropdown } from "antd";
import { useSession, signOut } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import Logo from "@/components/svg/logo.svg";
import { cn } from "@/utils";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";

type CustomerUser = {
  firstname: string;
  lastname: string;
  balance: number;
  currency: string;
};

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
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={cn(
        "group relative inline-flex items-center px-1 py-5 text-[13.5px] font-medium tracking-tight transition-colors",
        active
          ? "text-neutral-900"
          : "text-neutral-500 hover:text-neutral-900",
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          "pointer-events-none absolute inset-x-0 -bottom-px h-[2px] origin-left rounded-full bg-primary transition-transform duration-300 ease-out",
          active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
        )}
      />
    </Link>
  );
}

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

export default function Header() {
  const t = useTranslations("header");
  const locale = useLocale();
  const { data: session } = useSession();
  const user = session?.user as CustomerUser | undefined;

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const NAV_ITEMS = [
    { href: "/", label: t("nav.japan") },
    { href: "/korea", label: t("nav.korea") },
    { href: "/cars", label: t("nav.ready") },
    { href: "/report", label: t("nav.report") },
  ] as const;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Utility strip */}
      <div className="hidden md:block bg-neutral-950 text-neutral-300">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-4 text-[12px]">
          <div className="flex items-center gap-6">
            <a
              href="tel:+97670000000"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-white"
            >
              <PhoneIcon className="h-3 w-3" />
              <span className="tabular-nums">{t("phone")}</span>
            </a>
            <span className="inline-flex items-center gap-2 text-neutral-400">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              {t("hours")}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-neutral-500">
            <span>{t("regionsBadge.japan")}</span>
            <span className="text-neutral-700">·</span>
            <span>{t("regionsBadge.korea")}</span>
            <span className="text-neutral-700">·</span>
            <span>{t("regionsBadge.mongolia")}</span>
          </div>
        </div>
      </div>

      {/* Main header */}
      <header
        className={cn(
          "sticky top-0 z-50 w-full border-b backdrop-blur-xl transition-[background-color,border-color,box-shadow] duration-200",
          scrolled
            ? "border-neutral-200 bg-white/85 shadow-[0_1px_0_rgba(0,0,0,0.02),0_10px_30px_-18px_rgba(15,15,15,0.18)]"
            : "border-transparent bg-white/70",
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-10">
            <Link
              href="/"
              aria-label={t("menu.homeAria")}
              className="inline-flex items-center transition-opacity hover:opacity-80"
            >
              <Logo className="h-9 w-auto" />
            </Link>
            <nav className="hidden md:flex items-stretch gap-7">
              {NAV_ITEMS.map((item) => (
                <NavLink key={item.href} {...item} />
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <LanguageSwitcher />
            {session && user ? (
              <>
                <div className="hidden lg:flex items-center gap-2 rounded-full border border-neutral-200/80 bg-white py-1.5 pl-3 pr-3.5 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
                  <span className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-neutral-400">
                    {t("menu.balanceLabel")}
                  </span>
                  <span className="text-[13px] font-semibold tabular-nums tracking-tight text-neutral-900">
                    {formatBalance(user.balance, user.currency)}
                  </span>
                </div>
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
                            <div className="mt-0.5 text-[11px] tabular-nums text-neutral-500 lg:hidden">
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
                        label: <Link href="/dashboard/profile">{t("menu.profile")}</Link>,
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
                  <button
                    type="button"
                    aria-label={t("menu.open")}
                    className="inline-flex items-center gap-2 rounded-full border border-transparent py-1 pl-1 pr-2 transition-colors hover:border-neutral-200 hover:bg-white"
                  >
                    <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-[12px] font-semibold tracking-wide text-white ring-2 ring-white">
                      {getInitials(user)}
                      <span className="absolute -bottom-px -right-px h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
                    </span>
                    <span className="hidden text-[13px] font-medium tracking-tight text-neutral-800 sm:inline">
                      {user.firstname}
                    </span>
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={cn(
                        "text-neutral-400 transition-transform duration-200",
                        userOpen && "rotate-180",
                      )}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                </Dropdown>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="hidden h-9 items-center px-3 text-[13px] font-medium tracking-tight text-neutral-700 transition-colors hover:text-neutral-950 sm:inline-flex"
                >
                  {t("auth.signIn")}
                </Link>
                <Link href="/auth/register">
                  <Button
                    type="primary"
                    className="!h-9 !rounded-full !px-4 !text-[13px] !font-medium !tracking-tight !shadow-none"
                  >
                    {t("auth.signUp")}
                  </Button>
                </Link>
              </>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-neutral-700 transition-colors hover:bg-neutral-100 md:hidden"
              aria-label={t("menu.openMenu")}
            >
              <svg
                width="18"
                height="18"
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
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <Drawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        placement="right"
        size={320}
        closable={false}
        styles={{
          body: { padding: 0 },
          header: { padding: "16px 20px", borderBottom: "1px solid #f5f5f5" },
        }}
        title={
          <div className="flex items-center justify-between">
            <Logo className="h-8 w-auto" />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-neutral-600 transition-colors hover:bg-neutral-100"
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
            </button>
          </div>
        }
      >
        <div className="flex h-full flex-col">
          {session && user && (
            <div className="border-b border-neutral-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-[13px] font-semibold text-white">
                  {getInitials(user)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-semibold tracking-tight text-neutral-900">
                    {user.firstname} {user.lastname}
                  </div>
                  <div className="text-[11.5px] uppercase tracking-[0.12em] text-neutral-400">
                    {t("menu.balanceLabel")}
                  </div>
                  <div className="text-[13px] font-semibold tabular-nums tracking-tight text-neutral-900">
                    {formatBalance(user.balance, user.currency)}
                  </div>
                </div>
              </div>
            </div>
          )}

          <nav className="flex flex-col px-2 py-2">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between rounded-lg px-3 py-3 text-[14.5px] font-medium tracking-tight text-neutral-900 transition-colors hover:bg-neutral-50"
              >
                {item.label}
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-neutral-300"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            ))}
          </nav>

          <div className="mt-auto space-y-2 border-t border-neutral-100 px-5 py-4">
            {session && user ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="flex w-full items-center justify-center rounded-full bg-neutral-900 px-4 py-2.5 text-[13px] font-medium tracking-tight text-white transition-colors hover:bg-neutral-800"
                >
                  {t("menu.dashboard")}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    signOut({ callbackUrl: `/${locale}` });
                  }}
                  className="w-full rounded-full border border-neutral-200 px-4 py-2.5 text-[13px] font-medium tracking-tight text-neutral-700 transition-colors hover:bg-neutral-50"
                >
                  {t("menu.signout")}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex w-full items-center justify-center rounded-full border border-neutral-200 px-4 py-2.5 text-[13px] font-medium tracking-tight text-neutral-700 transition-colors hover:bg-neutral-50"
                >
                  {t("auth.signIn")}
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setMobileOpen(false)}
                  className="flex w-full items-center justify-center rounded-full bg-primary px-4 py-2.5 text-[13px] font-medium tracking-tight text-white transition-colors hover:opacity-90"
                >
                  {t("auth.signUp")}
                </Link>
              </>
            )}

            <a
              href="tel:+97670000000"
              className="mt-3 flex items-center justify-center gap-1.5 pt-2 text-[12.5px] text-neutral-500 transition-colors hover:text-neutral-900"
            >
              <PhoneIcon className="h-3 w-3" />
              <span className="tabular-nums">{t("phone")}</span>
            </a>
          </div>
        </div>
      </Drawer>
    </>
  );
}
