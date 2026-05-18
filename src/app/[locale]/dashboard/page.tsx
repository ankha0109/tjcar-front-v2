import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/auth";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import EmptyState from "@/components/dashboard/EmptyState";
import SectionMast from "@/components/dashboard/SectionMast";
import StatCard from "@/components/dashboard/StatCard";
import { Link } from "@/i18n/navigation";

export default async function DashboardIndex({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard.home");

  const session = await auth();
  const firstName = session?.user?.name?.trim().split(" ")[0] || t("guestName");

  // TODO: wire APIs for personal counts (bids/reports/tracking)
  const stats = {
    bids: { count: 0, pending: 0 },
    reports: { count: 0 },
    tracking: { count: 0, endingToday: 0 },
  };

  const QUICK_ACTIONS = [
    {
      title: t("quickActions.newBid.title"),
      description: t("quickActions.newBid.description"),
      href: "/cars",
    },
    {
      title: t("quickActions.track.title"),
      description: t("quickActions.track.description"),
      href: "/cars",
    },
    {
      title: t("quickActions.report.title"),
      description: t("quickActions.report.description"),
      href: "/reports/check",
    },
  ];

  return (
    <>
      <DashboardHeader
        title={t("greeting", { name: firstName })}
        description={t("subtitle")}
      />

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            label={t("stats.bidsLabel")}
            value={stats.bids.count}
            hint={t("stats.bidsHint", { count: stats.bids.pending })}
            href="/dashboard/bids"
          />
          <StatCard
            label={t("stats.reportsLabel")}
            value={stats.reports.count}
            hint={t("stats.reportsHint")}
            href="/dashboard/reports"
          />
          <StatCard
            label={t("stats.trackingLabel")}
            value={stats.tracking.count}
            hint={
              stats.tracking.endingToday > 0
                ? t("stats.trackingHintEnding", { count: stats.tracking.endingToday })
                : t("stats.trackingHintActive")
            }
            href="/dashboard/tracking"
          />
        </section>

        <section className="space-y-4">
          <SectionMast
            title={t("recent.title")}
            description={t("recent.description")}
          />
          <EmptyState
            title={t("recent.emptyTitle")}
            description={t("recent.emptyDescription")}
            cta={{ label: t("recent.emptyCta"), href: "/cars" }}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            }
          />
        </section>

        <section className="space-y-4">
          <SectionMast
            title={t("quick.title")}
            description={t("quick.description")}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.title}
                href={action.href}
                className="group flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-5 transition-colors hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700 dark:hover:bg-neutral-800"
              >
                <div>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {action.title}
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                    {action.description}
                  </p>
                </div>
                <span className="text-neutral-400 transition-transform group-hover:translate-x-0.5 group-hover:text-neutral-900 dark:text-neutral-500 dark:group-hover:text-neutral-100">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </section>
    </>
  );
}
