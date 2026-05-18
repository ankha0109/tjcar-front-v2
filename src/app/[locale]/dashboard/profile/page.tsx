import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/auth";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import EmptyState from "@/components/dashboard/EmptyState";
import SectionMast from "@/components/dashboard/SectionMast";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard.profile");

  const session = await auth();
  const user = session?.user;

  return (
    <>
      <DashboardHeader
        title={t("title")}
        description={t("description")}
      />

      <section className="space-y-4">
        <SectionMast title={t("basicHeading")} />
        <div className="rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <Field label={t("name")} value={user?.name || "—"} />
          <Field label={t("email")} value={user?.email || "—"} mono />
          <Field label={t("userId")} value={user?.id || "—"} mono />
          <Field label={t("createdAt")} value="—" last />
        </div>
      </section>

      <section className="space-y-4">
        <SectionMast
          title={t("settingsHeading")}
          description={t("settingsSubheading")}
        />
        <EmptyState
          title={t("settingsComingTitle")}
          description={t("settingsComingDescription")}
        />
      </section>
    </>
  );
}

function Field({
  label,
  value,
  mono,
  last,
}: {
  label: string;
  value: string;
  mono?: boolean;
  last?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:gap-6 ${
        last ? "" : "border-b border-neutral-200 dark:border-neutral-800"
      }`}
    >
      <dt className="w-full max-w-[180px] text-sm font-medium text-neutral-600 dark:text-neutral-400">
        {label}
      </dt>
      <dd
        className={`text-sm text-neutral-900 dark:text-neutral-100 ${mono ? "font-mono" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}
