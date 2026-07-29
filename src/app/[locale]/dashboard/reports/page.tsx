import { getTranslations, setRequestLocale } from "next-intl/server";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import SectionMast from "@/components/dashboard/SectionMast";
import ReportList from "@/components/report/ReportList";

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
      <DashboardHeader title={t("title")} description={t("description")} />

      <section className="space-y-4">
        <SectionMast title={t("listHeading")} />
        {/* Client component: reports settle from unpaid → paid → downloadable
            while the page is open, so the list refetches rather than being
            rendered once on the server. It also owns the empty state. */}
        <ReportList />
      </section>
    </>
  );
}
