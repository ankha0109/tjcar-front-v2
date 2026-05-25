"use client";

import { Link } from "@/i18n/navigation";
import Logo from "@/components/svg/logo.svg";
import { useTranslations } from "next-intl";

const NAV_LINKS = [
  { href: "/japan", key: "cars.japan" as const },
  { href: "/korea", key: "cars.korea" as const },
  { href: "/cars", key: "cars.ready" as const },
  { href: "/report", key: "cars.report" as const },
  { href: "/about", key: "services.about" as const },
] as const;

export default function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="hidden border-t border-neutral-200 bg-white text-neutral-700 md:block dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        {/* Main row */}
        <div className="grid grid-cols-12 gap-8 py-14">
          {/* Brand block */}
          <div className="col-span-12 md:col-span-7 lg:col-span-8">
            <Link href="/" aria-label="TJ Car" className="inline-flex">
              <Logo className="h-8 w-auto" />
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              {t("about")}
            </p>
          </div>

          {/* Nav block */}
          <nav
            aria-label="Footer"
            className="col-span-12 md:col-span-5 md:border-l md:border-neutral-200 md:pl-10 lg:col-span-4 dark:md:border-neutral-800"
          >
            <ul className="space-y-3.5 text-sm">
              {NAV_LINKS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-neutral-700 transition-colors hover:text-primary dark:text-neutral-300 dark:hover:text-primary"
                  >
                    {t(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between border-t border-neutral-200 py-5 text-[13px] text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
          <p>
            &copy; {new Date().getFullYear()} TJ Car. {t("bottom.rights")}
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="#"
              className="transition-colors hover:text-neutral-900 dark:hover:text-neutral-100"
            >
              {t("bottom.privacy")}
            </Link>
            <Link
              href="#"
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
