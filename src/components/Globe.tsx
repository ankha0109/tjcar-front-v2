import { JapanIcon, KoreaIcon, MongoliaIcon } from "@/components/icons";

const GLOBE_W = 480;
const GLOBE_R = 220;
const C = GLOBE_W / 2;
const SPACING = 7.4;

type Blob = { cx: number; cy: number; rx: number; ry: number; w: number };

const CONTINENTS: Blob[] = [
  { cx: -0.05, cy: -0.62, rx: 0.62, ry: 0.18, w: 0.85 },
  { cx: 0.18, cy: -0.46, rx: 0.55, ry: 0.16, w: 0.95 },
  { cx: 0.08, cy: -0.28, rx: 0.38, ry: 0.12, w: 0.9 },
  { cx: 0.28, cy: -0.1, rx: 0.26, ry: 0.18, w: 1.0 },
  { cx: 0.42, cy: -0.08, rx: 0.05, ry: 0.1, w: 1.0 },
  { cx: 0.54, cy: -0.05, rx: 0.05, ry: 0.18, w: 1.0 },
  { cx: 0.08, cy: 0.22, rx: 0.17, ry: 0.22, w: 0.95 },
  { cx: 0.28, cy: 0.34, rx: 0.18, ry: 0.14, w: 0.85 },
  { cx: -0.22, cy: 0.05, rx: 0.18, ry: 0.18, w: 0.85 },
  { cx: -0.34, cy: -0.32, rx: 0.2, ry: 0.14, w: 0.85 },
  { cx: -0.22, cy: 0.4, rx: 0.16, ry: 0.32, w: 0.85 },
  { cx: 0.5, cy: 0.55, rx: 0.18, ry: 0.1, w: 0.85 },
];

type Dot = { x: number; y: number; r: number; o: number; land: boolean };

function generateGlobeDots(): Dot[] {
  const out: Dot[] = [];
  for (let y = -GLOBE_R; y <= GLOBE_R; y += SPACING) {
    for (let x = -GLOBE_R; x <= GLOBE_R; x += SPACING) {
      const d = Math.sqrt(x * x + y * y);
      if (d > GLOBE_R - 1.5) continue;

      const u = x / GLOBE_R;
      const v = y / GLOBE_R;

      let land = 0;
      for (const b of CONTINENTS) {
        const dx = (u - b.cx) / b.rx;
        const dy = (v - b.cy) / b.ry;
        const t = dx * dx + dy * dy;
        if (t < 1) land = Math.max(land, (1 - t) * b.w);
      }

      const edgeFade = 1 - Math.pow(d / GLOBE_R, 4);

      const isLand = land > 0.05;
      const r = isLand ? (land > 0.35 ? 1.55 : 1.15) : 0.95;
      const o = isLand
        ? Math.min(0.78, 0.42 + land * 0.5) * edgeFade
        : 0.14 * edgeFade;

      out.push({ x: x + C, y: y + C, r, o, land: isLand });
    }
  }
  return out;
}

const GLOBE_DOTS = generateGlobeDots();

const PIN_JP = { x: C + 0.54 * GLOBE_R, y: C + -0.05 * GLOBE_R };
const PIN_KR = { x: C + 0.42 * GLOBE_R, y: C + -0.08 * GLOBE_R };
const PIN_MN = { x: C + 0.2 * GLOBE_R, y: C + -0.36 * GLOBE_R };

function arcPath(
  a: { x: number; y: number },
  b: { x: number; y: number },
  lift = 50,
) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2 - lift;
  return `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`;
}

type GlobeProps = {
  labels: { japan: string; korea: string; mongolia: string };
  className?: string;
};

