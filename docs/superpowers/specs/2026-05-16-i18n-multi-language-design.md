# i18n — Олон хэлний дэмжлэг (mn/en/ru)

**Огноо:** 2026-05-16
**Статус:** Spec — хэрэгжүүлэлт хүлээж байна
**Хамрах хүрээ:** tjcar-front-v2 web (Next.js 16 App Router)

## Зорилго

Одоо зөвхөн монгол хэлээр хатуу бичигдсэн UI-г монгол, англи, орос гурван хэлээр харагдах болгох. Хэрэглэгч хэлээ Header дээрх dropdown-оор сонгоно. URL prefix-аар хэл тус бүр үндсэн SEO-friendly route-той болно.

## Шаардлага

- **Дэмжих хэлнүүд:** `mn` (default), `en`, `ru`
- **URL загвар:** prefix-тэй, бүгд (`/mn/...`, `/en/...`, `/ru/...`). Үндсэн хэл prefix-гүйгээр зорчихгүй.
- **Хэл сонголт:** Header-т dropdown switcher; сонголт `NEXT_LOCALE` cookie-д хадгалагдан дараагийн зорчилд тогтоно.
- **Browser detection:** Шинэ зочин үед `Accept-Language` header дээр үндэслэн тохирох хэл рүү redirect, дараа нь cookie/сонголт давамгайлна.
- **Орчуулгын файл:** Нэг файл/хэл, `messages/{mn,en,ru}.json`. Дотор нь nested namespace key-үүд.
- **API хэл:** Бүх API хүсэлтэд `Accept-Language: <locale>` header дамжуулна (client, server, proxy route бүгд).
- **Antd locale:** ConfigProvider-ийн `locale` prop идэвхтэй хэлтэй дагуу солигдоно (DatePicker, Pagination, Form validation мессеж).
- **Metadata:** `<html lang>`, page `<title>`, description динамик хэлтэй болно.

## Шаардлагагүй (YAGNI)

- CMS/API-аар орчуулга татах
- 4+ хэлний тэлэлт (одоохондоо mn/en/ru)
- Auto-translation pipeline
- RTL хэл

## Архитектур

### Стек

- `next-intl` (App Router-т зориулсан)
- Нэг JSON файл/хэл
- Strict prefix routing (бүх хэл prefix-тэй)

### Хавтасны бүтэц

```
src/
  app/
    [locale]/
      layout.tsx        ← одоогийн app/layout.tsx-ийн агуулга
      page.tsx
      dashboard/...
      auth/...
    api/                ← локалоос гадна, өөрчлөгдөхгүй
      proxy/[...path]/route.ts  ← Accept-Language header forward хийнэ
      signout/...
    layout.tsx          ← зөвхөн <html lang>/<body>-г барина
  i18n/
    routing.ts          ← locales, defaultLocale, localePrefix='always'
    request.ts          ← server-side message loader
    navigation.ts       ← Link, useRouter, redirect re-export
  messages/
    mn.json
    en.json
    ru.json
  middleware.ts         ← next-intl + next-auth chain
  providers/
    AntdProvider.tsx    ← idэвхтэй хэлд тохируулсан antd locale
  components/
    layout/
      Header.tsx        ← LanguageSwitcher нэмж байрлуулна
      LanguageSwitcher.tsx ← шинэ
  services/
    Api.ts              ← client interceptor нэмэгдэнэ
    ServerApi.ts        ← server-side хэл авах
```

### Middleware (бүх routing-ийн зүрх)

`src/middleware.ts`-д next-intl-ийн middleware-ийг next-auth-ийн `auth(...)` callback дотор багтаасан wrapper байрлуулна. Дараалал:

1. next-intl middleware → URL-ийн locale тогтоох, redirect шаардлагатай бол хийх.
2. next-auth middleware → нэвтрэлт шалгах, локал prefix хадгалах.
3. matcher: `/((?!api|_next|.*\\..*).*)` — API, статик файлуудаас бусдыг бүгд.

### Хэл солих flow

1. Хэрэглэгч Header-ийн dropdown-оос хэл сонгоно.
2. `LanguageSwitcher` `useRouter().replace(pathname, { locale })` дуудна.
3. next-intl `NEXT_LOCALE` cookie-г шинэчилнэ.
4. Хуудас шинэ locale-аар render хийгдэнэ.

