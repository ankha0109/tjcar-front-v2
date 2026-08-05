import Sidebar from "@/components/dashboard/Sidebar";
import { getDevice } from "@/lib/device";
import { cn } from "@/utils";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isMobile = (await getDevice()) === "mobile";

  return (
    <section className="flex flex-1 flex-col bg-neutral-50 dark:bg-neutral-950">
      <div
        className={cn(
          "mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4 lg:gap-8 lg:px-6",
          isMobile ? "py-4" : "py-6 lg:py-8",
        )}
      >
        {/* Phones get the grouped menu on /dashboard itself, so the sidebar is
            not rendered at all — skipping it keeps its client bundle off the
            phone instead of hiding it behind a breakpoint. */}
        {!isMobile && <Sidebar />}
        <div className="min-w-0 flex-1 space-y-8">{children}</div>
      </div>
    </section>
  );
}
