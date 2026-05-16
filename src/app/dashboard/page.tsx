import { auth } from "@/auth";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import EmptyState from "@/components/dashboard/EmptyState";
import SectionMast from "@/components/dashboard/SectionMast";
import StatCard from "@/components/dashboard/StatCard";
import Link from "next/link";

const QUICK_ACTIONS = [
  {
    title: "Шинэ санал",
    description: "Дуудлагад оролцох",
    href: "/cars",
  },
  {
    title: "Машин хянах",
    description: "Захиалгад нэмэх",
    href: "/cars",
  },
  {
    title: "Осол шалгах",
    description: "VIN-ээр репорт авах",
    href: "/reports/check",
  },
];

export default async function DashboardIndex() {
  const session = await auth();
  const firstName = session?.user?.name?.trim().split(" ")[0] || "Зочин";

  // TODO: wire APIs for personal counts (bids/reports/tracking)
  const stats = {
    bids: { count: 0, pending: 0 },
    reports: { count: 0 },
    tracking: { count: 0, endingToday: 0 },
  };

  return (
    <>
      <DashboardHeader
        title={`Сайн уу, ${firstName}`}
        description="Таны дуудлагын идэвх нэг дороос."
      />

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            label="Илгээсэн саналууд"
            value={stats.bids.count}
            hint={`${stats.bids.pending} хүлээгдэж байна`}
            href="/dashboard/bids"
          />
          <StatCard
            label="Миний репортууд"
            value={stats.reports.count}
            hint="нийт үүсгэсэн"
            href="/dashboard/reports"
          />
          <StatCard
            label="Захиалсан машин"
            value={stats.tracking.count}
            hint={
              stats.tracking.endingToday > 0
                ? `${stats.tracking.endingToday} өнөөдөр дуусна`
                : "хяналтад буй"
            }
            href="/dashboard/tracking"
          />
        </section>

        <section className="space-y-4">
          <SectionMast
            title="Сүүлийн идэвх"
            description="Таны хамгийн сүүлийн үйлдлүүд энд харагдана."
          />
          <EmptyState
            title="Идэвх алга"
            description="Дуудлагаас машин сонгож, эхний саналаа илгээгээрэй."
            cta={{ label: "Машин хайх", href: "/cars" }}
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
            title="Шуурхай үйлдэл"
            description="Хамгийн их хэрэглэгддэг үйлдлүүд."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.title}
                href={action.href}
                className="group flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-5 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
              >
                <div>
                  <p className="text-sm font-semibold text-neutral-900">
                    {action.title}
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {action.description}
                  </p>
                </div>
                <span className="text-neutral-400 transition-transform group-hover:translate-x-0.5 group-hover:text-neutral-900">
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
