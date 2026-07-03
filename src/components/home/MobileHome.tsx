"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { JapanIcon, KoreaIcon } from "@/components/icons";
import { cn } from "@/utils";

const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
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

const AboutIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M3 21h18" />
    <path d="M5 21V7l7-4 7 4v14" />
    <path d="M9 9h.01" />
    <path d="M9 13h.01" />
    <path d="M9 17h.01" />
    <path d="M15 9h.01" />
    <path d="M15 13h.01" />
    <path d="M15 17h.01" />
  </svg>
);

const CarTile = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
    <circle cx="7" cy="17" r="2" />
    <path d="M9 17h6" />
    <circle cx="17" cy="17" r="2" />
  </svg>
);

const ShieldTile = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M20 13c0 5-3.5 7.5-7.7 8.95a1 1 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

type CategoryProps = {
  href: string;
  label: string;
  countLabel: string;
  iconBg: string;
  iconColor: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  /** Render `Icon` as a full-bleed flag chip instead of a tinted mono icon. */
  flag?: boolean;
};

function CategoryTile({
  href,
  label,
  countLabel,
  iconBg,
  iconColor,
  Icon,
  flag = false,
}: CategoryProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-2xl border border-neutral-200/80 bg-white p-4 transition-colors active:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:active:bg-neutral-800"
    >
      {flag ? (
        <Icon className="h-12 w-12" />
      ) : (
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-2xl",
            iconBg,
          )}
        >
          <Icon className={cn("h-7 w-7", iconColor)} />
        </div>
      )}
      <div className="mt-7 text-[15px] font-semibold leading-tight text-neutral-900 dark:text-neutral-100">
        {label}
      </div>
      {countLabel ? (
        <div className="mt-1 text-[12px] leading-snug text-neutral-500 dark:text-neutral-400">
          {countLabel}
        </div>
      ) : (
        <div className="mt-1 h-[15px]" />
      )}
    </Link>
  );
}

export default function MobileHome() {
  const t = useTranslations("mobile.home");
  const { data: session } = useSession();
  const user = session?.user as
    | { firstname?: string; lastname?: string }
    | undefined;

  const greeting = user
    ? t("greeting", { name: `${user.firstname ?? ""}`.trim() || "🚗" })
    : t("greetingGuest");

  return (
    <div className="flex flex-col gap-5 px-4 pb-6 pt-3">
      {/* Categories grid */}
      <section className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <CategoryTile
            href="/japan"
            label={t("categories.japan")}
            countLabel={t("categories.japanHint")}
            iconBg=""
            iconColor=""
            Icon={JapanIcon}
            flag
          />
          <CategoryTile
            href="/korea"
            label={t("categories.korea")}
            countLabel={t("categories.koreaHint")}
            iconBg=""
            iconColor=""
            Icon={KoreaIcon}
            flag
          />
          <CategoryTile
            href="/cars"
            label={t("categories.ready")}
            countLabel={t("categories.readyHint")}
            iconBg="bg-amber-50 dark:bg-amber-950/40"
            iconColor="text-amber-500 dark:text-amber-400"
            Icon={CarTile}
          />
          <CategoryTile
            href="/report"
            label={t("categories.report")}
            countLabel={t("categories.reportHint")}
            iconBg="bg-violet-50 dark:bg-violet-950/40"
            iconColor="text-violet-500 dark:text-violet-400"
            Icon={ShieldTile}
          />
        </div>
      </section>

      {/* Quick links row */}
      <section className="flex flex-col gap-3">
        <h3 className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-100">
          {t("quickTitle")}
        </h3>
        <div className="flex flex-col divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200/80 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900">
          <QuickLink
            href="/how-it-works"
            icon={<InfoIcon className="h-4 w-4 text-sky-500" />}
            label={t("quick.howItWorks")}
            hint={t("quick.howItWorksHint")}
          />
          <QuickLink
            href="/about"
            icon={<AboutIcon className="h-4 w-4 text-emerald-500" />}
            label={t("quick.about")}
            hint={t("quick.aboutHint")}
          />
        </div>
      </section>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  label,
  hint,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  hint: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 transition-colors active:bg-neutral-50 dark:active:bg-neutral-800"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-50 dark:bg-neutral-800">
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[14px] font-semibold leading-tight text-neutral-900 dark:text-neutral-100">
          {label}
        </span>
        <span className="text-[12px] text-neutral-500 dark:text-neutral-400">
          {hint}
        </span>
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
