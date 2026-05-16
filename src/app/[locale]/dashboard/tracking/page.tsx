import { getTranslations, setRequestLocale } from "next-intl/server";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import EmptyState from "@/components/dashboard/EmptyState";
import SectionMast from "@/components/dashboard/SectionMast";

export default async function TrackingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard.tracking");

  return (
    <>
      <DashboardHeader
        title={t("title")}
        description={t("description")}
      />

      <section className="space-y-4">
        <SectionMast title={t("listHeading")} />
        <EmptyState
          title={t("listEmptyTitle")}
          description={t("listEmptyDescription")}
          cta={{ label: t("listEmptyCta"), href: "/cars" }}
        />
      </section>

      <section className="space-y-4">
        <SectionMast
          title={t("endingHeading")}
          description={t("endingSubheading")}
        />
        <EmptyState
          title={t("endingEmptyTitle")}
          description={t("endingEmptyDescription")}
        />
      </section>
    </>
  );
}
