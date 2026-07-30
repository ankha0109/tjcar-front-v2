import { Fragment, type ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/utils";

export type Crumb = {
  label: ReactNode;
  /**
   * Omit on the last step to mark it as the current page. Earlier steps must
   * have one. A last step that *does* carry an href renders as a full-contrast
   * link instead (Japan's model step filters the listing).
   */
  href?: string;
};

/**
 * Detail-page breadcrumb trail. Leading steps are muted so only the tail reads
 * as where you are.
 *
 * Each step must add only its own increment: a trail of brand + "BRAND MODEL"
 * would read "TOYOTA › TOYOTA RAV4", so callers split the title rather than
 * repeating it.
 */
export default function CarBreadcrumb({
  items,
  ariaLabel,
  className,
}: {
  items: Crumb[];
  ariaLabel: string;
  className?: string;
}) {
  return (
    <nav aria-label={ariaLabel} className={cn("text-[13px]", className)}>
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-neutral-500 dark:text-neutral-400">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <Fragment key={idx}>
              {idx > 0 && <Separator />}
              {isLast ? (
                <li
                  {...(item.href ? {} : { "aria-current": "page" as const })}
                  className="font-medium text-neutral-900 dark:text-neutral-100"
                >
                  {item.href ? (
                    // Full contrast already, so hover underlines rather than
                    // shifting colour — a colour shift would not read here.
                    <Link
                      href={item.href}
                      className="text-neutral-900 underline-offset-2 hover:underline dark:text-neutral-100"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    item.label
                  )}
                </li>
              ) : (
                <li>
                  {/* The colour is set on the anchor itself, not inherited from
                      the list: antd's reset styles a bare `a` with its link
                      blue, which an inherited colour would lose to. */}
                  <Link
                    href={item.href ?? "/"}
                    className="text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                  >
                    {item.label}
                  </Link>
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

/** Decorative — assistive tech reads the list structure instead. */
function Separator() {
  return (
    <li aria-hidden className="text-neutral-300 dark:text-neutral-700">
      ›
    </li>
  );
}
