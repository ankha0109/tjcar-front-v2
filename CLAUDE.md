# Project guide

## i18n

- Supported locales: `mn` (default), `en`, `ru`. URL prefix is required for all (`/mn/...`, `/en/...`, `/ru/...`).
- All app routes live under `src/app/[locale]/`. Root `src/app/layout.tsx` is a minimal pass-through that only imports `globals.css`.
- API routes (`src/app/api/*`) live OUTSIDE the locale segment. They are not locale-prefixed.

## Locale-aware navigation

Use these from `@/i18n/navigation` (NOT `next/link` or `next/navigation` for routing):

- `Link`
- `useRouter`
- `usePathname`
- `redirect`

Keep `next/navigation` for `useSearchParams`, `notFound`, and for any redirect target that lives under `/api/*`.

## Translations

- Files: `messages/{mn,en,ru}.json`. Add any new key to ALL three locales.
- Server components: `const t = await getTranslations("namespace");` and call `setRequestLocale(locale)` once.
- Client components: `const t = useTranslations("namespace");`
- Use ICU placeholders for interpolation: `t("key", { name: "...", count: 3 })`.

## Page container

Every top-level page/section wrapper uses the SAME container so its edges line up with
the header and footer:

```
mx-auto w-full max-w-7xl px-4 lg:px-6
```

- `DesktopHeader`, `DesktopFooter` and `MobileHeader` (`px-4`, no max width) follow it too —
  changing the padding in one place means changing it everywhere.
- Vertical padding is free (`py-8`, `pb-12 pt-6`, …); only the horizontal scale is fixed.
- Car detail pages keep `px-0 lg:px-6` on purpose — the gallery is full-bleed on mobile.

## API and headers

- Every API request includes `Accept-Language: <locale>` automatically:
  - Client: `src/services/Api.ts` reads the `NEXT_LOCALE` cookie.
  - Server: `src/services/ServerApi.ts` calls `getLocale()` from `next-intl/server`.
  - Proxy: `src/app/api/v1/[...path]/route.ts` forwards the incoming `Accept-Language` header to the backend.

## Antd locale

`AntdProvider` receives `locale` from the locale layout and switches antd's `ConfigProvider locale` + `dayjs.locale()` to match. Adding a new locale requires updating both `ANTD_LOCALES` and `DAYJS_LOCALES` maps.

## Middleware

`src/proxy.ts` (Next.js 16 renamed `middleware.ts` to `proxy.ts`) combines:

1. Auth guard for `/dashboard/*` (locale-aware redirect to `/{locale}/auth/login` on missing JWT).
2. `next-intl/middleware` for locale detection and prefix normalisation.

The exported function MUST be named `proxy` (Next.js 16 convention).
