"use client";

import type { SVGProps } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/utils";

function ArrowIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

type ReportCtaButtonProps = {
  children: React.ReactNode;
  /** Scrolls to this element id (stub while the /reports backend is pending). */
  targetId?: string;
  href?: string;
  variant?: "primary" | "ghost";
  className?: string;
};

const styles = {
  primary:
    "group inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-6 py-3 text-[13.5px] font-medium text-white shadow-[0_12px_30px_-12px_rgba(241,71,44,0.7)] transition-all duration-300 hover:gap-3 hover:bg-primary/90",
  ghost:
    "inline-flex min-h-12 items-center gap-2 rounded-full border border-neutral-200 px-6 py-3 text-[13.5px] font-medium text-neutral-700 transition-colors hover:border-primary hover:text-primary dark:border-neutral-800 dark:text-neutral-200",
} as const;

/**
 * CTA usable from server sections. With `targetId` it smooth-scrolls to the
 * hero lookup form (`#report-check`); with `href` it renders a locale Link.
 */
export default function ReportCtaButton({
  children,
  targetId,
  href,
  variant = "primary",
  className,
}: ReportCtaButtonProps) {
  const arrow = (
    <span
      className={cn(
        "grid h-5 w-5 place-items-center rounded-full",
        variant === "primary" ? "bg-white/20 text-white" : "bg-primary text-white",
      )}
    >
      <ArrowIcon className="h-3 w-3" />
    </span>
  );

  if (href) {
    return (
      <Link href={href} className={cn(styles[variant], className)}>
        {children}
        {arrow}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() =>
        document
          .getElementById(targetId ?? "report-check")
          ?.scrollIntoView({ behavior: "smooth", block: "center" })
      }
      className={cn(styles[variant], className)}
    >
      {children}
      {arrow}
    </button>
  );
}
