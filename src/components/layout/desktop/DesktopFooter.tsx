"use client";

import { Link } from "@/i18n/navigation";
import Logo from "@/components/svg/logo.svg";
import { useTranslations } from "next-intl";
import { EXCHANGE_RATES, formatRate } from "@/lib/exchangeRates";
import type { ComponentType, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const FacebookIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
    <path d="M13.5 21v-7.5h2.55l.45-3H13.5V8.7c0-.87.27-1.47 1.53-1.47h1.62V4.56c-.28-.04-1.24-.12-2.36-.12-2.33 0-3.93 1.42-3.93 4.04v2.52H8v3h2.36V21h3.14Z" />
  </svg>
);

const InstagramIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden {...props}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const YoutubeIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
    <path d="M21.6 7.2a2.5 2.5 0 0 0-1.76-1.77C18.27 5 12 5 12 5s-6.27 0-7.84.43A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.76 1.77C5.73 19 12 19 12 19s6.27 0 7.84-.43a2.5 2.5 0 0 0 1.76-1.77A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8ZM10 15V9l5.2 3L10 15Z" />
  </svg>
);

const TiktokIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
    <path d="M16.5 3h-2.7v12.18a2.52 2.52 0 1 1-2.52-2.52c.21 0 .42.03.62.08V10a5.51 5.51 0 1 0 4.6 5.42V8.66a6.78 6.78 0 0 0 4.05 1.33V7.31a4.05 4.05 0 0 1-4.05-4.05V3Z" />
  </svg>
);

const DollarIcon = (props: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    {...props}
  >
    <line x1="12" y1="2" x2="12" y2="22" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const YenIcon = (props: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    {...props}
  >
    <path d="M6 3l6 9 6-9" />
    <line x1="12" y1="12" x2="12" y2="21" />
    <line x1="5" y1="14" x2="19" y2="14" />
    <line x1="5" y1="18" x2="19" y2="18" />
  </svg>
);

const SOCIAL_LINKS: ReadonlyArray<{
  href: string;
  key: "facebook" | "instagram" | "youtube" | "tiktok";
  Icon: ComponentType<IconProps>;
}> = [
  { href: "https://facebook.com", key: "facebook", Icon: FacebookIcon },
  { href: "https://instagram.com", key: "instagram", Icon: InstagramIcon },
  { href: "https://youtube.com", key: "youtube", Icon: YoutubeIcon },
  { href: "https://tiktok.com", key: "tiktok", Icon: TiktokIcon },
];

const CARS_LINKS = [
  { href: "/japan", key: "japan" as const },
  { href: "/korea", key: "korea" as const },
  { href: "/cars", key: "ready" as const },
  { href: "/report", key: "report" as const },
] as const;

const COMPANY_LINKS = [
  { href: "/about", key: "about" as const },
  { href: "/contact", key: "contact" as const },
  { href: "/privacy", key: "privacy" as const },
  { href: "/terms", key: "terms" as const },
] as const;

export default function DesktopFooter() {
  const t = useTranslations("footer");
  const tr = useTranslations("header.topbar");

  return (
    <footer className="bg-neutral-950 text-neutral-400">
      {/* Exchange-rate strip (moved from the header topbar) */}
      <div className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-3.5 lg:px-10">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
            {tr("rates.label")}
          </span>
          <div className="flex items-center gap-2">
            <DollarIcon className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-[13px] font-medium text-neutral-500">
              {tr("rates.usd")}
            </span>
            <span className="text-sm font-semibold tabular-nums text-white">
              {formatRate(EXCHANGE_RATES.USD.value)}
            </span>
            <span className="text-xs text-neutral-500">₮</span>
          </div>
          <span className="h-3.5 w-px bg-white/10" aria-hidden />
          <div className="flex items-center gap-2">
            <YenIcon className="h-3.5 w-3.5 text-rose-400" />
            <span className="text-[13px] font-medium text-neutral-500">
              {tr("rates.jpy")}
            </span>
            <span className="text-sm font-semibold tabular-nums text-white">
              {formatRate(EXCHANGE_RATES.JPY.value)}
            </span>
            <span className="text-xs text-neutral-500">₮</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-10">
        {/* Main row */}
        <div className="grid grid-cols-12 gap-8">
          {/* Brand + socials */}
          <div className="col-span-12 lg:col-span-5">
            <Link href="/" aria-label="TJ Car" className="inline-flex">
              <Logo className="h-8 w-auto [&_path:not(.cls-1)]:fill-white" />
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-neutral-400">
              {t("about")}
            </p>
            <ul className="mt-8 flex items-center gap-2.5">
              {SOCIAL_LINKS.map(({ href, key, Icon }) => (
                <li key={key}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t(`social.${key}`)}
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-neutral-400 transition-colors hover:border-white/40 hover:text-white"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Link columns */}
          <div className="col-span-12 grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7">
            <FooterColumn heading={t("cars.heading")}>
              {CARS_LINKS.map((item) => (
                <FooterLink key={item.href} href={item.href}>
                  {t(`cars.${item.key}`)}
                </FooterLink>
              ))}
            </FooterColumn>

            <FooterColumn heading={t("company.heading")}>
              {COMPANY_LINKS.map((item) => (
                <FooterLink key={`${item.href}-${item.key}`} href={item.href}>
                  {t(`company.${item.key}`)}
                </FooterLink>
              ))}
            </FooterColumn>

            <FooterColumn heading={t("contact.heading")}>
              <li className="text-sm text-neutral-400">{t("contact.phone")}</li>
              <li className="text-sm text-neutral-400">
                {t("contact.address")}
              </li>
              <li className="text-sm text-neutral-400">{t("contact.hours")}</li>
            </FooterColumn>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex items-center justify-between border-t border-white/10 pt-5 text-[13px] text-neutral-500">
          <p>
            &copy; {new Date().getFullYear()} TJ Car. {t("bottom.rights")}
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="transition-colors hover:text-white"
            >
              {t("bottom.privacy")}
            </Link>
            <Link href="/terms" className="transition-colors hover:text-white">
              {t("bottom.terms")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-white">{heading}</h3>
      <ul className="mt-4 space-y-3">{children}</ul>
    </div>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm text-neutral-400 transition-colors hover:text-white"
      >
        {children}
      </Link>
    </li>
  );
}
