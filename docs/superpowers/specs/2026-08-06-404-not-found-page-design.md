# Custom 404 page

## Problem

The app had no `not-found.tsx` anywhere. Every 404 rendered Next's built-in bare
page — white background, `404 | This page could not be found.`, no fonts, no
theme, no translations, no way back into the site.

## Why a `[locale]/not-found.tsx` is not enough on its own

A URL that matches no route is sent by Next to the root-level `/_not-found`
entry. It never enters the `[locale]` segment, so `[locale]/not-found.tsx` would
only ever render for an explicit `notFound()` call from inside an already-matched
locale route. Unmatched URLs — the actual 404 case — would keep the bare page.

`src/app/[locale]/[...rest]/page.tsx` closes that: it calls `notFound()`, so an
unmatched URL under a locale *does* match a route, renders inside
`[locale]/layout.tsx`, and hits `[locale]/not-found.tsx`.

## Which paths reach it

`src/proxy.ts` matches everything except
`api`, `_next/static`, `_next/image`, `favicon.ico`, `images`, `webmanifest`,
`manifest`, `icon`, `sw`, `*.svg`. Everything it matches goes through
`next-intl` middleware and comes out locale-prefixed.

| Request | Handled by |
| --- | --- |
| `/mn/nope`, `/en/nope`, `/ru/nope` | `[locale]/[...rest]` → `[locale]/not-found.tsx` |
| `/nope` | middleware redirects to `/mn/nope` → same as above |
| `/de/xyz` (invalid locale) | middleware redirects to `/mn/de/xyz` → same as above |
| `notFound()` from a real locale page | `[locale]/not-found.tsx` |
| `/images/nope.png`, `/nope.svg` | Next's static file handler — never reaches the router |
| `/api/typo`, `/sw.js` | Next's built-in 404 |

Every URL a visitor can actually navigate to is in the first four rows.

## `global-not-found.tsx` was tried and dropped

The plan was to cover the last two rows with `src/app/global-not-found.tsx`,
which supplies its own `<html>`/`<body>` and so does not need a root layout.
Two findings killed it:

1. **It does not work here.** With `experimental.globalNotFound: true` set and
   confirmed active in the dev log, neither the real file nor a three-line
   placeholder ever rendered — `/api/typo` and `/sw.js` kept serving Next's
   built-in 404. The convention is still experimental in Next 16.2.6.
2. **It would cover nothing user-facing anyway.** `/images/*` and `*.svg` are
   excluded from the proxy matcher, so Next's static file handler answers them
   before the router is involved. What is left is API typos and `/sw.js`.

So the file and the experimental flag were removed. Every path a person can
navigate to is locale-prefixed and covered by the route above.

## The 404 renders client-side

A thrown `notFound()` aborts the flight render, so Next serves its own
`<html id="__next_error__">` seed as the SSR document and React fills the real
page in on hydration. Verified in a headless browser: the hydrated document is
`<html lang="mn" data-theme="light">` with the full shell, the right title, and
locale-correct links.

This is Next's behaviour, not a consequence of the pass-through root layout —
giving `src/app/layout.tsx` its own `<html>`/`<body>` as a probe changed nothing.
It is also not worth trading away: the only way to render the page server-side is
to drop `notFound()` and return 200, and a soft 404 is worse than a blank body
for the crawlers that care. The 404 status and Next's `noindex` meta are both set
server-side, which is what those crawlers act on.

## Files

| File | Role |
| --- | --- |
| `src/components/pages/NotFoundView.tsx` | Server component. The whole visual, translations included. |
| `src/components/pages/NotFoundBackButton.tsx` | `"use client"`. The one interactive bit. |
| `src/app/[locale]/[...rest]/page.tsx` | Calls `notFound()`; pins the locale; exports `generateMetadata`. |
| `src/app/[locale]/not-found.tsx` | Renders `NotFoundView`. |
| `src/app/globals.css` | `nf-rise` keyframes for the entrance. |
| `messages/{mn,en,ru}.json` | New `notFound` namespace. |

The not-found boundary renders without route params of its own, so the catch-all
calls `setRequestLocale(locale)` before throwing. Without it `getTranslations()`
falls back to `mn` and an English or Russian visitor gets a Mongolian 404.

## Visual design

Minimal typographic. No illustration, no Lottie, no image.

```
┌───────────────────────────────────────────────┐
│           ·  soft brand-red glow  ·           │
│                4 0 4                          │
│         Хуудас олдсонгүй                      │
│    Таны хайсан хуудас устсан, нүүсэн          │
│    эсвэл хаяг нь буруу байна.                 │
│    ┌──────────────┐  ┌──────────────┐         │
│    │ Нүүр хуудас  │  │   Буцах      │         │
│    └──────────────┘  └──────────────┘         │
│  Япон машин · Солонгос машин ·                │
│  Бэлэн машин · Мэдээ мэдээлэл                 │
└───────────────────────────────────────────────┘
```

- Container is the project-wide `mx-auto w-full max-w-7xl px-4 lg:px-6`.
  Content is `flex-1` and vertically centred inside the shell's `<main>`.
