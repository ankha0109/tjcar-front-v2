"use client";

import { Button, Tooltip } from "antd";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { cn } from "@/utils";

type Props = {
  /**
   * Visibility mode.
   * - "hover" (default): hidden until parent .group is hovered
   * - "always": always visible (useful for table rows / list items)
   */
  visibility?: "hover" | "always";
  /** Absolute overlay positioning by default. Set false for inline placement. */
  absolute?: boolean;
};

export function CardActions({
  visibility = "hover",
  absolute = true,
}: Props) {
  const t = useTranslations("car.card");
  const [wishlisted, setWishlisted] = useState(false);
  const [compared, setCompared] = useState(false);

  const stop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      className={cn(
        "flex gap-1.5",
        absolute && "absolute right-2.5 top-2.5 z-10",
        visibility === "hover" &&
          "opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100",
      )}
    >
      <Tooltip title={t("wishlist")} placement="bottom" mouseEnterDelay={0.2}>
        <Button
          type="text"
          shape="circle"
          aria-label={t("wishlist")}
          aria-pressed={wishlisted}
          onClick={(e) => {
            stop(e);
            setWishlisted((v) => !v);
          }}
          className={cn(
            "ring-1! backdrop-blur-md! active:scale-95!",
            wishlisted
              ? "bg-rose-500! text-white! ring-rose-300/40! shadow-md! hover:bg-rose-500!"
              : "bg-white/85! text-neutral-700! ring-black/5! hover:bg-white! hover:text-rose-500!",
          )}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill={wishlisted ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" />
          </svg>
        </Button>
      </Tooltip>
      <Tooltip title={t("compare")} placement="bottom" mouseEnterDelay={0.2}>
        <Button
          type="text"
          shape="circle"
          aria-label={t("compare")}
          aria-pressed={compared}
          onClick={(e) => {
            stop(e);
            setCompared((v) => !v);
          }}
          className={cn(
            "ring-1! backdrop-blur-md! active:scale-95!",
            compared
              ? "bg-neutral-900! text-white! ring-white/20! shadow-md! hover:bg-neutral-900!"
              : "bg-white/85! text-neutral-700! ring-black/5! hover:bg-white! hover:text-neutral-900!",
          )}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 7h13l-3-3" />
            <path d="M21 17H8l3 3" />
          </svg>
        </Button>
      </Tooltip>
    </div>
  );
}
