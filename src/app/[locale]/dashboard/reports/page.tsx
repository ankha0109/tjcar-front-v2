import { getTranslations, setRequestLocale } from "next-intl/server";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ReportList from "@/components/report/ReportList";
import { Link } from "@/i18n/navigation";

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard.reports");

  return (
    <>
      <DashboardHeader
        title={t("title")}
        action={
          <Link
            href="/report"
            className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3.5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
          >
            <svg
              width="15"
              height="15"
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
            {t("newReport")}
          </Link>
        }
      />

      {/* Client component: reports settle from unpaid → paid → downloadable
          while the page is open, so the list refetches rather than being
          rendered once on the server. It owns the tabs and the empty states. */}
      <ReportList />
    </>
  );
}
