import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { HOME_SERVICES } from "@/components/home/servicesData";
import { ArrowIcon } from "@/components/icons";
import { Link } from "@/i18n/navigation";
import { getLatestPosts } from "@/services/posts";
import { formatPostDate, postDateTimeAttr } from "@/utils/postFormat";
import { postImage } from "@/utils/postImage";

/**
 * Mobile landing page — reached only through the `tjcar-device` cookie split in
 * `Home.tsx`, never through a breakpoint. Two sections, both derived from the
 * desktop home: services and blog. No search form, no brand grid, no VIN panel;
 * `MobileBottomNav` already carries /japan, /korea, /cars and /report.
 *
 * `MobileShell` reserves the fixed bottom nav on its own `<main>`
 * (`pb-[calc(4rem+env(safe-area-inset-bottom))]`), so nothing here reserves it
 * again — the `pb-6` below is plain breathing room.
 */
export default async function MobileHome() {
  return (
    <div className="flex flex-col gap-8 px-4 pb-6 pt-4">
      <MobileServices />
      <MobileBlog />
    </div>
  );
}

async function MobileServices() {
  const t = await getTranslations("homeServices");

  return (
    <section aria-labelledby="m-services-heading" className="flex flex-col gap-3">
      {/* The desktop trio (eyebrow → 26px headline → subhead) is five lines of
          chrome at this width. The eyebrow alone already names the section, so
          it is promoted to the heading instead of being a micro-label. */}
      <h2
        id="m-services-heading"
        className="text-[17px] font-semibold tracking-tight text-neutral-900 dark:text-neutral-100"
      >
        {t("eyebrow")}
      </h2>

      <div className="grid grid-cols-2 gap-3">
        {HOME_SERVICES.map(({ key, href, image }) => (
          <Link
            key={key}
            href={href}
            // Stays a light "product tile" in both themes, same call as the
            // desktop section: the renders are white-based and the dissolve
            // fades to white, so a dark surface would only look muddy.
            className="flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200 transition-colors active:bg-neutral-50 dark:ring-white/15"
          >
            {/* Square crop of a 4:5 render, anchored top. The desktop card
                already dissolves its bottom 22–90% into white, so the square
                loses nothing the desktop tile actually shows — and it keeps
                both rows on one screen, which `aspect-4/5` would not. */}
            <div className="relative aspect-square w-full overflow-hidden">
              <Image
                src={image}
                alt=""
                fill
                quality={70}
                placeholder="blur"
                sizes="45vw"
                className="object-cover object-top"
              />
              {/* One uniform dissolve for all four — no per-card tuning at this
                  size. Final stop is white at alpha 0, never `transparent`:
                  `transparent` is rgba(0,0,0,0) and smears a grey band. */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-[26%] bg-linear-to-t from-white from-20% via-white/55 via-60% to-white/0"
              />
            </div>

            {/* Two lines reserved: "TJ Garage" is one line while "Осол аваар
                шалгах репорт" is two, and a ragged bottom row reads as broken.
                `z-10` is load-bearing, same as the desktop card: the `fill`
                image above is absolutely positioned and would otherwise paint
                over this statically-positioned span, clipping its first line
                where the negative margin overlaps the frame. */}
            <span className="z-10 -mt-2 line-clamp-2 min-h-[2.6em] px-3 pb-3 text-[13.5px] font-semibold leading-snug text-neutral-900">
              {t(`items.${key}.title`)}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

async function MobileBlog() {
  const [t, locale, posts] = await Promise.all([
    getTranslations("homeBlog"),
    getLocale(),
    getLatestPosts(),
  ]);

  // Nothing published yet (or the API is down) — drop the whole strip, same as
  // `BlogSection`. A null child adds no node, so the parent gap collapses.
  if (posts.length === 0) return null;

  return (
    <section aria-labelledby="m-blog-heading" className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <h2
          id="m-blog-heading"
          className="text-[17px] font-semibold tracking-tight text-neutral-900 dark:text-neutral-100"
        >
          {t("eyebrow")}
        </h2>
        <Link
          href="/posts"
          className="inline-flex shrink-0 items-center gap-1 text-[13px] font-semibold text-primary"
        >
          {t("viewAll")}
          <ArrowIcon className="h-3 w-3" />
        </Link>
      </div>

      <ul className="flex flex-col divide-y divide-neutral-100 dark:divide-neutral-800">
        {posts.map((post) => {
          const cover = postImage(post.featured_image, "card");
          const published = post.published_at ?? post.created_at;
          const date = formatPostDate(published, locale);

          return (
            <li key={post.id}>
              <Link
                href={`/posts/${post.slug}`}
                className="flex items-start gap-3 py-3 transition-colors active:bg-neutral-50 dark:active:bg-neutral-900"
              >
                <span className="relative h-18 w-24 shrink-0 overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800">
                  {cover ? (
                    // `alt=""` — the title sits in the same link, so a second
                    // announcement is noise. `unoptimized` because cdn.tjcar.mn
                    // is not in `next.config.ts` remotePatterns; the `_w320`
                    // variant from `postImage(_, "card")` is the real sizing.
                    <Image
                      src={cover}
                      alt=""
                      fill
                      sizes="96px"
                      className="object-cover"
                      unoptimized
                    />
                  ) : null}
                </span>

                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="line-clamp-2 text-[14px] font-semibold leading-snug text-neutral-900 dark:text-neutral-100">
                    {post.title}
                  </span>
                  {date ? (
                    <time
                      dateTime={postDateTimeAttr(published)}
                      className="text-[11.5px] text-neutral-500"
                    >
                      {date}
                    </time>
                  ) : null}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
