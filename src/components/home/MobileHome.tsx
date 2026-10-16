import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { HOME_SERVICES } from "@/components/home/servicesData";
import { ArrowIcon } from "@/components/icons";
import NewBadge from "@/components/ui/NewBadge";
import { Link } from "@/i18n/navigation";
import { getLatestPosts } from "@/services/posts";
import { formatPostDate, postDateTimeAttr } from "@/utils/postFormat";
import { cdnImage } from "@/utils/cdnImage";

/**
 * Mobile landing page — reached only through the `tjcar-device` cookie split in
 * `Home.tsx`, never through a breakpoint. Two sections, both derived from the
 * desktop home: services and blog. No search form, no brand grid, no VIN panel;
 * `MobileBottomNav` already carries /japan, /korea, /garage and /report.
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
  const [t, tHeader] = await Promise.all([
    getTranslations("homeServices"),
    getTranslations("header"),
  ]);
  const lead = HOME_SERVICES.filter((service) => service.isNew);
  const rest = HOME_SERVICES.filter((service) => !service.isNew);

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
        {/* A new service leads as one wide tile — five in two columns would
            otherwise leave the last one alone on its row — and the rest keep
            the 2×2 below it. Same square crop, so the render needs no tuning. */}
        {lead.map(({ key, href, image, delivery }) => (
          <Link
            key={key}
            href={href}
            className="col-span-2 flex items-stretch overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200 transition-[background-color,scale] duration-150 active:bg-neutral-50 motion-safe:active:scale-[0.98] dark:ring-white/15"
          >
            <div className="relative aspect-square w-[42%] shrink-0 overflow-hidden">
              <Image
                src={image}
                alt=""
                fill
                quality={70}
                placeholder="blur"
                sizes="40vw"
                className="object-cover object-top"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-[26%] bg-linear-to-t from-white from-20% via-white/55 via-60% to-white/0"
              />
            </div>
            {/* Light in both themes like the other tiles, so the badge keeps
                its light-surface colours in dark mode too. */}
            <span className="flex min-w-0 flex-col justify-center gap-1.5 py-3 pl-1 pr-4">
              <span className="flex flex-col gap-0.5">
                <span className="flex items-center gap-1.5">
                  <NewBadge className="dark:bg-primary/10 dark:text-red-700">
                    {tHeader("nav2.new")}
                  </NewBadge>
                  <span className="truncate text-[11.5px] font-semibold text-primary-strong">
                    {t(`items.${key}.kicker`)}
                  </span>
                </span>
                <span className="text-[16px] font-bold leading-snug text-neutral-900">
                  {t(`items.${key}.title`)}
                </span>
              </span>
              {/* Four lines: the mn sentence wraps to four at this width. */}
              <span className="line-clamp-4 text-[12.5px] leading-relaxed text-neutral-600">
                {t(`items.${key}.description`)}
              </span>
              {delivery ? (
                <span className="self-start rounded-full bg-neutral-100 px-2.5 py-0.5 text-[12.5px] font-bold text-neutral-900">
                  <span className="sr-only">{t("deliveryLabel")}: </span>
                  {t("deliveryDays", { range: delivery })}
                </span>
              ) : null}
            </span>
          </Link>
        ))}
        {rest.map(({ key, href, image, delivery }) => (
          <Link
            key={key}
            href={href}
            // Stays a light "product tile" in both themes, same call as the
            // desktop section: the renders are white-based and the dissolve
            // fades to white, so a dark surface would only look muddy. A
            // phone has no hover, so a press shrinks the tile a touch instead.
            className="flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200 transition-[background-color,scale] duration-150 active:bg-neutral-50 motion-safe:active:scale-[0.97] dark:ring-white/15"
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
              {/* One uniform dissolve for every tile — no per-card tuning at this
                  size. Final stop is white at alpha 0, never `transparent`:
                  `transparent` is rgba(0,0,0,0) and smears a grey band. */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-[26%] bg-linear-to-t from-white from-20% via-white/55 via-60% to-white/0"
              />
            </div>

            {/* Kicker over the short title, as on the desktop card; both fit
                one line in every locale, so no height is reserved for a second.
                `z-10` is load-bearing, same as the desktop card: the `fill`
                image above is absolutely positioned and would otherwise paint
                over this statically-positioned span, clipping its first line
                where the negative margin overlaps the frame. */}
            <span className="z-10 -mt-2 flex flex-col gap-1 px-3 pb-3">
              <span className="flex flex-col">
                <span className="truncate text-[11px] font-semibold text-primary-strong">
                  {t(`items.${key}.kicker`)}
                </span>
                <span className="line-clamp-2 text-[14px] font-bold leading-snug text-neutral-900">
                  {t(`items.${key}.title`)}
                </span>
              </span>
              {/* Just the days, same as the desktop card; the label is for
                  screen readers only. Both tiles of a row either have one (the
                  markets) or not, so rows stay level. */}
              {delivery ? (
                <span className="self-start rounded-full bg-neutral-100 px-2 py-0.5 text-[12px] font-bold text-neutral-900">
                  <span className="sr-only">{t("deliveryLabel")}: </span>
                  {t("deliveryDays", { range: delivery })}
                </span>
              ) : null}
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
          const cover = cdnImage(post.featured_image, "card");
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
                    // variant from `cdnImage(_, "card")` is the real sizing.
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
