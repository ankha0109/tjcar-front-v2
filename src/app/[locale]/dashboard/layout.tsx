import Sidebar from "@/components/dashboard/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="bg-neutral-50">
      <div className="mx-auto max-w-7xl flex h-full ">
        <Sidebar />
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-8 p-6 lg:p-8">{children}</div>
        </div>
      </div>
    </section>
  );
}
