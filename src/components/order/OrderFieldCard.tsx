"use client";

import type { ReactNode } from "react";

export type OrderField = {
  label: string;
  value: ReactNode;
};

type Props = {
  title: string;
  fields: OrderField[];
};

/**
 * A titled label/value card that filters its own empty rows and disappears
 * entirely when nothing is left.
 *
 * This is what keeps an admin-entered order (12 keys, no auction data) from
 * rendering a grid of labels with blanks beside them. Emptiness is decided per
 * field here rather than by each caller.
 */
export default function OrderFieldCard({ title, fields }: Props) {
  const rows = fields.filter(
    (f) => f.value !== null && f.value !== undefined && f.value !== "",
  );

  if (rows.length === 0) return null;

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <h3 className="mb-1 text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
        {title}
      </h3>
      <div>
        {rows.map((f) => (
          <div
            key={f.label}
            className="flex items-start justify-between gap-4 border-b border-neutral-100 py-2 last:border-0 dark:border-neutral-800"
          >
            <span className="shrink-0 text-[13px] text-neutral-500">
              {f.label}
            </span>
            <span className="text-right text-[13px] text-neutral-900 dark:text-neutral-100">
              {f.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