- **Numeral** — `text-[6.5rem] sm:text-[9rem] lg:text-[11rem]`, `font-semibold`,
  `leading-none`, `bg-clip-text text-transparent`.
  Light `from-neutral-900 via-neutral-700 to-neutral-300`;
  dark `from-white via-neutral-300 to-neutral-600`.
  No `tracking-*` and no `font-mono` — both are banned in this project.
- **Glow** — one absolutely positioned radial gradient in `#f1472c`,
  `blur-[110px]`, opacity `.10` light / `.18` dark, `aria-hidden`,
  `pointer-events-none`. Smaller below `sm` so it does not wash out a phone.
- **Title** — `<h1>`, `text-2xl lg:text-3xl font-semibold`.
- **Body** — `max-w-md`, secondary text colour, `text-base`.
- **Buttons** — `h-11 rounded-md px-6` in a `flex-wrap justify-center gap-3` row,
  with `focus-visible` outlines. Primary is `bg-primary text-white`; secondary is
  a bordered ghost.
- **Quick links** — `whitespace-nowrap` items in a wrapping row. The `·`
  separators are `hidden sm:inline`: four labels never fit on one phone-width
  line, and a separator that wraps to the front of the next line reads as a typo,
  so spacing carries the separation below `sm`.
  The colour class goes **on the anchor itself** — antd's reset colours a bare
  `<a>` blue and beats an inherited colour.
  Labels reuse `header.nav`: `japan`, `korea`, `ready`, `posts` →
  `/japan`, `/korea`, `/garage`, `/posts`, locale-less because next-intl's `Link`
  adds the prefix.
- **Motion** — one `nf-rise` keyframe, three groups at `animation-delay`
  `0 / 60ms / 120ms / 180ms`, `backwards` fill so a delayed group does not flash
  in first. Disabled under `prefers-reduced-motion: reduce`. CSS only.
- **Accessibility** — the `<h1>` carries the title. The big numeral is
  `aria-hidden` decoration. The quick-link row is a `<nav>` with an `sr-only`
  heading from `notFound.linksLabel`.
- **Mobile** — the `@mobileHeader` slot falls through to `[...rest]/page.tsx`,
  which renders `DefaultMobileHeader` (logo, compare, hamburger, no title), so
  the page title is not duplicated in the bar.

### Back button behaviour

```
if (document.referrer starts with location.origin) router.back()
else                                               router.push("/")
```

The referrer check avoids a dead button when the 404 is the first page in the
tab — a mistyped address or a stale link from somewhere else.

## Translations

New `notFound` namespace in all three message files.

| Key | mn | en | ru |
| --- | --- | --- | --- |
| `title` | Хуудас олдсонгүй | Page not found | Страница не найдена |
| `description` | Таны хайсан хуудас устсан, нүүсэн эсвэл хаяг нь буруу байна. | The page you were looking for was removed, moved, or the address is wrong. | Запрашиваемая страница удалена, перемещена или адрес указан неверно. |
| `home` | Нүүр хуудас | Home | На главную |
| `back` | Буцах | Go back | Назад |
| `linksLabel` | Түгээмэл хэсгүүд | Popular sections | Популярные разделы |

## Edge cases

1. **Catch-all shadowing existing routes** — the main regression risk. Next ranks
   specific segments above a catch-all; verified by sweeping every top-level
   route plus real `japan/[id]`, `korea/[id]`, `garage/[id]` and `posts/[slug]`
   ids.
2. `[locale]/@mobileHeader/[...rest]/page.tsx` already existed. The new
   `[locale]/[...rest]/page.tsx` is a sibling in a different slot, not a
   conflict. It must stay `[...rest]`, never `[[...rest]]` — an optional
   catch-all collides with `/[locale]/dashboard` and fails the build.
3. `/dashboard/*` auth redirects and the `/cars/*` → `/garage/*` redirects both
   run before routing, so they are unaffected.
4. `/mn/japan/<bad-id>` still answers 200 — the detail page handles a missing car
   itself. Pre-existing, out of scope here.

## Verification

Run against `next dev` on 2500 and a production build on 2502.

- `/mn/nope-page`, `/en/nope-page`, `/ru/nope-page` → **404**.
- Regression sweep, all **200**: `/mn`, `/en`, `/ru`, `/mn/japan`, `/mn/korea`,
  `/mn/garage`, `/mn/posts`, `/mn/about`, `/mn/compare`, `/mn/wishlist`,
  `/mn/report`, `/mn/auth/login`, `/mn/japan/brands`, `/mn/korea/brands`,
  `/mn/home-v2`, plus real `japan/05LKUKahMDL0wv`, `korea/40411863`,
  `garage/85`, `posts/toyota-prius-50-51-55-zagvaruudyn-yalgaa`.
  `/mn/dashboard/nope` → **307** to login while signed out.
- Hydrated DOM checked in headless Chrome for `mn` and `en`: correct `<html lang>`,
  title, heading, description and locale-prefixed links in each.
- Screenshots: desktop and phone shell, light and dark.
- `npx tsc --noEmit` clean; `npm run lint` reports only pre-existing issues;
  `npm run build` passes.

Mobile screenshots were taken at 500px, not 390px: `--window-size` below ~485px
lies on macOS and crops the frame, which reads as a layout overflow that is not
there. CDP `setDeviceMetricsOverride` would be the fix but hung repeatedly in
this session.
