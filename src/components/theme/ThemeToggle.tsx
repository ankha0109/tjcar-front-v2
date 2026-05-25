"use client";

import { useTransition } from "react";
import { Button } from "antd";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { setTheme } from "@/app/actions/theme";
import type { Theme } from "@/lib/theme";
import { cn } from "@/utils";

const SunIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
);

const MoonIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

export default function ThemeToggle({ theme }: { theme: Theme }) {
  const t = useTranslations("header.theme");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const next: Theme = theme === "dark" ? "light" : "dark";

  const onClick = () => {
    startTransition(async () => {
      await setTheme(next);
      router.refresh();
    });
  };

  return (
    <Button
      type="text"
      shape="circle"
      onClick={onClick}
      disabled={isPending}
      aria-label={theme === "dark" ? t("switchToLight") : t("switchToDark")}
      title={theme === "dark" ? t("switchToLight") : t("switchToDark")}
      className={cn(
        "text-neutral-700! dark:text-neutral-200!",
        isPending && "opacity-60!",
      )}
    >
      {theme === "dark" ? (
        <SunIcon className="h-4.5 w-4.5" />
      ) : (
        <MoonIcon className="h-4.5 w-4.5" />
      )}
    </Button>
  );
}
