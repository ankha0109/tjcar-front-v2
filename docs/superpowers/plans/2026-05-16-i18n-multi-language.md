# i18n Multi-Language (mn/en/ru) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Энэ Next.js 16 App Router төслийг `mn` (default), `en`, `ru` гурван хэлээр URL prefix routing-тэйгээр ажиллуулна. Хэрэглэгч Header dropdown-оор хэл солино.

**Architecture:** `next-intl` v3+ ашиглана. `[locale]` segment бүх app route-ыг хамарна. `middleware.ts` нь next-intl-ийн locale handling-ийг next-auth-ийн dashboard guard-тай нэгтгэнэ. Антд `ConfigProvider` идэвхтэй хэлд тохирсон locale авна. API request бүхэн `Accept-Language` header дамжуулна.

**Tech Stack:** Next.js 16 (App Router), React 19, `next-intl` v3+, Ant Design 6, next-auth 5 (beta), Tailwind 4.

**Reference spec:** `docs/superpowers/specs/2026-05-16-i18n-multi-language-design.md`

**Verification approach:** Энэ төсөлд unit test framework суулгагдаагүй. Task бүрийн дараа `npm run build`, `npm run lint`, шаардлагатай үед `npm run dev` ажиллуулж browser дээр /, /en, /ru шалгана. Хэлийн switcher шалгахдаа DevTools → Application → Cookies → `NEXT_LOCALE` харна. API header шалгахдаа DevTools → Network → request → Headers → `Accept-Language` харна.

---

## File Structure Overview

**Create:**
- `src/i18n/routing.ts` — locales, defaultLocale, localePrefix
- `src/i18n/request.ts` — server-side message loader
- `src/i18n/navigation.ts` — Link, useRouter, redirect wrappers
- `src/middleware.ts` — combined next-intl + auth middleware
- `messages/mn.json`, `messages/en.json`, `messages/ru.json` — translation files
- `src/components/layout/LanguageSwitcher.tsx` — header dropdown
- `src/app/[locale]/layout.tsx` — locale layout (moves from `src/app/layout.tsx`)

**Move/relocate (под [locale]):**
- `src/app/page.tsx` → `src/app/[locale]/page.tsx`
- `src/app/auth/**` → `src/app/[locale]/auth/**`
- `src/app/dashboard/**` → `src/app/[locale]/dashboard/**`

**Modify:**
- `src/app/layout.tsx` — root болгож html/body л үлдэнэ (locale layout дотогш бараг бүх агуулга шилжинэ)
- `src/proxy.ts` — устгана (middleware.ts руу шилжинэ)
- `src/providers/AntdProvider.tsx` — locale prop динамик
- `src/services/Api.ts` — Accept-Language header нэмнэ
- `src/services/ServerApi.ts` — Accept-Language header нэмнэ
- `src/app/api/proxy/[...path]/route.ts` — Accept-Language header forward
- `src/auth.ts` — `signIn` page path locale-агноститэй болно (manual routing)
- `src/components/layout/Header.tsx` — LanguageSwitcher нэмж текст орчуулна
- `src/components/layout/Footer.tsx`, `src/components/layout/NewsletterForm.tsx`, `src/components/layout/MobileBottomNav.tsx`, `src/components/pages/LoginForm.tsx`, `src/app/[locale]/auth/login/page.tsx`, `src/app/[locale]/dashboard/page.tsx`, `src/app/[locale]/dashboard/tracking/page.tsx`, `src/components/cards/FeaturedAuctionFilters.tsx`, `src/components/cards/FeaturedCard.tsx` — текст орчуулна
- `next.config.ts` — next-intl plugin wrap

---

## Task 1: Install `next-intl` and create i18n config

**Files:**
- Modify: `package.json`
- Create: `src/i18n/routing.ts`
- Create: `src/i18n/navigation.ts`
- Create: `src/i18n/request.ts`
- Create: `messages/mn.json`
- Create: `messages/en.json`
- Create: `messages/ru.json`
- Modify: `next.config.ts`

- [ ] **Step 1: Install next-intl**

```bash
npm install next-intl
```

Expected output: `added 1 package`. Verify `next-intl` appears in `package.json` dependencies.

- [ ] **Step 2: Create `src/i18n/routing.ts`**

```ts
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["mn", "en", "ru"] as const,
  defaultLocale: "mn",
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];
```

- [ ] **Step 3: Create `src/i18n/navigation.ts`**

```ts
import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
```

- [ ] **Step 4: Create `src/i18n/request.ts`**

```ts
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
```

- [ ] **Step 5: Create message files with minimal seed content**

`messages/mn.json`:

```json
{
  "common": {
    "loading": "Уншиж байна...",
    "language": {
      "label": "Хэл",
      "mn": "Монгол",
      "en": "English",
      "ru": "Русский"
    }
  }
}
```

`messages/en.json`:

```json
{
  "common": {
    "loading": "Loading...",
    "language": {
      "label": "Language",
      "mn": "Монгол",
      "en": "English",
      "ru": "Русский"
    }
  }
}
```

`messages/ru.json`:

```json
{
  "common": {
    "loading": "Загрузка...",
    "language": {
      "label": "Язык",
      "mn": "Монгол",
      "en": "English",
      "ru": "Русский"
    }
  }
}
```

- [ ] **Step 6: Update `next.config.ts` to wrap with next-intl plugin**

Replace the entire file with:

```ts
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  env: {
    CDN_URL: "https://storage.googleapis.com",
  },
  reactStrictMode: false,
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
};

export default withNextIntl(nextConfig);
```

- [ ] **Step 7: Verify build still passes**

Run: `npm run build`

