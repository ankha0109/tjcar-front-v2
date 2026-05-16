import { auth } from "@/auth";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import EmptyState from "@/components/dashboard/EmptyState";
import SectionMast from "@/components/dashboard/SectionMast";

export default async function ProfilePage() {
  const session = await auth();
  const user = session?.user;

  return (
    <>
      <DashboardHeader
        title="Профайл"
        description="Хувийн мэдээлэл болон тохиргоо."
      />

      <section className="space-y-4">
        <SectionMast title="Үндсэн мэдээлэл" />
        <div className="rounded-lg border border-neutral-200 bg-white">
          <Field label="Нэр" value={user?.name || "—"} />
          <Field label="И-мэйл" value={user?.email || "—"} mono />
          <Field label="Хэрэглэгчийн ID" value={user?.id || "—"} mono />
          <Field label="Үүсгэгдсэн" value="—" last />
        </div>
      </section>

      <section className="space-y-4">
        <SectionMast
          title="Тохиргоо"
          description="Мэдэгдэл, валют, хэлний тохиргоо."
        />
        <EmptyState
          title="Тохиргооны хэсэг бэлэн болж байна"
          description="Удахгүй хэрэглэгдэх боломжтой болно."
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
        last ? "" : "border-b border-neutral-200"
      }`}
    >
      <dt className="w-full max-w-[180px] text-sm font-medium text-neutral-600">
        {label}
      </dt>
      <dd
        className={`text-sm text-neutral-900 ${mono ? "font-mono" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}
