import { CAR_BOX } from "@/lib/auctionSheet";

type Props = {
  /** Top-left corner and scale of the drawing, in the sheet's viewBox units. */
  x: number;
  y: number;
  scale: number;
};

/**
 * The "unfolded" car every auction sheet prints for the inspector to mark
 * damage on: the roof column down the middle (bumper, bonnet, glass, roof,
 * boot), with each side's wings and doors folded outwards beside it. Drawn in
 * a `200 × 300` box and scaled into whichever cell a house gives the diagram.
 *
 * One drawing serves all ten houses — the real forms each use their own
 * outline, but the panels, and so where a mark can land, are the same.
 */
export default function CarDiagram({ x, y, scale }: Props) {
  return (
    <g
      transform={`translate(${x} ${y}) scale(${scale})`}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.3 / scale}
      strokeLinejoin="round"
      strokeLinecap="round"
      className="text-neutral-700 dark:text-neutral-300"
      pointerEvents="none"
    >
      {/* Centre column, front to back. */}
      <path d="M70 26 Q100 8 130 26 V34 H70 Z" />
      <path d="M70 38 H130 L128 84 H72 Z" />
      <path d="M73 88 H127 L122 110 H78 Z" />
      <rect x="78" y="114" width="44" height="72" rx="3" />
      <path d="M78 190 H122 L127 210 H73 Z" />
      <path d="M72 214 H128 L130 256 H70 Z" />
      <path d="M70 260 H130 V268 Q100 290 70 268 Z" />

      <Side />
      <g transform={`translate(${CAR_BOX.w} 0) scale(-1 1)`}>
        <Side />
      </g>
    </g>
  );
}

/** Left flank, folded outwards: wing, two doors, rear quarter, both wheels. */
function Side() {
  return (
    <>
      <path d="M62 40 V96 H24 V86 A18 18 0 0 0 24 50 V40 Z" />
      <path d="M62 100 V150 H24 V100 Z" />
      <path d="M62 154 V204 H24 V154 Z" />
      <path d="M62 208 V262 H24 V252 A18 18 0 0 0 24 216 V208 Z" />
      {/* Glass line along the doors. */}
      <path d="M50 106 V198" strokeDasharray="3 3" />
      <circle cx="24" cy="68" r="13" />
      <circle cx="24" cy="68" r="5.5" />
      <circle cx="24" cy="234" r="13" />
      <circle cx="24" cy="234" r="5.5" />
    </>
  );
}
