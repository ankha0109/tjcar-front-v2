import Link from "next/link";

type Props = {
  label: string;
  value: string | number;
  hint?: string;
  href?: string;
  icon?: React.ReactNode;
};

export default function StatCard({ label, value, hint, href, icon }: Props) {
  const content = (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-neutral-600">{label}</p>
        {icon && <span className="text-neutral-400">{icon}</span>}
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
    </>
  );

  const classes =
    "block rounded-lg border border-neutral-200 bg-white p-5 transition-colors";

  if (href) {
    return (
      <Link href={href} className={`${classes} hover:border-neutral-300 hover:bg-neutral-50`}>
        {content}
      </Link>
    );
  }
  return <div className={classes}>{content}</div>;
}