### API request flow

- **Client (`src/services/Api.ts`):** request interceptor дотор `useLocale()`-аас (эсвэл cookie-аас уншиж) `Accept-Language` нэмнэ.
- **Server (`src/services/ServerApi.ts`):** `getLocale()` (`next-intl/server`)-аас уншиж header болгоно.
- **Proxy route (`src/app/api/proxy/[...path]/route.ts`):** ирсэн request-ийн `Accept-Language` header-ийг backend рүү дамжуулна.

## Орчуулгын түлхүүрийн загвар

Namespace бүхий nested key:

```json
{
  "common": {
    "search": "Хайх",
    "loading": "Уншиж байна..."
  },
  "header": {
    "nav": { "home": "Эхлэл", "dashboard": "Хяналт" },
    "login": "Нэвтрэх"
  },
  "auction": {
    "card": { "currentBid": "Одоогийн санал" }
  }
}
```

Хэрэглээ:
- Server component: `const t = await getTranslations('header'); t('nav.home')`
- Client component: `const t = useTranslations('header'); t('nav.home')`

## Хэрэгжүүлэх үе шат

1. **Суурь setup** — `next-intl` суулгах, `i18n/{routing,request,navigation}.ts`, `middleware.ts`, хоосон `messages/{mn,en,ru}.json` үүсгэх. Build амжилттай.
2. **`[locale]` segment руу шилжүүлэх** — `app/(routes)` бүгдийг `app/[locale]/` дотогш зөөнө. Root `app/layout.tsx` зөвхөн `html`/`body` болно. `api/*` хөдлөхгүй.
3. **Provider-ууд** — `NextIntlClientProvider`, AntdProvider-т locale mapping (`mn_MN`/`en_US`/`ru_RU`) холбох.
4. **Текст орчуулах** — Header → Footer → MobileBottomNav → LoginForm → FeaturedCard → metadata → hero. Үе шат бүрийн дараа build + visual check.
5. **API ба switcher** — Accept-Language interceptor (client/server/proxy), Header-т `LanguageSwitcher`, cookie тохиргоо.

## Эрсдэл ба бэлтгэл

- **Middleware chain (auth × intl):** хоёр middleware-ийг нэг файлд нэгтгэх ёстой. Туршилт: нэвтрэлтгүй хэрэглэгч `/en/dashboard` → `/en/auth/sign-in` рүү redirect хийгдэх ёстой (locale алдагдахгүй).
- **next-auth redirect URL:** одоогийн `signIn`/`signOut` callback URL `/auth/...` хатуу бичигдсэн. Locale-aware болгож `/[locale]/auth/...` болгох эсвэл next-auth `basePath` тохируулах хэрэгтэй.
- **Antd v6 locale name:** `mn_MN` локал v6-д байгаа эсэхийг шалгах. Байхгүй бол `en_US` fallback дээр шилжих.
- **Metadata орчуулга:** `generateMetadata` async болгож `getTranslations` хэрэглэнэ. `<html lang>` динамик.
- **Hardcoded монгол текстүүд олон:** title, placeholder, alt, validation message, toast — бүгдийг скан хийж түлхүүр болгох ажил их.
- **en/ru орчуулгын чанар:** эхний хувьд placeholder орчуулга оруулах, дараа нь орчуулагчаар сайжруулна гэдгийг тохиролцох.

## Амжилтын шалгуур

- `/`, `/en`, `/ru` гурвуул render хийгдэнэ, тус бүр зөв хэл харуулна.
- Header dropdown-оос хэл солихоор pathname locale өөрчлөгдөж reload болоход тогтворжно.
- DatePicker, Pagination, Form validation antd locale-аар орчуулагдсан.
- API хүсэлтэд `Accept-Language` зөв явна (DevTools-оор шалгана).
- Нэвтрэлгүй хэрэглэгч `/en/dashboard`-руу орвол `/en/auth/sign-in`-руу redirect.
- Build болон ESLint амжилттай.

## Хязгаарлалт

- `messages/` дахь en/ru эхэндээ авто/placeholder орчуулга байна — production-аас өмнө орчуулагчийн review шаардана.
- Backend нь `Accept-Language` header-ийг хүлээн авах, тохирох хэлээр өгөгдөл буцаах ёстой; backend-ээс хамаарал бий.
