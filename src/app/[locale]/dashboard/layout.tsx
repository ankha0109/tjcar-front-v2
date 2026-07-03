import Sidebar from "@/components/dashboard/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-1 flex-col bg-neutral-50 dark:bg-neutral-950">
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 p-6 lg:gap-8 lg:p-8">
        <Sidebar />
        <div className="min-w-0 flex-1 space-y-8">{children}</div>
      </div>
    </section>
  );
}
