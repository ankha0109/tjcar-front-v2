# Custom 404 page

## Problem

The app has no `not-found.tsx` anywhere. Every 404 renders Next's built-in bare
page — white background, `404 | This page could not be found.`, no fonts, no
theme, no translations, no way back into the site.

Probing the dev server confirms both classes of miss render that bare page:

```
GET /mn/nope-page   → 404, <html id="__next_error__">…
GET /images/nope.png → 404, <html id="__next_error__">…
```

The `__next_error__` document means Next bypasses our layouts entirely. That is
the key constraint driving the design.

## Why a `[locale]/not-found.tsx` is not enough on its own

A URL that matches no route is routed by Next to the root-level `/_not-found`
entry. It never enters the `[locale]` segment, so `[locale]/not-found.tsx` would
only ever render for an explicit `notFound()` call from inside an already-matched
locale route. Unmatched URLs — the actual 404 case — would keep the bare page.

Two additions close that:

1. `src/app/[locale]/[...rest]/page.tsx` calls `notFound()`. Now an unmatched
   URL under a locale *does* match a route, so it renders inside
   `[locale]/layout.tsx` and hits `[locale]/not-found.tsx`.
2. `src/app/global-not-found.tsx` covers paths that never reach the locale
   segment. Next 16.2.6 still gates this convention behind
   `experimental.globalNotFound`, so `next.config.ts` must enable it.

Rejected alternative: a root `src/app/not-found.tsx`. The root layout is a
pass-through that renders `children` with no `<html>`/`<body>`, so Next renders
that boundary inside its own `__next_error__` document — no font, no theme, no
i18n. It cannot be made to look like the site.

## Which paths reach which file

`src/proxy.ts` matches everything except
`api`, `_next/static`, `_next/image`, `favicon.ico`, `images`, `webmanifest`,
`manifest`, `icon`, `sw`, `*.svg`. Everything it matches goes through
`next-intl` middleware and comes out locale-prefixed.

| Request | Handled by |
| --- | --- |
| `/mn/nope`, `/en/nope`, `/ru/nope` | `[locale]/[...rest]` → `[locale]/not-found.tsx` |
| `/nope` | middleware redirects to `/mn/nope` → same as above |
| `/de/xyz` (invalid locale) | middleware redirects to `/mn/de/xyz` → same as above |
| `/images/nope.png`, `/nope.svg` | `global-not-found.tsx` |
| `notFound()` from a real locale page | `[locale]/not-found.tsx` |

## Files

| File | Role |
| --- | --- |
| `src/components/pages/NotFoundView.tsx` | Server component. The whole visual. Takes translated strings and the link list as props. |
| `src/components/pages/NotFoundBackButton.tsx` | `"use client"`. The one interactive bit. |
| `src/app/[locale]/[...rest]/page.tsx` | Calls `notFound()`; exports `generateMetadata`. |
| `src/app/[locale]/not-found.tsx` | Translates and renders `NotFoundView` inside the shell. |
| `src/app/global-not-found.tsx` | Standalone document wrapping the same `NotFoundView`. |
| `src/app/globals.css` | One `@keyframes` for the mount animation. |
| `messages/{mn,en,ru}.json` | New `notFound` namespace. |
| `next.config.ts` | `experimental: { globalNotFound: true }`. |

### The provider constraint

`global-not-found.tsx` replaces the whole document — it does not render the root
layout or `[locale]/layout.tsx`, so there is no `NextIntlClientProvider`, no
`AntdProvider`, no `AntdRegistry`, no React Query.

Therefore `NotFoundView` must depend on **no provider and no antd component**.
Buttons are Tailwind-styled elements, not `<Button>`. This is what keeps the two
renderings pixel-identical.

Linking is injected rather than imported. `NotFoundView` takes a
`linkComponent: ComponentType<{href: string; className?: string; children: ReactNode}>`
prop:

- `[locale]/not-found.tsx` passes `Link` from `@/i18n/navigation` and
  locale-less hrefs (`/japan`) — the project's routing rule holds where a
  provider exists.
- `global-not-found.tsx` passes `({href, ...rest}) => <a href={href} {...rest} />`
  and fully-prefixed hrefs (`/mn/japan`), since next-intl's `Link` has no
  provider to read from there.

The href shape is therefore the caller's responsibility, not the view's.

`NotFoundBackButton` is a bare client component using `window.history` only — no
router hook — so it works in both trees.

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
  Content is vertically centred with generous `py`.
- **Numeral** — `text-[6.5rem] sm:text-[9rem] lg:text-[11rem]`, `font-semibold`,
  `leading-none`, `bg-clip-text text-transparent`.
  Light `from-neutral-900 via-neutral-700 to-neutral-300`;
  dark `from-white via-neutral-300 to-neutral-600`.
  No `tracking-*` and no `font-mono` — both are banned in this project.
