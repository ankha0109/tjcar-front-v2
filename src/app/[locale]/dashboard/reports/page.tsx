import { getTranslations, setRequestLocale } from "next-intl/server";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import EmptyState from "@/components/dashboard/EmptyState";
import SectionMast from "@/components/dashboard/SectionMast";

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
        description={t("description")}
      />

      <section className="space-y-4">
        <SectionMast title={t("listHeading")} />
        <EmptyState
          title={t("emptyTitle")}
          description={t("emptyDescription")}
          cta={{ label: t("emptyCta"), href: "/reports/check" }}
        />
      </section>
    </>
  );
}