Expected: build succeeds (no runtime behavior change yet — `[locale]` segment-гүй учир next-intl идэвхгүй).

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json src/i18n/ messages/ next.config.ts
git commit -m "feat(i18n): install next-intl and add config scaffolding"
```

---

## Task 2: Combine middleware (next-intl + auth)

**Files:**
- Create: `src/middleware.ts`
- Delete: `src/proxy.ts`

> **Background:** Одоо `src/proxy.ts`-д `/dashboard/*` route-ыг next-auth jwt-ээр хамгаалдаг middleware байна. Үүнийг устгаж `src/middleware.ts` дотор next-intl middleware-тэй нэгтгэнэ. (Next.js root-аас `middleware.ts` файлыг л middleware гэж танина — `proxy.ts` нэр аль хэдийн convention биш.)

- [ ] **Step 1: Create `src/middleware.ts`**

```ts
import createIntlMiddleware from "next-intl/middleware";
import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { SESSION_TOKEN_COOKIE } from "@/lib/authCookies";

const intlMiddleware = createIntlMiddleware(routing);

const PROTECTED_SEGMENTS = ["/dashboard"];

function stripLocale(pathname: string): string {
  for (const locale of routing.locales) {
    if (pathname === `/${locale}`) return "/";
    if (pathname.startsWith(`/${locale}/`)) return pathname.slice(locale.length + 1);
  }
  return pathname;
}

function getLocaleFromPath(pathname: string): string {
  for (const locale of routing.locales) {
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      return locale;
    }
  }
  return routing.defaultLocale;
}

export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  const pathWithoutLocale = stripLocale(pathname);
  const locale = getLocaleFromPath(pathname);

  const isProtected = PROTECTED_SEGMENTS.some(
    (seg) => pathWithoutLocale === seg || pathWithoutLocale.startsWith(`${seg}/`),
  );

  if (isProtected) {
    const token = await getToken({
      req,
      secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === "production",
      cookieName: SESSION_TOKEN_COOKIE,
    });
    if (!token?.accessToken) {
      const currentPath = `${pathname}${searchParams.toString() ? "?" + searchParams.toString() : ""}`;
      return NextResponse.redirect(
        new URL(
          `/${locale}/auth/login?callbackUrl=${encodeURIComponent(currentPath)}`,
          req.url,
        ),
      );
    }
  }

  const intlResponse = intlMiddleware(req);
  intlResponse.headers.set("x-pathname", pathname);
  return intlResponse;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|webmanifest|manifest|icon|sw|.*\\.svg).*)",
  ],
};
```

- [ ] **Step 2: Delete `src/proxy.ts`**

```bash
git rm src/proxy.ts
```

- [ ] **Step 3: Verify build passes**

Run: `npm run build`

Expected: build succeeds. (Routes хараахан `[locale]` segment-д шилжээгүй учир middleware-ийн локал redirect одоохондоо ажиллахгүй — Task 3-т туршина.)

- [ ] **Step 4: Commit**

```bash
git add src/middleware.ts
git commit -m "feat(i18n): combine next-intl and next-auth middleware"
```

---

## Task 3: Move routes into `[locale]` segment

**Files:**
- Move: `src/app/page.tsx` → `src/app/[locale]/page.tsx`
- Move: `src/app/auth/**` → `src/app/[locale]/auth/**`
- Move: `src/app/dashboard/**` → `src/app/[locale]/dashboard/**`
- Move: `src/app/layout.tsx` → `src/app/[locale]/layout.tsx` (агуулга)
- Create: `src/app/layout.tsx` (шинэ, минимал root)

> **Note:** Next.js docs зөвлөж байна — `[locale]/layout.tsx` дотор `<html>`/`<body>` барина, root layout-д. Гэхдээ App Router-т root layout заавал шаардлагатай. Тиймээс root `layout.tsx`-д хоосон pass-through хийнэ.

- [ ] **Step 1: Создать `[locale]` directory and move files**

```bash
mkdir -p src/app/\[locale\]
git mv src/app/page.tsx src/app/\[locale\]/page.tsx
git mv src/app/auth src/app/\[locale\]/auth
git mv src/app/dashboard src/app/\[locale\]/dashboard
git mv src/app/layout.tsx src/app/\[locale\]/layout.tsx
```

`src/app/api/` болон `src/app/globals.css`, `src/app/favicon.ico` ХӨДЛӨХГҮЙ.

- [ ] **Step 2: Update moved `src/app/[locale]/layout.tsx`**

Файлыг бүхэлд нь дараах болгож солих:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import AntdProvider from "@/providers/AntdProvider";
import { auth } from "@/auth";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import { routing } from "@/i18n/routing";

const inter = Inter({ subsets: ["latin"] });

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    title: {
      default: t("title.default"),
      template: t("title.template"),
    },
    description: t("description"),
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

async function safeAuth() {
  try {
    return await auth();
  } catch {
    return null;
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);

  const [session, messages] = await Promise.all([safeAuth(), getMessages()]);

  return (
    <html lang={locale}>
      <body className={`${inter.className} antialiased`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AntdRegistry>
            <AntdProvider session={session} locale={locale}>
              <div className="flex flex-col min-h-screen bg-white">
                <Header />
                <main className="flex-1 flex flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
                  {children}
                </main>
                <Footer />
                <MobileBottomNav />
              </div>
            </AntdProvider>
          </AntdRegistry>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Create minimal new `src/app/layout.tsx`**

```tsx
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
```

> Энэ нь App Router-ийн root layout шаардлагыг хангана. `<html>`/`<body>` `[locale]/layout.tsx`-д үүсэх ба next-intl docs-т санал болгосон загвар.

- [ ] **Step 4: Add metadata namespace to all messages files**

`messages/mn.json`-д `common` дотор:

```json
{
  "common": { ... },
  "metadata": {
    "title": {
      "default": "Эхлэл",
      "template": "%s | TJ Car"
    },
    "description": "TJ Car - Японы машин дуудлага худалдаа"
  }
}
```

`messages/en.json`:

```json
{
  "common": { ... },
  "metadata": {
    "title": {
      "default": "Home",
      "template": "%s | TJ Car"
    },
    "description": "TJ Car - Japanese car auction service"
  }
}
```

`messages/ru.json`:

```json
{
  "common": { ... },
  "metadata": {
    "title": {
      "default": "Главная",
      "template": "%s | TJ Car"
    },
    "description": "TJ Car - Японские автомобильные аукционы"
  }
}
```

- [ ] **Step 5: Update AntdProvider to accept locale prop (placeholder for Task 4)**

Файл [src/providers/AntdProvider.tsx](src/providers/AntdProvider.tsx)-д type-д `locale` нэмэх (логик Task 4-т):

```tsx
type AntdProviderProps = {
  children?: React.ReactNode;
  session?: Session | null;
  locale?: string;
};

const AntdProvider: React.FC<AntdProviderProps> = ({ children, session, locale: _locale }) => {
```

Бусад өөрчлөлт хийхгүй.

- [ ] **Step 6: Verify build and routes**

Run: `npm run build`

Expected: build succeeds.

Run: `npm run dev`

Manual check:
- Open `http://localhost:2500/` → redirect to `http://localhost:2500/mn` (next-intl middleware-ийн ажил)
- Open `http://localhost:2500/en` → page renders, `<html lang="en">`
- Open `http://localhost:2500/ru` → page renders, `<html lang="ru">`
- Open `http://localhost:2500/en/dashboard` (signed out) → redirect to `/en/auth/login?callbackUrl=...`

Stop dev server (Ctrl+C).

- [ ] **Step 7: Commit**

```bash
git add src/app/ messages/ src/providers/AntdProvider.tsx
git commit -m "feat(i18n): move routes into [locale] segment"
```

---

## Task 4: Wire AntdProvider locale to active language

**Files:**
- Modify: `src/providers/AntdProvider.tsx`

- [ ] **Step 1: Replace `src/providers/AntdProvider.tsx`**

```tsx
"use client";

import { App, ConfigProvider, message } from "antd";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import dayjs from "dayjs";
import GuideModalRoot from "@/components/modal/GuideModalRoot";
import mn_MN from "antd/locale/mn_MN";
import en_US from "antd/locale/en_US";
import ru_RU from "antd/locale/ru_RU";
import "dayjs/locale/mn";
import "dayjs/locale/en";
import "dayjs/locale/ru";
import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { StyleProvider } from "@ant-design/cssinjs";
import type { Locale as AntdLocale } from "antd/es/locale";

type AntdProviderProps = {
  children?: React.ReactNode;
  session?: Session | null;
  locale?: string;
};

const ANTD_LOCALES: Record<string, AntdLocale> = {
  mn: mn_MN,
  en: en_US,
  ru: ru_RU,
};

const DAYJS_LOCALES: Record<string, string> = {
  mn: "mn",
  en: "en",
  ru: "ru",
};

const AntdProvider: React.FC<AntdProviderProps> = ({ children, session, locale = "mn" }) => {
  const [, contextHolder] = message.useMessage();

  dayjs.locale(DAYJS_LOCALES[locale] ?? "en");

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });

  return (
    <SessionProvider session={session} refetchOnWindowFocus={false}>
      <QueryClientProvider client={queryClient}>
        <StyleProvider layer>
          <ConfigProvider
            locale={ANTD_LOCALES[locale] ?? en_US}
            theme={{
              token: {
                fontFamily: "Inter, sans-serif",
                colorPrimary: "#F1472C",
                colorLink: "#222",
                colorLinkHover: "#000",
              },
            }}
          >
            <App className="w-full mx-auto min-h-screen flex flex-col">
              {contextHolder}
              {children}
              <GuideModalRoot />
            </App>
          </ConfigProvider>
        </StyleProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
};

export default AntdProvider;
```

- [ ] **Step 2: Verify build**

Run: `npm run build`

Expected: build succeeds.

- [ ] **Step 3: Manual verify antd locale change**

Run: `npm run dev`

Open `/en/auth/login` → form validation message (хоосон submit оролдоход) англиар гарна. Stop dev server.

- [ ] **Step 4: Commit**

```bash
git add src/providers/AntdProvider.tsx
git commit -m "feat(i18n): wire antd ConfigProvider locale to active language"
```

---

## Task 5: Replace `next/link` and `next/navigation` usage with `@/i18n/navigation`

**Files:** дараах файлуудаас `next/link` болон `next/navigation`-ийн `Link`, `useRouter`, `usePathname`, `redirect`-ийг `@/i18n/navigation`-аас орлуулна.

Scan хийх:

```bash
grep -rn --include="*.tsx" --include="*.ts" 'from "next/link"' src/ | grep -v node_modules
grep -rn --include="*.tsx" --include="*.ts" 'from "next/navigation"' src/ | grep -v node_modules
```

> **Чухал:** `next/navigation`-ийн зөвхөн routing API-ыг солино (`useRouter`, `usePathname`, `redirect`, `useSearchParams`-ыг ҮГҮЙ — энэ хэвээр next/navigation-аас). Хадаасан Link import-уудыг бүгдийг солино.

- [ ] **Step 1: Update Header imports**

[src/components/layout/Header.tsx](src/components/layout/Header.tsx)-д:

Хуучин:

```tsx
import Link from "next/link";
import { usePathname } from "next/navigation";
```

Шинэ:

```tsx
import { Link, usePathname } from "@/i18n/navigation";
```

- [ ] **Step 2: Update Footer imports**

[src/components/layout/Footer.tsx](src/components/layout/Footer.tsx)-д `next/link` -> `@/i18n/navigation`. (Файлыг нээж `next/link`-ийн import-г сольж хадгална.)

- [ ] **Step 3: Update MobileBottomNav imports**

[src/components/layout/MobileBottomNav.tsx](src/components/layout/MobileBottomNav.tsx)-д ижил солих.

- [ ] **Step 4: Update LoginForm imports**

[src/components/pages/LoginForm.tsx](src/components/pages/LoginForm.tsx)-д `next/link` болон `next/navigation`-ийн `useRouter`/`redirect`-ийг `@/i18n/navigation`-аас оруулна. `useSearchParams` бол `next/navigation`-аас хэвээр.

- [ ] **Step 5: Sweep remaining files**

Scan-ы үлдсэн файл бүхэнд:

```bash
grep -rln --include="*.tsx" --include="*.ts" 'from "next/link"' src/
```

Файл бүрд `from "next/link"` import-ийг `import { Link } from "@/i18n/navigation";` болгож сольж, олон import нэгтгэнэ.

- [ ] **Step 6: Verify build and lint**

```bash
npm run build && npm run lint
```

Expected: хоёулаа амжилттай.

- [ ] **Step 7: Manual verify**

Run: `npm run dev`

`/en` хуудсан дээр Link дарж test (Header navigation, footer link) — URL `/en/...` болж хэвээр байна (locale алдагдахгүй). Stop dev server.

- [ ] **Step 8: Commit**

```bash
git add src/
git commit -m "feat(i18n): switch to locale-aware navigation helpers"
```

---

## Task 6: LanguageSwitcher component in Header

**Files:**
- Create: `src/components/layout/LanguageSwitcher.tsx`
- Modify: `src/components/layout/Header.tsx`

- [ ] **Step 1: Create `src/components/layout/LanguageSwitcher.tsx`**

```tsx
"use client";

import { Dropdown } from "antd";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/utils";

type Locale = (typeof routing.locales)[number];

const FLAGS: Record<Locale, string> = {
  mn: "🇲🇳",
  en: "🇬🇧",
  ru: "🇷🇺",
};

export default function LanguageSwitcher() {
  const t = useTranslations("common.language");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  const onSelect = (next: Locale) => {
    if (next === locale) return;
    router.replace(
      // @ts-expect-error pathname types depend on routing config
      { pathname, params },
      { locale: next },
    );
  };

  return (
    <Dropdown
      trigger={["click"]}
      placement="bottomRight"
      menu={{
        items: routing.locales.map((loc) => ({
          key: loc,
          label: (
            <span className="inline-flex items-center gap-2">
              <span aria-hidden>{FLAGS[loc]}</span>
              <span>{t(loc)}</span>
            </span>
          ),
          onClick: () => onSelect(loc),
        })),
        selectedKeys: [locale],
      }}
    >
      <button
        type="button"
        aria-label={t("label")}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-full border border-transparent px-3 text-[13px] font-medium tracking-tight text-neutral-700 transition-colors",
          "hover:border-neutral-200 hover:bg-white",
        )}
      >
        <span aria-hidden>{FLAGS[locale]}</span>
        <span className="uppercase">{locale}</span>
      </button>
    </Dropdown>
  );
}
```

- [ ] **Step 2: Mount LanguageSwitcher in Header**

[src/components/layout/Header.tsx](src/components/layout/Header.tsx)-ийн "right side controls" хэсэгт, login/Бүртгүүлэх товчны өмнө байрлуулна:

Find: line containing `{session && user ? (`

Just above this conditional (within the `<div className="flex items-center gap-2 md:gap-3">` контейнер), insert:

```tsx
<LanguageSwitcher />
```

Add import at top of file:

```tsx
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
```

- [ ] **Step 3: Verify build**

```bash
npm run build && npm run lint
```

- [ ] **Step 4: Manual verify language switch**

Run: `npm run dev`

- Open `/mn`, click switcher → choose "English" → URL `/en`, page reloads in EN
- Click switcher → "Русский" → URL `/ru`
- DevTools → Application → Cookies → `NEXT_LOCALE` should reflect choice
- Refresh page: same locale persists

Stop dev server.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/LanguageSwitcher.tsx src/components/layout/Header.tsx
git commit -m "feat(i18n): add LanguageSwitcher dropdown to header"
```

---

## Task 7: Translate Header navigation and user menu

**Files:**
- Modify: `messages/mn.json`, `messages/en.json`, `messages/ru.json`
- Modify: `src/components/layout/Header.tsx`

- [ ] **Step 1: Add `header` namespace to messages**

`messages/mn.json` (top-level дотор нэмэх):

```json
{
  "header": {
    "nav": {
      "japan": "Япон машин",
      "korea": "Солонгос машин",
      "ready": "Бэлэн машин",
      "report": "Осол аваар шалгах"
    },
    "phone": "+976 7000 0000",
    "hours": "Даваа–Бямба · 09:00–18:00",
    "regionsBadge": { "japan": "Япон", "korea": "Солонгос", "mongolia": "Монгол" },
    "menu": {
      "balanceLabel": "Үлдэгдэл",
      "dashboard": "Хувийн самбар",
      "profile": "Профайл",
      "bids": "Миний саналууд",
      "signout": "Гарах",
      "open": "Хэрэглэгчийн цэс",
      "homeAria": "TJ Car нүүр хуудас",
      "openMenu": "Цэс нээх"
    },
    "auth": {
      "signIn": "Нэвтрэх",
      "signUp": "Бүртгүүлэх"
    }
  }
}
```

`messages/en.json`:

```json
{
  "header": {
    "nav": {
      "japan": "Japan cars",
      "korea": "Korea cars",
      "ready": "In-stock cars",
      "report": "Accident report"
    },
    "phone": "+976 7000 0000",
    "hours": "Mon–Sat · 09:00–18:00",
    "regionsBadge": { "japan": "Japan", "korea": "Korea", "mongolia": "Mongolia" },
    "menu": {
      "balanceLabel": "Balance",
      "dashboard": "Dashboard",
      "profile": "Profile",
      "bids": "My bids",
      "signout": "Sign out",
      "open": "User menu",
      "homeAria": "TJ Car home",
      "openMenu": "Open menu"
    },
    "auth": {
      "signIn": "Sign in",
      "signUp": "Sign up"
    }
  }
}
```

`messages/ru.json`:

```json
{
  "header": {
    "nav": {
      "japan": "Авто из Японии",
      "korea": "Авто из Кореи",
      "ready": "В наличии",
      "report": "Проверка ДТП"
    },
    "phone": "+976 7000 0000",
    "hours": "Пн–Сб · 09:00–18:00",
    "regionsBadge": { "japan": "Япония", "korea": "Корея", "mongolia": "Монголия" },
    "menu": {
      "balanceLabel": "Баланс",
      "dashboard": "Личный кабинет",
      "profile": "Профиль",
      "bids": "Мои ставки",
      "signout": "Выйти",
      "open": "Меню пользователя",
      "homeAria": "TJ Car главная",
      "openMenu": "Открыть меню"
    },
    "auth": {
      "signIn": "Войти",
      "signUp": "Регистрация"
    }
  }
}
```

- [ ] **Step 2: Replace hardcoded text in Header**

[src/components/layout/Header.tsx](src/components/layout/Header.tsx)-ийн тэргүүн хэсэгт `useTranslations` нэмнэ:

```tsx
import { useTranslations } from "next-intl";
```

`Header` функц дотор эхэнд:

```tsx
const t = useTranslations("header");
```

Дараа нь:

- `NAV_ITEMS` тогтмолийг `Header` функц дотогш зөөж:

```tsx
const NAV_ITEMS = [
  { href: "/", label: t("nav.japan") },
  { href: "/korea", label: t("nav.korea") },
  { href: "/cars", label: t("nav.ready") },
  { href: "/report", label: t("nav.report") },
] as const;
```

- `+976 7000 0000` → `{t("phone")}`
- `Даваа–Бямба · 09:00–18:00` → `{t("hours")}`
- `Япон` / `Солонгос` / `Монгол` (uppercase strip) → `{t("regionsBadge.japan")}` гэх мэт
- `Үлдэгдэл` → `{t("menu.balanceLabel")}`
- `Хувийн самбар` → `{t("menu.dashboard")}`
- `Профайл` → `{t("menu.profile")}`
- `Миний саналууд` → `{t("menu.bids")}`
- `Гарах` → `{t("menu.signout")}`
- `aria-label="Хэрэглэгчийн цэс"` → `aria-label={t("menu.open")}`
- `aria-label="TJ Car нүүр хуудас"` → `aria-label={t("menu.homeAria")}`
- `aria-label="Цэс нээх"` → `aria-label={t("menu.openMenu")}`
- `Нэвтрэх` → `{t("auth.signIn")}`
- `Бүртгүүлэх` → `{t("auth.signUp")}`

- [ ] **Step 3: Verify build**

```bash
npm run build && npm run lint
```

- [ ] **Step 4: Manual verify**

`npm run dev` → `/mn`, `/en`, `/ru` тус бүрт Header текст зөв хэлээр гарч байгаа эсэхийг шалгах. Login/Бүртгүүлэх товч, dropdown menu бүгдийг харна.

- [ ] **Step 5: Commit**

```bash
git add messages/ src/components/layout/Header.tsx
git commit -m "feat(i18n): translate header navigation and user menu"
```

---

## Task 8: Translate Footer, NewsletterForm, MobileBottomNav

**Files:**
- Modify: `messages/mn.json`, `messages/en.json`, `messages/ru.json`
- Modify: `src/components/layout/Footer.tsx`
- Modify: `src/components/layout/NewsletterForm.tsx`
- Modify: `src/components/layout/MobileBottomNav.tsx`

- [ ] **Step 1: Inspect existing hardcoded text**

```bash
grep -nE "[А-Яа-яЁёҮүӨө]" src/components/layout/Footer.tsx src/components/layout/NewsletterForm.tsx src/components/layout/MobileBottomNav.tsx
```

Этот вывод нь орчуулах ёстой string-уудын жагсаалт. Файлуудыг нэг бүрчлэн нээгээд лавалж бичигдсэн текстийг бүгдийг нь key болгох.

- [ ] **Step 2: Add `footer`, `newsletter`, `mobileNav` namespaces**

Жишээ загвар (Step 1-д хэдэн text олдсоноос хамаараад өргөтгөнө):

```json
{
  "footer": {
    "rights": "Бүх эрх хуулиар хамгаалагдсан",
    "contact": "Холбоо барих",
    "about": "Бидний тухай"
  },
  "newsletter": {
    "title": "Шинэ мэдээ авах",
    "placeholder": "Имэйл хаяг",
    "submit": "Бүртгүүлэх",
    "success": "Амжилттай бүртгэгдлээ",
    "error": "Алдаа гарлаа"
  },
  "mobileNav": {
    "home": "Эхлэл",
    "search": "Хайх",
    "saved": "Хадгалсан",
    "account": "Хэрэглэгч"
  }
}
```

en.json болон ru.json-д ижил key-үүдийг англи/орос орчуулгатайгаар нэмнэ. (Step 1-ийн grep гаргалт-аас бүх хэрэгтэй key-үүдийг бичиж дуусгана. Эргэлзээтэй текстийг placeholder англиар үлдээж OK гэдгийг тэмдэглэх.)

- [ ] **Step 3: Replace text in Footer**

[src/components/layout/Footer.tsx](src/components/layout/Footer.tsx)-ийн тэргүүнд:

```tsx
"use client";
import { useTranslations } from "next-intl";
```

Component дотор `const t = useTranslations("footer");` нэмж бүх hardcoded монгол текстийг `t("key")` болгож солих. (Step 1-ийн grep гаргалтаас key match хийнэ.)

- [ ] **Step 4: Replace text in NewsletterForm**

[src/components/layout/NewsletterForm.tsx](src/components/layout/NewsletterForm.tsx) — нэг адил `useTranslations("newsletter")`.

- [ ] **Step 5: Replace text in MobileBottomNav**

[src/components/layout/MobileBottomNav.tsx](src/components/layout/MobileBottomNav.tsx) — `useTranslations("mobileNav")`.

- [ ] **Step 6: Verify build**

```bash
npm run build && npm run lint
```

- [ ] **Step 7: Manual verify**

`npm run dev` → Footer, MobileBottomNav, NewsletterForm бүх локалд хүлээгдсэн орчуулгаар гарна.

- [ ] **Step 8: Commit**

```bash
git add messages/ src/components/layout/
git commit -m "feat(i18n): translate footer, newsletter, mobile nav"
```

---

## Task 9: Translate LoginForm and auth pages

**Files:**
- Modify: `messages/{mn,en,ru}.json`
- Modify: `src/components/pages/LoginForm.tsx`
- Modify: `src/app/[locale]/auth/login/page.tsx`

- [ ] **Step 1: Inspect login form & page text**

```bash
grep -nE "[А-Яа-яЁёҮүӨө]" src/components/pages/LoginForm.tsx src/app/\[locale\]/auth/login/page.tsx
```

- [ ] **Step 2: Add `auth` namespace to messages**

Жишээ (grep гаргалтаас өргөтгөх):

```json
{
  "auth": {
    "login": {
      "title": "Нэвтрэх",
      "phoneLabel": "Утасны дугаар",
      "phonePlaceholder": "Утас",
      "passwordLabel": "Нууц үг",
      "passwordPlaceholder": "Нууц үг",
      "submit": "Нэвтрэх",
      "errorInvalid": "Утас эсвэл нууц үг буруу байна",
      "errorServer": "Сервэрийн алдаа гарлаа",
      "noAccount": "Бүртгэлгүй юу?",
      "register": "Бүртгүүлэх"
    }
  }
}
```

en.json, ru.json-д орчуулгаар нэмнэ.

- [ ] **Step 3: Replace text in LoginForm**

[src/components/pages/LoginForm.tsx](src/components/pages/LoginForm.tsx)-д `const t = useTranslations("auth.login");`. Бүх hardcoded мнг текстийг key болгох. NextAuth error map (`error?.code`) хадгалж хэвээр, харин харагдах text-ийг `t("errorInvalid")` гэх мэтээр солих.

- [ ] **Step 4: Replace text in login page**

[src/app/[locale]/auth/login/page.tsx](src/app/%5Blocale%5D/auth/login/page.tsx) — server component бол `const t = await getTranslations("auth.login");` ашиглах. Page-ийн `metadata` export-ийг `generateMetadata`-аар орлуулах:

```tsx
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.login" });
  return { title: t("title") };
}
```

- [ ] **Step 5: Update next-auth `signIn` page**

[src/auth.ts](src/auth.ts)-ийн `pages: { signIn: "/auth/login" }` хадгална (next-auth-ийн UI-аас redirect хийхэд locale-ыг middleware-ийн `protected` check шилжүүлдэг тул pathname-ыг `/auth/login` гэхэд middleware default локалд буцаана). Гэвч middleware nextintl-ийн default `mn` рүү redirect хийнэ. Бид Task 2-т аль хэдийн `/<locale>/auth/login` рүү redirect хийдэг болсон тул энэ хэвээр зөв.

- [ ] **Step 6: Verify build**

```bash
npm run build && npm run lint
```

- [ ] **Step 7: Manual verify**

`npm run dev` → `/en/auth/login`, `/ru/auth/login`-д form text орчуулагдсан байна. Буруу credential оруулаад alert-ийг шалгана.

- [ ] **Step 8: Commit**

```bash
git add messages/ src/components/pages/LoginForm.tsx src/app/\[locale\]/auth/login/page.tsx src/auth.ts
git commit -m "feat(i18n): translate login form and auth pages"
```

---

## Task 10: Translate dashboard pages

**Files:**
- Modify: `messages/{mn,en,ru}.json`
- Modify: `src/app/[locale]/dashboard/page.tsx`
- Modify: `src/app/[locale]/dashboard/tracking/page.tsx`
- Modify: `src/app/[locale]/dashboard/layout.tsx`
- Modify: any other `src/app/[locale]/dashboard/**` page that contains text

- [ ] **Step 1: Inspect dashboard text**

```bash
grep -rnE "[А-Яа-яЁёҮүӨө]" src/app/\[locale\]/dashboard/
```

- [ ] **Step 2: Add `dashboard` namespace**

mn.json, en.json, ru.json-д Step 1-ийн гаргалтад тулгуурлан key-үүд нэмнэ. Дэд хэсгүүд: `dashboard.profile`, `dashboard.bids`, `dashboard.tracking`, `dashboard.reports`. Хүснэгтийн толгой, dashboard widget label, empty state-уудыг бүгдийг key болгоно.

- [ ] **Step 3: Replace text in each page**

Сервер component бүрд `getTranslations`, client component бүрд `useTranslations`. Тогтмол загвар:

```tsx
// server
import { getTranslations, setRequestLocale } from "next-intl/server";
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard.tracking");
  return <h1>{t("title")}</h1>;
}
```

Үе шатчилан файл бүрийг сольж generic монгол текстийг key-болгох. Хэрэв тухайн component dashboard-ийн өөрийн client component (`src/components/dashboard/*`) дотор текст агуулдаг бол түүнийг ч ижил замаар солих.

- [ ] **Step 4: Verify build**

```bash
npm run build && npm run lint
```

- [ ] **Step 5: Manual verify (signed in user шаардлагатай)**

`npm run dev` → нэвтэрсэн төлөвт `/en/dashboard`, `/ru/dashboard`, `/mn/dashboard/tracking` гэх мэт хуудсыг шалгана.

- [ ] **Step 6: Commit**

```bash
git add messages/ src/app/\[locale\]/dashboard/ src/components/dashboard/
git commit -m "feat(i18n): translate dashboard pages"
```

---

## Task 11: Translate FeaturedCard, FeaturedAuctionFilters, FeaturedAuctionSchedule, hero

**Files:**
- Modify: `messages/{mn,en,ru}.json`
- Modify: `src/components/cards/FeaturedCard.tsx`
- Modify: `src/components/cards/FeaturedAuctionFilters.tsx`
- Modify: `src/components/cards/FeaturedAuctionSchedule.tsx`
- Modify: `src/components/hero/MapAnimation.tsx` (хэрэв текст байгаа бол)
- Modify: `src/app/[locale]/page.tsx`

- [ ] **Step 1: Inspect**

```bash
grep -rnE "[А-Яа-яЁёҮүӨө]" src/components/cards/ src/components/hero/ src/app/\[locale\]/page.tsx
```

- [ ] **Step 2: Add `auction` namespace**

Жишээ:

```json
{
  "auction": {
    "card": {
      "currentBid": "Одоогийн санал",
      "endsIn": "Дуусах хугацаа",
      "place": "Газар",
      "year": "Он",
      "mileage": "Гүйлт"
    },
    "filters": {
      "title": "Шүүлтүүр",
      "brand": "Брэнд",
      "model": "Модел",
      "yearFrom": "Оноос",
      "yearTo": "Он хүртэл",
      "reset": "Цэвэрлэх"
    },
    "schedule": {
      "title": "Дуудлагын хуваарь",
      "today": "Өнөөдөр",
      "tomorrow": "Маргааш"
    }
  }
}
```

en.json, ru.json-д бичиж дуусга. (Grep гаргалтын бодит key-үүдэд тулгуурлан key/value-уудыг бүрэн оруулах.)

- [ ] **Step 3: Replace text in each component**

Client components: `useTranslations`. Бүх hardcoded монгол текст key солих.

- [ ] **Step 4: Verify build**

```bash
npm run build && npm run lint
```

- [ ] **Step 5: Manual verify**

`npm run dev` → `/`, `/en`, `/ru` гурвуул дээр Featured хэсгүүд орчуулагдсан байна.

- [ ] **Step 6: Commit**

```bash
git add messages/ src/components/cards/ src/components/hero/ src/app/\[locale\]/page.tsx
git commit -m "feat(i18n): translate featured cards and homepage"
```

---

## Task 12: Send `Accept-Language` header on every API request

**Files:**
- Modify: `src/services/Api.ts`
- Modify: `src/services/ServerApi.ts`
- Modify: `src/app/api/proxy/[...path]/route.ts`

- [ ] **Step 1: Update client `src/services/Api.ts`**

Файл client-side (бараг `"use client"` зориулагдсан) ашиглагдана. `cookie` уншиж `NEXT_LOCALE` авах хялбар арга:

Хуучин `headers` бүтээдэг хэсэг:

```ts
const headers: Record<string, string> = {
  Accept: "application/json",
  ...customHeaders,
};
```

Болго:

```ts
function readLocaleFromCookie(): string {
  if (typeof document === "undefined") return "mn";
  const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/);
  return match?.[1] ?? "mn";
}

const headers: Record<string, string> = {
  Accept: "application/json",
  "Accept-Language": readLocaleFromCookie(),
  ...customHeaders,
};
```

`readLocaleFromCookie` функцийг `Api` factory-аас гадна module top-level дээр зарлана.

- [ ] **Step 2: Update `src/services/ServerApi.ts`**

`import "server-only";`-ийн дор:

```ts
import { getLocale } from "next-intl/server";
```

`request` функцийн доторх `headers` барих хэсэгт:

```ts
const locale = await getLocale();
const headers: Record<string, string> = {
  Accept: "application/json",
  "Accept-Language": locale,
  ...customHeaders,
};
```

- [ ] **Step 3: Update proxy route `src/app/api/proxy/[...path]/route.ts`**

Forward incoming `Accept-Language` to backend. `handler` дотор `headers` бүтээх хэсгийг:

```ts
const headers: Record<string, string> = {
  "Content-Type": "application/json",
  Accept: "application/json",
};
const acceptLanguage = request.headers.get("accept-language");
if (acceptLanguage) {
  headers["Accept-Language"] = acceptLanguage;
}
if (token?.accessToken) {
  headers.Authorization = `Bearer ${token.accessToken}`;
}
```

- [ ] **Step 4: Verify build**

```bash
npm run build && npm run lint
```

- [ ] **Step 5: Manual verify**

`npm run dev` → `/en` хуудсан дээр network tab нээж `Api` ашигладаг үйлдэл (жишээ нь Featured fetch) хийнэ. Request-ийн headers-т `Accept-Language: en` байх ёстой. `/ru`-руу шилжээд ижил шалгана. Server fetch-д (`ServerApi`) `next dev` console дээр debug log хэвлэвэл шалгаж болно (заавал биш).

- [ ] **Step 6: Commit**

```bash
git add src/services/ src/app/api/proxy/
git commit -m "feat(i18n): forward Accept-Language on all API requests"
```

---

## Task 13: Sweep remaining hardcoded Mongolian strings

**Files:** (Steps болон grep гаргалт дээр үндэслэн)

- [ ] **Step 1: Find remaining text**

```bash
grep -rnE "[А-Яа-яЁёҮүӨө]" src/ --include="*.tsx" --include="*.ts" | grep -v messages/ | grep -v ".next/" | grep -v node_modules
```

- [ ] **Step 2: Categorize and translate**

Гаргалтаас key-үүдийг тохирох namespace-д хуваарилж (`common`, `error`, `forms` гэх мэт), mn/en/ru-д бичиж файлаа сольно.

- [ ] **Step 3: Verify**

```bash
npm run build && npm run lint
```

`grep` дахин ажиллуулж зөвхөн `messages/` дотор монгол тэмдэгт үлдсэн эсэхийг шалгана.

- [ ] **Step 4: Manual final smoke**

`npm run dev` → /mn, /en, /ru тус бүрд:
- Homepage
- Header dropdown menu (бүх зүйлс)
- Language switcher
- `/auth/login`
- DevTools cookies → `NEXT_LOCALE`
- Network → API request → `Accept-Language` header
- Antd DatePicker (хэрэв homepage эсвэл filter дээр байгаа бол) → locale-ээр format-тай
- Form validation message (хоосон submit) → antd locale-аар

- [ ] **Step 5: Commit**

```bash
git add messages/ src/
git commit -m "feat(i18n): translate remaining strings and finalize"
```

---

## Task 14: Add note to `CLAUDE.md` (or create one) for future contributors

**Files:**
- Create or modify: `CLAUDE.md`

- [ ] **Step 1: Append i18n usage section**

If `CLAUDE.md` exists, append. Otherwise create with:

```markdown
## i18n

- Default locale: `mn`. Supported: `mn`, `en`, `ru`.
- All routes live under `src/app/[locale]/`. Root `src/app/layout.tsx` is a pass-through.
- Use `Link`, `useRouter`, `usePathname`, `redirect` from `@/i18n/navigation` (NOT `next/link` or `next/navigation` for routing).
- Translation files: `messages/{mn,en,ru}.json`. Add new keys to all three.
- Server components: `await getTranslations("namespace")`.
- Client components: `useTranslations("namespace")`.
- API requests automatically include `Accept-Language` (see `src/services/Api.ts`, `ServerApi.ts`, proxy route).
- Antd locale follows the active language via `AntdProvider`.
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add i18n guidance to CLAUDE.md"
```

---

## Verification Checklist (full feature complete)

- [ ] `npm run build` амжилттай
- [ ] `npm run lint` амжилттай
- [ ] `/` → `/mn` redirect
- [ ] `/mn`, `/en`, `/ru` тус бүр render
- [ ] `<html lang="...">` локалаар хувирна
- [ ] Header dropdown-оор хэл солих ажиллана, `NEXT_LOCALE` cookie шинэчлэгдэнэ
- [ ] Refresh хийсний дараа хэл хадгалагдана
- [ ] `/en/dashboard` (нэвтэрсэн биш) → `/en/auth/login?callbackUrl=...` redirect
- [ ] Антд DatePicker, Pagination, Form validation идэвхтэй locale-аар орчуулагдсан
- [ ] DevTools Network → бүх API request `Accept-Language` header тэй
- [ ] `grep -rnE "[А-Яа-яЁёҮүӨө]" src/ --include="*.tsx" --include="*.ts" | grep -v messages/` нь зөвхөн string literal type, comment, эсвэл одоо орчуулга байхгүй файлуудыг үлдээнэ (бүгд зорилго ёсоор)

---

## Risks / Open Issues

- **en/ru placeholder орчуулга:** Эхний хувьд орчуулга ойролцоо. Production-аас өмнө орчуулагчийн шүүлт хэрэгтэй.
- **next-auth callback URL with locale:** `signOut({ callbackUrl: "/" })` болон бусад callback-ууд явсаар л `/` руу буцаах ба middleware default-аар `/mn` руу redirect хийнэ. Хэрвээ хэрэглэгчийн идэвхтэй locale-д хадгалах хэрэгтэй болбол `signOut`-ыг тус газар орчилуулан `useLocale()`-аар locale-aware callback хийх.
- **Antd v6 locale type:** `antd/es/locale` import path-ийн type-ийг шалгах; v6-д өөрчлөгдсөн байж магадгүй.
- **Dayjs locale data:** `import "dayjs/locale/ru"` болон `mn` хэвлэлд багтсан эсэхийг build лог дээр баталгаажуулах. Хэрвээ алдаа гарвал тус хэлэн `dayjs/locale/en`-аар fallback хийх.
