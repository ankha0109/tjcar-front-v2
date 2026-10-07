import LogoBlack from "@/components/svg/logo.svg";
import LogoWhite from "@/components/svg/logo-white.svg";
import { cn } from "@/utils";

/**
 * The header logo. The wordmark is drawn black, so a dark theme needs the white
 * artwork instead. Both are in the markup and `dark:` shows one of them — the
 * server render is right without reading the theme, and a toggle swaps them
 * without a re-render.
 */
export default function Logo({ className }: { className?: string }) {
  return (
    <>
      <LogoBlack className={cn(className, "dark:hidden")} />
      <LogoWhite className={cn(className, "hidden dark:block")} />
    </>
  );
}
