import DashboardHeader from "@/components/dashboard/DashboardHeader";
import EmptyState from "@/components/dashboard/EmptyState";
import SectionMast from "@/components/dashboard/SectionMast";

export default function BidsPage() {
  return (
    <>
      <DashboardHeader
        title="Миний саналууд"
        description="Илгээсэн саналуудыг хянах, удирдах."
      />

      <section className="space-y-4">
        <SectionMast title="Идэвхтэй саналууд" />
        <EmptyState
          title="Идэвхтэй санал алга"
          description="Дуудлагаас машин сонгож саналаа илгээж эхлээрэй."
          cta={{ label: "Дуудлага үзэх", href: "/cars" }}
        />
      </section>

      <section className="space-y-4">
        <SectionMast title="Түүх" description="Өмнө илгээсэн саналууд." />
        <EmptyState
          title="Түүхэн санал алга"
          description="Илгээсэн санал бүр энд хадгалагдана."
        />
      </section>
    </>
  );
}
