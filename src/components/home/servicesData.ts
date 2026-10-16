import type { StaticImageData } from "next/image";
import garageImg from "../../../public/services/garage.webp";
import chinaImg from "../../../public/services/services_china.webp";
import japanImg from "../../../public/services/services_japan.webp";
import koreaImg from "../../../public/services/services_korea.webp";
import reportImg from "../../../public/services/report.webp";

export type ServiceKey = "japan" | "korea" | "china" | "report" | "garage";

/**
 * Structural (non-translatable) data for the five home services. Title and
 * description live in the `homeServices.items.<key>` namespace and are resolved
 * by whichever component renders the list — `ServicesSection` on desktop, the
 * tile grid in `MobileHome`. Frame tuning (crop offset, fade height) is
 * deliberately NOT here: it describes a layout's own card, not the service.
 */
export type HomeService = {
  key: ServiceKey;
  href: string;
  /** White-background portrait render, 4:5. */
  image: StaticImageData;
  /** Carries the "new" badge — and leads the mobile grid as its wide tile. */
  isNew?: boolean;
  /**
   * Delivery window in days, the same digits in every locale; the unit comes
   * from `homeServices.deliveryDays`. Only the order-from-abroad services
   * have one.
   */
  delivery?: string;
};

// The three markets stay together, in the header's order.
export const HOME_SERVICES: HomeService[] = [
  { key: "japan", href: "/japan", image: japanImg, delivery: "45–60" },
  { key: "korea", href: "/korea", image: koreaImg, delivery: "10–14" },
  {
    key: "china",
    href: "/china",
    image: chinaImg,
    isNew: true,
    delivery: "10–14",
  },
  { key: "report", href: "/report", image: reportImg },
  { key: "garage", href: "/garage", image: garageImg },
];
