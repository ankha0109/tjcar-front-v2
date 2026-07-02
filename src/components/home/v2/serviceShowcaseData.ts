import type { StaticImageData } from "next/image";
import type { ComponentType, SVGProps } from "react";
import japanImg from "../../../../public/bento/japan.webp";
import koreaImg from "../../../../public/bento/korea.webp";
import readyImg from "../../../../public/bento/ready.webp";
import reportImg from "../../../../public/bento/report.webp";
import {
  IconAbout,
  IconBrands,
  IconDashboard,
  IconHowItWorks,
  IconJapan,
  IconKorea,
  IconReady,
  IconReport,
} from "./serviceIcons";

/**
 * Structural (non-translatable) data for each service showcase entry.
 * Text — tab label, title, summary, metrics, cta, url — lives in the
 * `homeV2.services.<key>` translation namespace and is resolved in the
 * component. `photo` is the browser-frame visual; entries without one
 * fall back to a branded gradient + icon preview.
 */
export type ShowcaseService = {
  key: string;
  href: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  photo?: StaticImageData;
};

export const SHOWCASE_SERVICES: ShowcaseService[] = [
  { key: "japan", href: "/japan", Icon: IconJapan, photo: japanImg },
  { key: "korea", href: "/korea", Icon: IconKorea, photo: koreaImg },
  { key: "ready", href: "/cars", Icon: IconReady, photo: readyImg },
  { key: "report", href: "/report", Icon: IconReport, photo: reportImg },
  { key: "brands", href: "/japan/brands", Icon: IconBrands },
  { key: "howItWorks", href: "/how-it-works", Icon: IconHowItWorks },
  { key: "about", href: "/about", Icon: IconAbout },
  { key: "dashboard", href: "/dashboard", Icon: IconDashboard },
];
