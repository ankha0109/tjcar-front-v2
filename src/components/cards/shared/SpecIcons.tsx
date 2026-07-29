import { cn } from "@/utils";
import { getColorSwatch } from "@/utils/carColor";

/*
 * Cards draw their spec glyphs from the same duotone set as the Japan detail
 * page — one vocabulary across the site. The old hand-drawn stroke icons that
 * lived here are gone; import from `@/components/icons/CarSpecIcons` instead.
 */
export {
  ChassisIcon,
  DriveIcon,
  DrivetrainIcon,
  EngineIcon,
  MileageIcon,
  TransmissionIcon,
  YearIcon,
} from "@/components/icons/CarSpecIcons";

/** The car's actual paint, as a dot. Light paints get a ring so they stay
 *  visible on a white card. */
export function ColorDot({
  color,
  size = 12,
}: {
  color: string;
  size?: number;
}) {
  const swatch = getColorSwatch(color);
  return (
    <span
      className={cn(
        "inline-block shrink-0 rounded-full",
        swatch.ring && "ring-1 ring-neutral-300 dark:ring-neutral-600",
      )}
      style={{ backgroundColor: swatch.bg, width: size, height: size }}
    />
  );
}
