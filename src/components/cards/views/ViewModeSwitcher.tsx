"use client";

import { Button } from "antd";
import { cn } from "@/utils";
import type { ViewMode } from "./viewMode";

type Props = {
  value: ViewMode;
  onChange: (next: ViewMode) => void;
  labels: { grid: string; list: string; table: string };
};

export default function ViewModeSwitcher({ value, onChange, labels }: Props) {
  return (
    <div
      role="radiogroup"
      aria-label={labels.grid}
      className="inline-flex items-center gap-0.5 rounded-2xl border border-neutral-200/80 bg-neutral-50/70 p-1"
    >
      <ModeButton
        active={value === "grid"}
        onClick={() => onChange("grid")}
        label={labels.grid}
        icon={<GridIcon />}
      />
      <ModeButton
        active={value === "list"}
        onClick={() => onChange("list")}
        label={labels.list}
        icon={<ListIcon />}
      />
      <ModeButton
        active={value === "table"}
        onClick={() => onChange("table")}
        label={labels.table}
        icon={<TableIcon />}
      />
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <Button
      type="text"
      shape="circle"
      role="radio"
      aria-checked={active}
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "rounded-xl! focus:outline-none! focus-visible:ring-2! focus-visible:ring-primary/40!",
        active
          ? "bg-neutral-900! text-white! hover:bg-neutral-900!"
          : "text-neutral-500! hover:bg-white! hover:text-neutral-900!",
      )}
    >
      {icon}
    </Button>
  );
}

function GridIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="7" height="7" x="3" y="3" rx="1.5" />
      <rect width="7" height="7" x="14" y="3" rx="1.5" />
      <rect width="7" height="7" x="3" y="14" rx="1.5" />
      <rect width="7" height="7" x="14" y="14" rx="1.5" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="8" x2="21" y1="6" y2="6" />
      <line x1="8" x2="21" y1="12" y2="12" />
      <line x1="8" x2="21" y1="18" y2="18" />
      <circle cx="4" cy="6" r="1.5" />
      <circle cx="4" cy="12" r="1.5" />
      <circle cx="4" cy="18" r="1.5" />
    </svg>
  );
}

function TableIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <line x1="3" x2="21" y1="9" y2="9" />
      <line x1="3" x2="21" y1="15" y2="15" />
      <line x1="12" x2="12" y1="3" y2="21" />
    </svg>
  );
}
