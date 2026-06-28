"use client";

import { Link } from "@/i18n/navigation";
import Logo from "@/components/svg/logo.svg";
import { useTranslations } from "next-intl";
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

const SERVICES_LINKS = [
  { href: "/dashboard", key: "dashboard" as const },
  { href: "/about", key: "about" as const },
  { href: "/auth/login", key: "signIn" as const },
  { href: "/auth/register", key: "signUp" as const },
] as const;

const COMPANY_LINKS = [
  { href: "/about", key: "about" as const },
  { href: "/contact", key: "contact" as const },
  { href: "/privacy", key: "privacy" as const },
  { href: "/terms", key: "terms" as const },
] as const;

export default function DesktopFooter() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-neutral-200 bg-white text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300">
      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-10">
        {/* Main row */}
        <div className="grid grid-cols-12 gap-8">
          {/* Brand + socials */}
          <div className="col-span-12 lg:col-span-4">
            <Link href="/" aria-label="TJ Car" className="inline-flex">
              <Logo className="h-8 w-auto" />
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
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
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-neutral-200 text-neutral-700 transition-colors hover:border-neutral-900 hover:text-neutral-900 dark:border-neutral-800 dark:text-neutral-300 dark:hover:border-neutral-100 dark:hover:text-neutral-100"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Link columns */}
          <div className="col-span-12 grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-8">
            <FooterColumn heading={t("cars.heading")}>
              {CARS_LINKS.map((item) => (
                <FooterLink key={item.href} href={item.href}>
                  {t(`cars.${item.key}`)}
                </FooterLink>
              ))}
            </FooterColumn>

            <FooterColumn heading={t("services.heading")}>
              {SERVICES_LINKS.map((item) => (
                <FooterLink key={`${item.href}-${item.key}`} href={item.href}>
                  {t(`services.${item.key}`)}
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
              <li className="text-sm text-neutral-600 dark:text-neutral-400">
                {t("contact.phone")}
              </li>
              <li className="text-sm text-neutral-600 dark:text-neutral-400">
                {t("contact.address")}
              </li>
              <li className="text-sm text-neutral-600 dark:text-neutral-400">
                {t("contact.hours")}
              </li>
            </FooterColumn>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex items-center justify-between border-t border-neutral-200 pt-5 text-[13px] text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
          <p>
            &copy; {new Date().getFullYear()} TJ Car. {t("bottom.rights")}
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="transition-colors hover:text-neutral-900 dark:hover:text-neutral-100"
            >
              {t("bottom.privacy")}
            </Link>
            <Link
              href="/terms"
              className="transition-colors hover:text-neutral-900 dark:hover:text-neutral-100"
            >
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
      <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        {heading}
      </h3>
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
        className="text-sm text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
      >
        {children}
      </Link>
    </li>
  );
}
