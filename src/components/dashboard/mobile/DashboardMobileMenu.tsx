"use client";

import { useState } from "react";
import { Switch } from "antd";
import { signOut } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import WalletTopUpDrawer from "@/components/wallet/WalletTopUpDrawer";
import { useCompare } from "@/hooks/useCompare";
import { useDashboardCounts } from "@/hooks/useDashboardCounts";
import { useThemeToggle } from "@/hooks/useThemeToggle";
import { useWishlist } from "@/hooks/useWishlist";
import { usePathname, useRouter } from "@/i18n/navigation";
import { CONTACT_PHONE_DISPLAY, CONTACT_PHONE_RAW } from "@/lib/contact";
import MobileAccountCard from "./MobileAccountCard";
import MobileMenuGroup from "./MobileMenuGroup";
import MobileMenuRow from "./MobileMenuRow";
import {
  CompareIcon,
  DocumentIcon,
  GavelIcon,
  HeartIcon,
  MailIcon,
  MoonIcon,
  PhoneIcon,
  PowerIcon,
  TruckIcon,
  UserIcon,
} from "./icons";

/** Every row's icon is the same size; only the colour differs. */
const ICON = "h-[18px] w-[18px]";

type Props = {
  /** From `?topup=1` — deep links land straight in the top-up flow. */
  openTopUp?: boolean;
};

/**
 * `/dashboard` on a phone: the account screen a banking app would open with.
 *
 * The desktop tree (balance card, stat grid, recent bids, cars in transit) is
 * reached through the sidebar, which phones never get — so instead of stacking
 * four sections a customer has to scroll past, the numbers ride along as
 * badges on the rows that lead to them.
 */
export default function DashboardMobileMenu({ openTopUp = false }: Props) {
  const t = useTranslations("dashboard");
  const tHeader = useTranslations("header");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [topUpOpen, setTopUpOpen] = useState(openTopUp);
  const counts = useDashboardCounts();
  const { count: wishlistCount } = useWishlist();
  const { count: compareCount } = useCompare();
  const {
    theme,
    isPending: isThemePending,
    toggle: toggleTheme,
  } = useThemeToggle();

  // Closing drops `?topup=1`, otherwise a refresh — or the back button — would
  // reopen the drawer. Same contract WalletSection keeps on desktop.
  const closeTopUp = () => {
    setTopUpOpen(false);
    if (openTopUp) router.replace(pathname);
  };

  return (
    // A plain wrapper, not a fragment: the layout's content column applies
    // `space-y-8` to its element children, and a fragment would flatten every
    // card into that spacing.
    <div>
      <MobileAccountCard onTopUp={() => setTopUpOpen(true)} />

      <MobileMenuGroup title={t("mobile.groupActivity")}>
        <MobileMenuRow
          icon={<GavelIcon className={`${ICON} text-neutral-500`} />}
          label={t("bids.title")}
          badge={counts.bids}
          href="/dashboard/bids"
        />
        <MobileMenuRow
          icon={<TruckIcon className={`${ICON} text-neutral-500`} />}
          label={t("orders.title")}
          badge={counts.orders}
          href="/dashboard/orders"
        />
        <MobileMenuRow
          icon={<DocumentIcon className={`${ICON} text-neutral-500`} />}
          label={t("reports.title")}
          badge={counts.reports}
          href="/dashboard/reports"
        />
      </MobileMenuGroup>

      <MobileMenuGroup title={t("mobile.groupLists")}>
        <MobileMenuRow
          icon={<HeartIcon className={`${ICON} text-rose-500`} />}
          label={tHeader("wishlist")}
          badge={wishlistCount}
          href="/wishlist"
        />
        <MobileMenuRow
          icon={<CompareIcon className={`${ICON} text-neutral-500`} />}
          label={tHeader("compare")}
          badge={compareCount}
          href="/compare"
        />
      </MobileMenuGroup>

      <MobileMenuGroup title={t("mobile.groupAccount")}>
        <MobileMenuRow
          icon={<UserIcon className={`${ICON} text-neutral-500`} />}
          label={t("profile.title")}
          href="/dashboard/profile"
        />
        <MobileMenuRow
          icon={<MoonIcon className={`${ICON} text-indigo-500`} />}
          label={tHeader("theme.darkMode")}
          trailing={
            <Switch
              size="small"
              checked={theme === "dark"}
              loading={isThemePending}
              onChange={toggleTheme}
              aria-label={
                theme === "dark"
                  ? tHeader("theme.switchToLight")
                  : tHeader("theme.switchToDark")
              }
            />
          }
        />
      </MobileMenuGroup>

      <MobileMenuGroup title={t("mobile.groupSupport")}>
        <MobileMenuRow
          icon={<PhoneIcon className={`${ICON} text-emerald-500`} />}
          label={CONTACT_PHONE_DISPLAY}
          external={`tel:${CONTACT_PHONE_RAW}`}
        />
        <MobileMenuRow
          icon={<MailIcon className={`${ICON} text-sky-500`} />}
          label={tHeader("topbar.contact.label")}
          href="/about"
        />
      </MobileMenuGroup>

      <MobileMenuGroup>
        <MobileMenuRow
          icon={<PowerIcon className={ICON} />}
          label={tHeader("menu.signout")}
          danger
          onClick={() => signOut({ callbackUrl: `/${locale}` })}
        />
      </MobileMenuGroup>

      <WalletTopUpDrawer open={topUpOpen} onClose={closeTopUp} />
    </div>
  );
}
