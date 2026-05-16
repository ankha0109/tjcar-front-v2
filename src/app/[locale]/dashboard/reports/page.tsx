import DashboardHeader from "@/components/dashboard/DashboardHeader";
import EmptyState from "@/components/dashboard/EmptyState";
import SectionMast from "@/components/dashboard/SectionMast";

export default function ReportsPage() {
  return (
    <>
      <DashboardHeader
        title="Миний репортууд"
        description="VIN-ээр авсан осол, түүхийн репортууд."
      />

      <section className="space-y-4">
        <SectionMast title="Үүсгэсэн репортууд" />
        <EmptyState
          title="Репорт үүсгээгүй байна"
          description="VIN дугаар оруулж осол, түүхийн шалгалт хийнэ үү."
          cta={{ label: "Шинэ репорт", href: "/reports/check" }}
        />
      </section>
    </>
  );
}
