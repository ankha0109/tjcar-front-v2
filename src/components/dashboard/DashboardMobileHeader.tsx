import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import MobileHeader from "@/components/layout/mobile/MobileHeader";
import { Link } from "@/i18n/navigation";
import { getDevice } from "@/lib/device";

type Props = {
  /** First path segment under `/dashboard` — `"bids"`, `"orders"`, … */
  section: string;
  /** Present on a `[id]` detail route. */
  id?: string;
};

/**
 * The mobile top bar for every `/dashboard/<section>` page.
 *
 * Next rejects an optional catch-all inside a parallel slot when a static
 * route of the same specificity already exists, so each dashboard route owns a
 * thin slot file and they all delegate here — the titles and back targets stay
 * in one place instead of being copied seven times.
 *
 * A section with no case still gets a working bar: back arrow, no title.
 */
export default async function DashboardMobileHeader({ section, id }: Props) {
  const device = await getDevice();
  if (device !== "mobile") return null;

  const t = await getTranslations("dashboard");

  let title: string | undefined;
  let backHref = "/dashboard";
  let right: ReactNode = null;

  switch (section) {
    case "bids":
      title = id ? t("bidDetail.title") : t("bids.title");
      if (id) backHref = "/dashboard/bids";
      break;
    case "orders":
      title = id ? t("orderDetail.title") : t("orders.title");
      if (id) backHref = "/dashboard/orders";
      break;
    case "reports":
      title = t("reports.title");
      // The desktop page renders this as a labelled button next to its <h1>;
      // on a phone the <h1> is this header, so the action comes with it.
      right = <NewReportAction label={t("reports.newReport")} />;
      break;
    case "profile":
      title = t("profile.title");
      break;
  }

  return <MobileHeader back={{ href: backHref }} title={title} right={right} />;
}

function NewReportAction({ label }: { label: string }) {
  return (
    <Link
      href="/report"
      aria-label={label}
      className="-mr-1 inline-flex h-9 w-9 items-center justify-center rounded-full text-neutral-700 active:bg-neutral-100 dark:text-neutral-200 dark:active:bg-neutral-900"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    </Link>
  );
}
