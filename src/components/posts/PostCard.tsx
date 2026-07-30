import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowIcon } from "@/components/icons";
import { Link } from "@/i18n/navigation";
import type { Post, PostCategory } from "@/types/post";
import {
  formatPostDate,
  postDateTimeAttr,
  postExcerpt,
} from "@/utils/postFormat";
import { cdnImage } from "@/utils/cdnImage";

const KNOWN_CATEGORIES: PostCategory[] = ["news", "tutorial"];

type PostCardProps = {
  post: Post;
  /** "Read more" label — the home strip and /posts each own their namespace. */
  readMoreLabel: string;
  /** `sizes` hint for the cover, matched to the grid the card sits in. */
  sizes?: string;
};

/**
 * One blog card. Shared by the home page strip and the /posts grid so both stay
 * in sync. `cdn.tjcar.mn` is not in `next.config.ts` `remotePatterns`, hence
 * `unoptimized` — same trick as `CarCard`.
 */
export default async function PostCard({
  post,
  readMoreLabel,
  sizes = "(min-width: 1024px) 23vw, (min-width: 640px) 48vw, 100vw",
}: PostCardProps) {
  const locale = await getLocale();
  const t = await getTranslations("posts");

  const cover = cdnImage(post.featured_image, "card");
  const published = post.published_at ?? post.created_at;
  const date = formatPostDate(published, locale);
  const category = KNOWN_CATEGORIES.includes(post.category)
    ? t(`category.${post.category}`)
    : null;

  return (
    <Link
      href={`/posts/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-shadow duration-300 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900 dark:hover:shadow-black/40"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800/60 dark:to-neutral-900">
        {cover ? (
          <Image
            src={cover}
            alt={post.title}
            fill
            sizes={sizes}
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            unoptimized
          />
        ) : null}
        {category ? (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-neutral-900 backdrop-blur dark:bg-neutral-950/80 dark:text-neutral-100">
            {category}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4 md:p-5">
        {date ? (
          <time
            dateTime={postDateTimeAttr(published)}
            className="text-[11.5px] font-medium uppercase tracking-[0.08em] text-neutral-500 dark:text-neutral-500"
          >
            {date}
          </time>
        ) : null}
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-neutral-900 transition-colors group-hover:text-primary dark:text-neutral-100">
          {post.title}
        </h3>
        <p className="line-clamp-2 text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-400">
          {postExcerpt(post)}
        </p>
        <span className="mt-auto inline-flex items-center gap-1 pt-2 text-[12.5px] font-medium text-neutral-900 transition-all duration-300 group-hover:gap-2 dark:text-neutral-100">
          {readMoreLabel}
          <ArrowIcon className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}
