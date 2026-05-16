"use client";

import { Dropdown } from "antd";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/utils";

type Locale = (typeof routing.locales)[number];

const FLAGS: Record<Locale, string> = {
  mn: "🇲🇳",
  en: "🇬🇧",
  ru: "🇷🇺",
};

export default function LanguageSwitcher() {
  const t = useTranslations("common.language");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  const onSelect = (next: Locale) => {
    if (next === locale) return;
    router.replace(
      // @ts-expect-error pathname types depend on routing config
      { pathname, params },
      { locale: next },
    );
  };

  return (
    <Dropdown
      trigger={["click"]}
      placement="bottomRight"
      menu={{
        items: routing.locales.map((loc) => ({
          key: loc,
          label: (
            <span className="inline-flex items-center gap-2">
              <span aria-hidden>{FLAGS[loc]}</span>
              <span>{t(loc)}</span>
            </span>
          ),
          onClick: () => onSelect(loc),
        })),
        selectedKeys: [locale],
      }}
    >
      <button
        type="button"
        aria-label={t("label")}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-full border border-transparent px-3 text-[13px] font-medium tracking-tight text-neutral-700 transition-colors",
          "hover:border-neutral-200 hover:bg-white",
        )}
      >
        <span aria-hidden>{FLAGS[locale]}</span>
        <span className="uppercase">{locale}</span>
      </button>
    </Dropdown>
  );
}
