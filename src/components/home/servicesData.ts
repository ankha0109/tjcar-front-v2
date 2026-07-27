import type { StaticImageData } from "next/image";
import garageImg from "../../../public/services/garage.webp";
import japanImg from "../../../public/services/services_japan.webp";
import koreaImg from "../../../public/services/services_korea.webp";
import reportImg from "../../../public/services/report.webp";

export type ServiceKey = "japan" | "korea" | "report" | "garage";

/**
 * Structural (non-translatable) data for the four home services. Title and
 * description live in the `homeServices.items.<key>` namespace and are resolved
 * by whichever component renders the list — `ServicesSection` on desktop, the
 * 2×2 tile grid in `MobileHome`. Frame tuning (crop offset, fade height) is
 * deliberately NOT here: it describes a layout's own card, not the service.
 */
export type HomeService = {
  key: ServiceKey;
  href: string;
  /** White-background portrait render, 4:5. */
  image: StaticImageData;
};

export const HOME_SERVICES: HomeService[] = [
  { key: "japan", href: "/japan", image: japanImg },
  { key: "korea", href: "/korea", image: koreaImg },
  { key: "report", href: "/report", image: reportImg },
  { key: "garage", href: "/cars", image: garageImg },
];
