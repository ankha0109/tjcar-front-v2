import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["mn", "en", "ru"] as const,
  defaultLocale: "mn",
  localePrefix: "always",
  // Анх нээхэд хөтчийн Accept-Language / күүкиэр биш, үргэлж defaultLocale (mn)
  // руу чиглүүлнэ. Хэрэглэгч дараа нь хэлээ өөрөө сонгож болно.
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
