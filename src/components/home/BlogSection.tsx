import { getTranslations } from "next-intl/server";
import { ArrowIcon } from "@/components/icons";
import PostCard from "@/components/posts/PostCard";
import { Link } from "@/i18n/navigation";
import { getLatestPosts } from "@/services/posts";

export default async function BlogSection() {
  const t = await getTranslations("homeBlog");
  const posts = await getLatestPosts();

  // Nothing published yet (or the API is down) — drop the whole strip.
  if (posts.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-12 pt-6 md:pb-16 md:pt-10 lg:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/80">
            {t("eyebrow")}
          </span>
          <h2 className="text-[22px] font-semibold tracking-tight text-neutral-900 md:text-[26px] dark:text-neutral-50">
            {t("heading")}
          </h2>
          <p className="max-w-2xl text-[13.5px] leading-relaxed text-neutral-600 md:text-[14px] dark:text-neutral-400">
            {t("subheading")}
          </p>
        </div>
        <Link
          href="/posts"
          className="inline-flex shrink-0 items-center gap-1 self-start rounded-full border border-neutral-200 px-4 py-2 text-[13px] font-semibold text-neutral-900 transition-all hover:gap-2 hover:border-neutral-300 hover:bg-neutral-50 sm:self-auto dark:border-neutral-800 dark:text-neutral-100 dark:hover:border-neutral-700 dark:hover:bg-neutral-900"
        >
          {t("viewAll")}
          <ArrowIcon className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} readMoreLabel={t("readMore")} />
        ))}
      </div>
    </section>
  );
}
