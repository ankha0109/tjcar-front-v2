import Link from "next/link";
import { ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  cta?: { label: string; href: string };
  icon?: ReactNode;
};

export default function EmptyState({ title, description, cta, icon }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-white px-6 py-14 text-center">
      {icon && (
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
          {icon}
        </div>
      )}
      <p className="text-sm font-medium text-neutral-900">{title}</p>
      {description && (
        <p className="mt-1 max-w-md text-sm text-neutral-500">{description}</p>
      )}
      {cta && (
        <Link
          href={cta.href}
          className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-neutral-900 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
        >
          {cta.label}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </Link>
      )}
    </div>
  );
}
