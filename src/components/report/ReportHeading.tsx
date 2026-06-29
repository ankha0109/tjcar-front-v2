type ReportHeadingProps = {
  eyebrow: string;
  heading: string;
  subheading?: string;
  align?: "left" | "center";
};

/**
 * Shared section heading for the /report landing page.
 * Pure presentational — safe to render from both server and client components.
 */
export default function ReportHeading({
  eyebrow,
  heading,
  subheading,
  align = "left",
}: ReportHeadingProps) {
  return (
    <div
      className={`flex flex-col gap-2 ${
        align === "center" ? "items-center text-center" : ""
      }`}
    >
      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/80">
        {eyebrow}
      </span>
      <h2 className="text-[22px] font-semibold tracking-tight text-neutral-900 md:text-[26px] dark:text-neutral-50">
        {heading}
      </h2>
      {subheading ? (
        <p className="max-w-2xl text-[13.5px] leading-relaxed text-neutral-600 md:text-[14px] dark:text-neutral-400">
          {subheading}
        </p>
      ) : null}
    </div>
  );
}
