import { cn } from "@/utils";
import { getColorSwatch } from "@/utils/carColor";

const iconStroke = {
  width: 14,
  height: 14,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function IconCalendar() {
  return (
    <svg {...iconStroke}>
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

export function IconGauge() {
  return (
    <svg {...iconStroke}>
      <path d="m12 14 4-4" />
      <path d="M3.34 19a10 10 0 1 1 17.32 0" />
    </svg>
  );
}

export function IconEngine() {
  return (
    <svg {...iconStroke}>
      <path d="M14 4h-4v3H7l-3 3v4h3v3h3v3h4v-3h3v-3h3v-4l-3-3h-3z" />
    </svg>
  );
}

export function IconTransmission() {
  return (
    <svg {...iconStroke}>
      <path d="M6 4v16M18 4v16M6 12h12" />
      <circle cx="6" cy="4" r="1.5" />
      <circle cx="6" cy="20" r="1.5" />
      <circle cx="18" cy="4" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
    </svg>
  );
}

export function IconSteering() {
  return (
    <svg {...iconStroke}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2" />
      <path d="M3.6 9h16.8M12 14v7" />
    </svg>
  );
}

export function ColorDot({ color, size = 12 }: { color: string; size?: number }) {
  const swatch = getColorSwatch(color);
  return (
    <span
      className={cn(
        "inline-block rounded-full",
        swatch.ring && "ring-1 ring-neutral-300",
      )}
      style={{ backgroundColor: swatch.bg, width: size, height: size }}
    />
  );
}
