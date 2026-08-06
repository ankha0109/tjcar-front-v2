"use client";

import { Link } from "@/i18n/navigation";
import Logo from "@/components/svg/logo.svg";
import { useTranslations } from "next-intl";
import ExchangeRateList from "@/components/layout/ExchangeRateList";
import { FACEBOOK_URL, INSTAGRAM_URL } from "@/lib/contact";
import type { ComponentType, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const FacebookIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
    <path d="M13.5 21v-7.5h2.55l.45-3H13.5V8.7c0-.87.27-1.47 1.53-1.47h1.62V4.56c-.28-.04-1.24-.12-2.36-.12-2.33 0-3.93 1.42-3.93 4.04v2.52H8v3h2.36V21h3.14Z" />
  </svg>
);

const InstagramIcon = (props: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    aria-hidden
    {...props}
  >
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

/** Only the accounts the company actually runs — no placeholder profiles. */
const SOCIAL_LINKS: ReadonlyArray<{
  href: string;
  key: "facebook" | "instagram";
  Icon: ComponentType<IconProps>;
}> = [
  {
    href: FACEBOOK_URL,
    key: "facebook",
    Icon: FacebookIcon,
  },
  {
    href: INSTAGRAM_URL,
    key: "instagram",
    Icon: InstagramIcon,
  },
];

const CARS_LINKS = [
  { href: "/japan", key: "japan" as const },
  { href: "/korea", key: "korea" as const },
  { href: "/garage", key: "ready" as const },
  { href: "/report", key: "report" as const },
] as const;

const COMPANY_LINKS = [
  { href: "/about", key: "about" as const },
  { href: "/posts", key: "posts" as const },
  { href: "/contact", key: "contact" as const },
  { href: "/terms", key: "terms" as const },
] as const;

export default function DesktopFooter() {
  const t = useTranslations("footer");

  return (
    <footer className="bg-neutral-950 text-neutral-400">
      <div className="mx-auto w-full max-w-7xl px-4 py-14 lg:px-6">
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
            {/* Renders nothing when /config is unreachable, so the divider has
                to come with it rather than sit in the column above. */}
            <ExchangeRateList
              variant="footer"
              className="mt-8 border-t border-white/10 pt-6"
            />
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
              <li>
                <a
                  href="tel:+97675115888"
                  className="text-sm text-neutral-400 transition-colors hover:text-white"
                >
                  {t("contact.phone")}
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@tjcar.mn"
                  className="text-sm text-neutral-400 transition-colors hover:text-white"
                >
                  {t("contact.email")}
                </a>
              </li>
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
            {/* The colour has to sit on the anchor: antd's reset paints a bare
                <a> blue and that beats the inherited `text-neutral-500`. */}
            <Link
              href="/terms"
              className="text-neutral-500 transition-colors hover:text-white"
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