- **Glow** — one absolutely positioned radial gradient in `#f1472c`, `blur-3xl`,
  opacity `.10` light / `.16` dark, `aria-hidden`, `pointer-events-none`.
- **Title** — `<h1>`, `text-2xl lg:text-3xl font-semibold`.
- **Body** — `max-w-md`, secondary text colour, `text-base`.
- **Buttons** — `h-11 rounded-md px-6`, wrapped in `flex-wrap justify-center gap-3`.
  Primary is `bg-primary text-white`; secondary is a bordered ghost.
- **Quick links** — `text-sm`, separated by `·` spans marked `aria-hidden`.
  The colour class goes **on the anchor itself**: antd's reset colours a bare
  `<a>` blue and beats an inherited colour from a parent.
  Labels reuse `header.nav`: `japan`, `korea`, `ready`, `posts` →
  `/japan`, `/korea`, `/garage`, `/posts`.
- **Motion** — one-shot fade-up on mount via a `@keyframes` in `globals.css`,
  applied to three groups with `animation-delay` `0 / 60ms / 120ms`:
  (1) numeral + title, (2) description, (3) buttons + quick links.
  Disabled under `prefers-reduced-motion: reduce`. CSS only — no JS, so the
  server HTML is never hidden.
- **Accessibility** — the `<h1>` carries the title. The big numeral is
  `aria-hidden` decoration; the HTTP status already says 404. The quick-link row
  is a `<nav>` with an `sr-only` heading from `notFound.linksLabel`.
- **Mobile** — the `@mobileHeader` slot falls through to `[...rest]/page.tsx`,
  which renders `DefaultMobileHeader` (logo, compare, hamburger, no title), so
  the page title is not duplicated in the bar.

### Back button behaviour

```
if (document.referrer starts with location.origin) history.back()
else                                              location.assign(homeHref)
```

The referrer check avoids a dead button when the 404 is the first page in the
tab. `homeHref` is passed in so the locale version can point at `/{locale}`.

## Translations

New `notFound` namespace, added to all three message files.

| Key | mn | en | ru |
| --- | --- | --- | --- |
| `title` | Хуудас олдсонгүй | Page not found | Страница не найдена |
| `description` | Таны хайсан хуудас устсан, нүүсэн эсвэл хаяг нь буруу байна. | The page you were looking for was removed, moved, or the address is wrong. | Запрашиваемая страница удалена, перемещена или адрес указан неверно. |
| `home` | Нүүр хуудас | Home | На главную |
| `back` | Буцах | Go back | Назад |
| `linksLabel` | Түгээмэл хэсгүүд | Popular sections | Популярные разделы |

`global-not-found.tsx` renders in `routing.defaultLocale` (`mn`) — it has no
locale segment to read from.

## Edge cases

1. **Catch-all shadowing existing routes** — the main regression risk. Next
   ranks specific segments above a catch-all, so `/mn/japan/123` still resolves
   to `japan/[id]`, but every top-level route must be re-checked after the
   change.
2. `[locale]/@mobileHeader/[...rest]/page.tsx` already exists. Adding
   `[locale]/[...rest]/page.tsx` in the children slot is a sibling in a
   different slot, not a conflict. It must stay `[...rest]`, never
   `[[...rest]]` — an optional catch-all collides with `/[locale]/dashboard`
   and fails the build.
3. `/dashboard/*` auth redirects and the `/cars/*` → `/garage/*` redirects both
   run before routing, so they are unaffected.
4. `global-not-found.tsx` must import `./globals.css` itself and set
   `<html data-theme>` from the `theme` cookie, because it bypasses both
   layouts. It also declares its own `viewport` and `metadata`. It does not need
   `--header-h` — there is no fixed header in that tree.
5. **Metadata for the locale 404** — `not-found.tsx` cannot export metadata.
   `generateMetadata` on the catch-all page is the attempt; if Next discards it
   when the page throws `notFound()`, the layout's default title stands. This is
   cosmetic and is not worth further work either way.
6. `experimental.globalNotFound` is still experimental in Next 16.2.6. The flag
   gets a comment recording why it is there so a future upgrade can drop it.

## Verification

Status codes, dev server on port 2500:

- `/mn/nope`, `/en/nope`, `/ru/nope`, `/images/nope.png` → **404**, new markup
  (no `__next_error__` in the response).

Regression sweep, all expected **200**:
`/mn`, `/mn/japan`, `/mn/korea`, `/mn/garage`, `/mn/posts`, `/mn/about`,
`/mn/compare`, `/mn/wishlist`, `/mn/report`, `/mn/auth/login`, plus one real
`japan/[id]` and one real `posts/[slug]`.
`/mn/dashboard` while signed out → **302** to `/mn/auth/login`.

Visual: desktop and mobile, light and dark. Mobile screenshots go through CDP
`setDeviceMetricsOverride` — `--window-size` below ~485px lies on macOS.

`npm run build` must pass; `next.config.ts` gains an experimental flag, so a
build-time warning about it is expected and acceptable.
