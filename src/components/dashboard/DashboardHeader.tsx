import { getDevice } from "@/lib/device";

type Props = {
  title: string;
  action?: React.ReactNode;
};

/**
 * The page title, on desktop only.
 *
 * On phones the very same title is rendered by the `@mobileHeader/dashboard`
 * slot inside the fixed bar, so repeating it here would ship two headings and
 * burn a chunk of a small screen. `action` goes with it: the mobile header
 * carries its own (the reports page's "new report" plus).
 */
export default async function DashboardHeader({ title, action }: Props) {
  const device = await getDevice();
  if (device === "mobile") return null;

  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{title}</h1>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}
