type ReportHeadingProps = {
  heading: string;
  subheading?: string;
  /** Defaults to center; panels beside visuals typically pass "left". */
  align?: "left" | "center" | "right";
  id?: string;
};

const ALIGN_CLASSES = {
  left: "",
  center: "items-center text-center",
  right: "items-end text-right",
} as const;

/**
 * Shared section heading for the /report landing page.
 * Pure presentational — safe to render from both server and client components.
 */
export default function ReportHeading({
  heading,
  subheading,
  align = "center",
  id,
}: ReportHeadingProps) {
  return (
    <div id={id} className={`flex flex-col gap-3 ${ALIGN_CLASSES[align]}`}>
      <h2 className="text-balance text-[26px] font-semibold leading-[1.15] text-neutral-900 md:text-[34px] dark:text-neutral-50">
        {heading}
      </h2>
      {subheading ? (
        <p className="max-w-2xl text-[13.5px] leading-relaxed text-neutral-600 md:text-[14.5px] dark:text-neutral-400">
          {subheading}
        </p>
      ) : null}
    </div>
  );
}
