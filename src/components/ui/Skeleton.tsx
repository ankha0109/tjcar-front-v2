import { cn } from "@/utils";

/**
 * Bare shimmer block used to compose route-level loading skeletons.
 * Purely presentational (no hooks) so it is safe to render from the server
 * components in `loading.tsx` files without a `"use client"` boundary.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-pulse rounded bg-neutral-200 dark:bg-neutral-800",
        className,
      )}
    />
  );
}
