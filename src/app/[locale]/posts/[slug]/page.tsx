import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowIcon } from "@/components/icons";
import { Link } from "@/i18n/navigation";
import { getPost } from "@/services/posts";
import type { PostCategory } from "@/types/post";
import { formatPostDate, postDateTimeAttr } from "@/utils/postFormat";

const KNOWN_CATEGORIES: PostCategory[] = ["news", "tutorial"];

type PageProps = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};

  const description = post.excerpt ?? post.description ?? undefined;

  return {
    title: post.title,
    description,
    openGraph: {
      title: post.title,
      description,
      images: post.featured_image ? [post.featured_image] : undefined,
      type: "article",
      publishedTime: postDateTimeAttr(post.published_at),
    },
  };
}

export default async function PostPage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  // `getPost` is React-cached, so generateMetadata and this share one API call.
  const post = await getPost(slug);
  if (!post) notFound();

  const t = await getTranslations("posts");

  const published = post.published_at ?? post.created_at;
  const date = formatPostDate(published, locale);
  const category = KNOWN_CATEGORIES.includes(post.category)
    ? t(`category.${post.category}`)
    : null;

  return (
    <article className="mx-auto w-full max-w-3xl px-4 pb-16 pt-8 lg:px-6">
      <Link
        href="/posts"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
      >
        <ArrowIcon className="h-3.5 w-3.5 rotate-180" />
        {t("backToList")}
      </Link>

      <header className="mt-5 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-neutral-500 dark:text-neutral-400">
          {category ? (
            <span className="rounded-full bg-neutral-100 px-2.5 py-1 font-semibold text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100">
              {category}
            </span>
          ) : null}
          {date ? (
            <time dateTime={postDateTimeAttr(published)}>{date}</time>
          ) : null}
        </div>
        <h1 className="text-[24px] font-semibold leading-tight tracking-tight text-neutral-900 md:text-[32px] dark:text-neutral-50">
          {post.title}
        </h1>
        {post.excerpt ? (
          <p className="text-[15px] leading-relaxed text-neutral-600 dark:text-neutral-400">
            {post.excerpt}
          </p>
        ) : null}
      </header>

      {post.featured_image ? (
        <Image
          src={post.featured_image}
          alt={post.title}
          width={1200}
          height={675}
          priority
          unoptimized
          className="mt-6 h-auto w-full rounded-2xl border border-neutral-200 object-cover dark:border-neutral-800"
        />
      ) : null}

      {/* `body` is Tiptap HTML (never markdown); `.post-body` styles it. */}
      <div
        className="post-body mt-8"
        dangerouslySetInnerHTML={{ __html: post.body }}
      />
    </article>
  );
}
