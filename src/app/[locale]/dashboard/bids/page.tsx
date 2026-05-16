import { getTranslations, setRequestLocale } from "next-intl/server";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import EmptyState from "@/components/dashboard/EmptyState";
import SectionMast from "@/components/dashboard/SectionMast";

export default async function BidsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard.bids");

  return (
    <>
      <DashboardHeader
        title={t("title")}
        description={t("description")}
      />

      <section className="space-y-4">
        <SectionMast title={t("activeHeading")} />
        <EmptyState
          title={t("activeEmptyTitle")}
          description={t("activeEmptyDescription")}
          cta={{ label: t("activeEmptyCta"), href: "/cars" }}
        />
      </section>

      <section className="space-y-4">
        <SectionMast title={t("historyHeading")} description={t("historySubheading")} />
        <EmptyState
          title={t("historyEmptyTitle")}
          description={t("historyEmptyDescription")}
        />
      </section>
    </>
  );
}