export default function Globe({ labels, className }: GlobeProps) {
  return (
    <div
      className={`globe-stage relative mx-auto aspect-square w-full max-w-[560px] ${className ?? ""}`}
    >
      <div
        aria-hidden="true"
        className="globe-halo pointer-events-none absolute inset-[8%] rounded-full"
      />

      <svg
        viewBox={`0 0 ${GLOBE_W} ${GLOBE_W}`}
        className="globe-svg relative h-full w-full text-neutral-900 dark:text-neutral-200"
        role="img"
        aria-label={`${labels.japan} · ${labels.korea} · ${labels.mongolia}`}
      >
        <defs>
          <radialGradient
            id="globe-sphere"
            cx="38%"
            cy="32%"
            r="72%"
            fx="38%"
            fy="28%"
          >
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="55%" stopColor="#ffffff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="globe-shadow" cx="50%" cy="50%" r="50%">
            <stop offset="80%" stopColor="rgba(15,15,25,0)" />
            <stop offset="100%" stopColor="rgba(15,15,25,0.08)" />
          </radialGradient>
          <linearGradient id="globe-arc-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#f1472c" stopOpacity="0.0" />
            <stop offset="30%" stopColor="#f1472c" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#f1472c" stopOpacity="0.95" />
          </linearGradient>
          <radialGradient id="globe-pin-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f1472c" stopOpacity="0.55" />
            <stop offset="55%" stopColor="#f1472c" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#f1472c" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx={C} cy={C} r={GLOBE_R} fill="url(#globe-sphere)" />
        <circle cx={C} cy={C} r={GLOBE_R} fill="url(#globe-shadow)" />

        <circle
          cx={C}
          cy={C}
          r={GLOBE_R}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.08"
          strokeWidth="0.6"
        />

        <g className="globe-dots">
          {GLOBE_DOTS.map((d, i) => (
            <circle
              key={i}
              cx={d.x}
              cy={d.y}
              r={d.r}
              fill="currentColor"
              opacity={d.o}
            />
          ))}
        </g>

        <g className="globe-arcs">
          <path
            d={arcPath(PIN_JP, PIN_MN, 60)}
            stroke="url(#globe-arc-grad)"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeDasharray="2 6"
            fill="none"
            className="globe-arc"
            style={{ animationDelay: "400ms" }}
          />
          <path
            d={arcPath(PIN_KR, PIN_MN, 40)}
            stroke="url(#globe-arc-grad)"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeDasharray="2 6"
            fill="none"
            className="globe-arc"
            style={{ animationDelay: "650ms" }}
          />
        </g>

        {[
          { p: PIN_JP, delay: 800 },
          { p: PIN_KR, delay: 900 },
          { p: PIN_MN, delay: 1000, hero: true },
        ].map(({ p, delay, hero }, i) => {
          const core = hero ? 6 : 4.8;
          const ping = hero ? 7 : 5.6;
          const halo = hero ? 26 : 20;
          const highlightOffset = hero ? 1.7 : 1.3;
          const highlightR = hero ? 1.6 : 1.2;
          return (
            <g
              key={i}
              className="globe-pin"
              style={{ animationDelay: `${delay}ms` }}
            >
              <circle cx={p.x} cy={p.y} r={halo} fill="url(#globe-pin-glow)" />
              <circle
                cx={p.x}
                cy={p.y}
                r={ping}
                fill="none"
                stroke="#f1472c"
                strokeOpacity="0.95"
                strokeWidth={hero ? 1.6 : 1.4}
                className="globe-pin-pulse"
              />
              <circle
                cx={p.x}
                cy={p.y}
                r={ping}
                fill="none"
                stroke="#f1472c"
                strokeOpacity="0.95"
                strokeWidth={hero ? 1.6 : 1.4}
                className="globe-pin-pulse"
                style={{ animationDelay: "1.2s" }}
              />
              <circle cx={p.x} cy={p.y} r={core} fill="#f1472c" />
              <circle
                cx={p.x}
                cy={p.y}
                r={core}
                fill="none"
                stroke="#ffffff"
                strokeWidth="1.6"
              />
              <circle
                cx={p.x - highlightOffset}
                cy={p.y - highlightOffset}
                r={highlightR}
                fill="#ffffff"
                opacity="0.7"
              />
            </g>
          );
        })}
      </svg>

      <FlagChip
        flag={<JapanIcon className="h-full w-full" />}
        label={labels.japan}
        top="40%"
        left="80%"
        delayMs={1100}
      />
      <FlagChip
        flag={<KoreaIcon className="h-full w-full" />}
        label={labels.korea}
        top="58%"
        left="62%"
        align="right"
        delayMs={1200}
      />
      <FlagChip
        flag={<MongoliaIcon className="h-full w-full" />}
        label={labels.mongolia}
        top="22%"
        left="46%"
        align="center"
        hero
        delayMs={1300}
      />
    </div>
  );
}

type FlagChipProps = {
  flag: React.ReactNode;
  label: string;
  top: string;
  left: string;
  align?: "left" | "right" | "center";
  hero?: boolean;
  delayMs?: number;
};

function FlagChip({
  flag,
  label,
  top,
  left,
  align = "left",
  hero,
  delayMs = 0,
}: FlagChipProps) {
  const translate =
    align === "right"
      ? "translate(-100%, -50%)"
      : align === "center"
        ? "translate(-50%, -50%)"
        : "translate(0, -50%)";

  return (
    <div
      className="globe-chip absolute"
      style={{
        top,
        left,
        transform: translate,
        animationDelay: `${delayMs}ms`,
      }}
    >
      <div
        className={`flex items-center gap-2 rounded-full border bg-white/95 py-1 pl-1 pr-3 shadow-[0_8px_24px_-12px_rgba(15,15,25,0.28)] backdrop-blur dark:bg-neutral-900/95 ${
          hero
            ? "border-primary/30 ring-1 ring-primary/15"
            : "border-neutral-200 dark:border-neutral-800"
        }`}
      >
        <span className="block h-6 w-6 overflow-hidden rounded-full ring-1 ring-black/5 dark:ring-white/10">
          {flag}
        </span>
        <span className="text-[12px] font-semibold text-neutral-900 dark:text-neutral-100">
          {label}
        </span>
      </div>
    </div>
  );
}
