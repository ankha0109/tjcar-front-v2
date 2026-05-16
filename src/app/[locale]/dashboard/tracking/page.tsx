import DashboardHeader from "@/components/dashboard/DashboardHeader";
import EmptyState from "@/components/dashboard/EmptyState";
import SectionMast from "@/components/dashboard/SectionMast";

export default function TrackingPage() {
  return (
    <>
      <DashboardHeader
        title="Захиалсан машин"
        description="Хяналтад нэмсэн машинуудаа удирдах."
      />

      <section className="space-y-4">
        <SectionMast title="Хяналтад буй машинууд" />
        <EmptyState
          title="Захиалга алга"
          description="Дуудлагаас сонирхсон машинаа хяналтад нэмээрэй."
          cta={{ label: "Машин хайх", href: "/cars" }}
        />
      </section>

      <section className="space-y-4">
        <SectionMast
          title="Удахгүй дуусах"
          description="24 цагийн дотор дуусах гэж буй захиалгууд."
        />
        <EmptyState
          title="Дуусах гэж буй захиалга алга"
          description="Хяналт нэмсний дараа энд харагдана."
        />
      </section>
    </>
  );
}
