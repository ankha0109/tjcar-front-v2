import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import PostCard from "@/components/posts/PostCard";
import PostsCategoryFilter from "@/components/posts/PostsCategoryFilter";
import PostsPagination from "@/components/posts/PostsPagination";
import { POSTS_PER_PAGE, getPosts } from "@/services/posts";
import type { PostCategory } from "@/types/post";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const CATEGORIES: PostCategory[] = ["news", "tutorial"];

function readCategory(
  value: string | string[] | undefined,
): PostCategory | undefined {
  return typeof value === "string" && CATEGORIES.includes(value as PostCategory)
    ? (value as PostCategory)
    : undefined;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "posts.metadata" });
  return { title: t("title"), description: t("description") };
}

export default async function PostsPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const category = readCategory(sp.category);

  const t = await getTranslations("posts");

  const result = await getPosts({
    page,
    per_page: POSTS_PER_PAGE,
    category,
  }).catch((err) => {
    console.error("[posts] /posts fetch failed:", err);
    return null;
  });

  const posts = result?.data ?? [];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 md:pt-10 lg:px-6">
      <header className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/80">
          {t("eyebrow")}
        </span>
        <h1 className="text-[26px] font-semibold tracking-tight text-neutral-900 md:text-[32px] dark:text-neutral-50">
          {t("heading")}
        </h1>
        <p className="max-w-2xl text-[13.5px] leading-relaxed text-neutral-600 md:text-[14px] dark:text-neutral-400">
          {t("subheading")}
        </p>
      </header>

      <div className="mt-6">
        <PostsCategoryFilter
          active={category}
          labels={{
            all: t("all"),
            news: t("category.news"),
            tutorial: t("category.tutorial"),
          }}
        />
      </div>

      {result === null ? (
        <p className="mt-12 text-center text-[14px] text-neutral-600 dark:text-neutral-400">
          {t("error")}
        </p>
      ) : posts.length === 0 ? (
        <p className="mt-12 text-center text-[14px] text-neutral-600 dark:text-neutral-400">
          {t("empty")}
        </p>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                readMoreLabel={t("readMore")}
                sizes="(min-width: 1024px) 31vw, (min-width: 640px) 48vw, 100vw"
              />
            ))}
          </div>

          <PostsPagination
            currentPage={result.meta.current_page}
            lastPage={result.meta.last_page}
            params={{ category }}
            labels={{ prev: t("pagination.prev"), next: t("pagination.next") }}
          />
        </>
      )}
    </div>
  );
}
