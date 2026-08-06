import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import NotFoundBackButton from "./NotFoundBackButton";

const BUTTON_BASE =
  "inline-flex h-11 items-center justify-center rounded-md px-6 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

/** Hrefs stay locale-less — next-intl's `Link` adds the prefix. */
const QUICK_LINKS = [
  { href: "/japan", key: "japan" },
  { href: "/korea", key: "korea" },
  { href: "/garage", key: "ready" },
  { href: "/posts", key: "posts" },
] as const;

export default async function NotFoundView() {
  const [t, nav] = await Promise.all([
    getTranslations("notFound"),
    getTranslations("header.nav"),
  ]);

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center px-4 py-20 text-center lg:px-6 lg:py-28">
      <div className="relative isolate flex w-full flex-col items-center">
        {/* The only ornament on the page: one brand bloom behind the numeral,
            so the composition has depth without an illustration. */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-[38%] left-1/2 -z-10 size-[20rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary opacity-[0.10] blur-[110px] sm:size-[34rem] dark:opacity-[0.18]"
        />

        <div className="nf-rise">
          {/* Decorative: the HTTP status already carries this information, and
              reading "404" aloud before the sentence that explains it helps
              nobody. */}
          <p
            aria-hidden
            className="bg-linear-to-b from-neutral-900 via-neutral-700 to-neutral-300 bg-clip-text text-[6.5rem] leading-none font-semibold text-transparent sm:text-[9rem] lg:text-[11rem] dark:from-white dark:via-neutral-300 dark:to-neutral-600"
          >
            404
          </p>
          <h1 className="mt-1 text-2xl font-semibold lg:text-3xl">
            {t("title")}
          </h1>
        </div>

        <p className="nf-rise mt-3 max-w-md text-base text-secondary [animation-delay:60ms] dark:text-neutral-400">
          {t("description")}
        </p>

        <div className="nf-rise mt-8 flex flex-wrap items-center justify-center gap-3 [animation-delay:120ms]">
          <Link
            href="/"
            className={`${BUTTON_BASE} bg-primary text-white hover:bg-[#d63a21]`}
          >
            {t("home")}
          </Link>
          <NotFoundBackButton
            className={`${BUTTON_BASE} border border-black/10 text-neutral-800 hover:bg-black/[0.04] dark:border-white/15 dark:text-neutral-200 dark:hover:bg-white/[0.06]`}
          >
            {t("back")}
          </NotFoundBackButton>
        </div>

        <nav
          aria-labelledby="not-found-links"
          className="nf-rise mt-10 [animation-delay:180ms]"
        >
          <h2 id="not-found-links" className="sr-only">
            {t("linksLabel")}
          </h2>
          {/* The dots are dropped below `sm`: four labels never fit on one
              phone-width line, and a separator that wraps to the front of the
              next line reads as a typo. Spacing carries the separation there. */}
          <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[13px] sm:gap-x-2 sm:text-sm">
            {QUICK_LINKS.map((link, index) => (
              <li
                key={link.href}
                className="flex items-center gap-2 whitespace-nowrap"
              >
                {index > 0 && (
                  <span
                    aria-hidden
                    className="hidden text-neutral-300 sm:inline dark:text-neutral-700"
                  >
                    ·
                  </span>
                )}
                {/* The colour class sits on the anchor itself — antd's reset
                    paints a bare `<a>` blue and beats an inherited colour. */}
                <Link
                  href={link.href}
                  className="text-secondary underline-offset-4 transition-colors hover:text-primary hover:underline dark:text-neutral-400"
                >
                  {nav(link.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  );
}
