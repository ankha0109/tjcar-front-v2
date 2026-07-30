"use client";

import { ConfigProvider, Segmented } from "antd";
import { SEGMENTED_THEME } from "./segmentedTheme";
import type { ViewMode } from "./viewMode";

type Props = {
  value: ViewMode;
  onChange: (next: ViewMode) => void;
  labels: { grid: string; list: string; table: string };
};

export default function ViewModeSwitcher({ value, onChange, labels }: Props) {
  return (
    <ConfigProvider theme={SEGMENTED_THEME}>
      <Segmented<ViewMode>
        size="large"
        value={value}
        onChange={onChange}
        className="border border-neutral-200/80"
        classNames={{
          // Preflight renders the icons as blocks, so the label centres them
          // itself; px-2 keeps every tile a ~32px square.
          label: "flex items-center justify-center px-2",
        }}
        options={[
          {
            value: "grid",
            tooltip: labels.grid,
            label: <IconLabel icon={<GridIcon />} label={labels.grid} />,
          },
          {
            value: "list",
            tooltip: labels.list,
            label: <IconLabel icon={<ListIcon />} label={labels.list} />,
          },
          {
            value: "table",
            tooltip: labels.table,
            label: <IconLabel icon={<TableIcon />} label={labels.table} />,
          },
        ]}
      />
    </ConfigProvider>
  );
}

// Icon-only tiles would leave the radio input without an accessible name, so
// each one carries its label visually hidden.
function IconLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <>
      {icon}
      <span className="sr-only">{label}</span>
    </>
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
