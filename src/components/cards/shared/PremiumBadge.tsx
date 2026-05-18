import { useTranslations } from "next-intl";
import { cn } from "@/utils";

export function PremiumBadge({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md";
}) {
  const t = useTranslations("car.card");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-linear-to-r from-amber-400 to-amber-500 font-bold uppercase text-amber-950 shadow-md ring-1 ring-amber-200/60",
        size === "sm" ? "px-1.5 py-0.5 text-[9.5px]" : "px-2.5 py-1 text-[10.5px]",
        className,
      )}
    >
      <span aria-hidden className="leading-none">
        ✦
      </span>
      {t("premium")}
    </span>
  );
}

export const PREMIUM_CARD_RING_CLASSES =
  "border-amber-300/70 ring-1 ring-amber-300/60 shadow-[0_0_0_1px_rgba(251,191,36,0.25),0_8px_24px_-12px_rgba(217,119,6,0.35)] hover:border-amber-400 dark:border-amber-500/40 dark:ring-amber-500/30";

export function isPremiumCar(auctionType: string | undefined): boolean {
  return auctionType === "1";
}
