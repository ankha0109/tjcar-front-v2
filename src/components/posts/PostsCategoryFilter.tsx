import { Link } from "@/i18n/navigation";
import type { PostCategory } from "@/types/post";
import { cn } from "@/utils";

type PostsCategoryFilterProps = {
  /** Currently applied `?category=`, or `undefined` for "all". */
  active?: PostCategory;
  labels: { all: string } & Record<PostCategory, string>;
};

const CATEGORIES: PostCategory[] = ["news", "tutorial"];

const CHIP =
  "inline-flex items-center rounded-full border px-4 py-1.5 text-[13px] font-medium transition-colors";
const ACTIVE = "border-primary bg-primary text-white";
const IDLE =
  "border-neutral-200 text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:border-neutral-700 dark:hover:bg-neutral-900";

/** Category chips. Plain links so the filter survives a page reload and SSR. */
export default function PostsCategoryFilter({
  active,
  labels,
}: PostsCategoryFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href="/posts"
        className={cn(CHIP, active ? IDLE : ACTIVE)}
        aria-current={active ? undefined : "page"}
      >
        {labels.all}
      </Link>
      {CATEGORIES.map((category) => (
        <Link
          key={category}
          href={`/posts?category=${category}`}
          className={cn(CHIP, active === category ? ACTIVE : IDLE)}
          aria-current={active === category ? "page" : undefined}
        >
          {labels[category]}
        </Link>
      ))}
    </div>
  );
}
