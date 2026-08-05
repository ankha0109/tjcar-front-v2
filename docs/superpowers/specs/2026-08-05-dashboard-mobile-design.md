# Dashboard — мобайл хувилбар

**Огноо:** 2026-08-05
**Хамрах хүрээ:** `/dashboard` болон түүний дэд хуудсуудын мобайл дүр төрх

## Асуудал

`/dashboard` нэг ижил бүтцийг хоёр төхөөрөмж дээр үзүүлдэг: зүүн талд сайдбар, баруун талд
үлдэгдлийн карт → 3 статистик карт → сүүлийн саналууд → замд яваа машин. Desktop дээр энэ
сайн ажиллаж байгаа. Утсан дээр сайдбар алга болдог тул хэрэглэгч дэд хуудас руу орох цорын
ганц зам нь статистик картууд (3 нь л линк) болон хаалганы drawer (☰) хоёр — Профайл руу
орох арга огт харагдахгүй. Мөн дэд хуудас бүр өөрийн `h1`-ээ хуудсан дотроо зурдаг тул
дээд талын fixed header зөвхөн лого харуулж, дэлгэцийн 56px дэмий үрэгддэг.

## Шийдэл

Утсан дээр `/dashboard` нь **мобайл аппликейшны бүртгэлийн дэлгэц** болно: дээр нь дансны
хураангуй карт, доор нь бүлэглэсэн, icon-той меню жагсаалт. Дэд хуудас руу орвол гарчиг
fixed header-т гарч, буцах сум зүүн талд гарна — `/japan/[id]`, `/korea/[id]`, `/garage/[id]`
дээр аль хэдийн ашиглагдаж буй `@mobileHeader` parallel route-ын яг тэр хэв шинж.

Desktop нэг ч пиксел өөрчлөгдөхгүй.

## Архитектур

### Төхөөрөмж салгах

Салгалт `getDevice()` (`tjcar-device` cookie, зөвхөн утасны UA) дээр тулгуурлана — Tailwind-ын
`md:`/`lg:` breakpoint дээр **биш**. Шалтгаан: `AppShell` мобайл бүрхүүлээ энэ cookie-гоор
сонгодог тул breakpoint дээр тулгуурласан UI нарийн desktop цонхонд MobileHeader-гүйгээр
мобайл дүр төрх зурж, хоёулаа зөрнө.

| Файл | Мобайл үед | Desktop үед |
|---|---|---|
| `src/app/[locale]/dashboard/layout.tsx` | `<Sidebar/>` огт render хийхгүй; container `py-4` | одоогийнх хэвээр |
| `src/app/[locale]/dashboard/page.tsx` | `<DashboardMobileMenu openTopUp={…}/>` | одоогийн 4 блок хэвээр |
| `src/components/dashboard/DashboardHeader.tsx` | `null` буцаана | одоогийнх хэвээр |

`DashboardHeader`-ыг `async` server component болгож, дотроо `getDevice()` уншина. Ингэснээр
6 дэд хуудсыг (`bids`, `bids/[id]`, `orders`, `orders/[id]`, `reports`, `profile`) огт
хөндөхгүйгээр header-т очсон гарчиг хуудсан дотор давхардахгүй. Энэ зан төлвийг компонентын
дээд талд тайлбар болгон бичнэ — юу ч render хийхгүй компонент бол дуугүй өнгөрөх ёсгүй.

`reports` хуудсын `action` prop (`＋ Шинэ репорт` линк) мобайл дээр `DashboardHeader`-тэй хамт
алга болно — тэр үйлдэл header slot-ын баруун талд icon болж очно (доор үзнэ үү).

### Header slot

Шинэ файл: `src/app/[locale]/@mobileHeader/dashboard/[[...rest]]/page.tsx`

Optional catch-all нь `/dashboard` болон түүн доорх бүх замыг ганц файлаар барина. Dashboard-ын
бүх гарчиг статик орчуулга тул `japan/[id]` шиг API дуудах шаардлагагүй.

`device !== "mobile"` үед `null` буцаана — бусад slot файлуудтай ижил.

| `rest` | Гарчиг | Зүүн | Баруун |
|---|---|---|---|
| `undefined` | `dashboard.mobile.title` | лого (буцах сумгүй) | ☰ (`menuButton`) |
| `["bids"]` | `dashboard.bids.title` | ← `/dashboard` | — |
| `["bids", id]` | `dashboard.bidDetail.title` | ← `/dashboard/bids` | — |
| `["orders"]` | `dashboard.orders.title` | ← `/dashboard` | — |
| `["orders", id]` | `dashboard.orderDetail.title` | ← `/dashboard/orders` | — |
| `["reports"]` | `dashboard.reports.title` | ← `/dashboard` | ＋ → `/report` |
| `["profile"]` | `dashboard.profile.title` | ← `/dashboard` | — |
| бусад | гарчиггүй | ← `/dashboard` | — |

Танигдаагүй сегментийн fallback (жишээ нь `/dashboard/wallet`, энэ нь шууд redirect хийдэг)
нь гарчиггүй, зөвхөн буцах сумтай header. Ирээдүйд шинэ дэд хуудас нэмэхэд энэ зураглалд
бас нэмэх ёстой — мартвал хуудас эвдрэхгүй, зүгээр л гарчиггүй үлдэнэ.

**`MobileHeader`-т нэг мөрийн өөрчлөлт.** Одоо `{right ?? <DefaultRight />}` гэж бичигдсэн
тул харьцуулах icon-ыг унтраах арга байхгүй (`right={null}` бас fallback руу оруулна).
Үүнийг `{right === undefined ? <DefaultRight /> : right}` болгоно — ингэснээр `right={null}`
нь «баруун талд үйлдэл байхгүй» гэсэн утгатай болно. Dashboard-ын бүх header үүнийг ашиглана:
машин харьцуулах товч бүртгэлийн дэлгэц дээр байх ёсгүй. Одоо байгаа дуудлагууд бүгд
`right`-г огт дамжуулдаггүй тул зан төлөв нь өөрчлөгдөхгүй.

### Шинэ компонентууд

```
src/components/dashboard/mobile/
  DashboardMobileMenu.tsx   client — бүхэл мобайл index-ийг угсарна
  MobileAccountCard.tsx     client — аватар, нэр, үлдэгдэл, Premium төлөв, цэнэглэх товч
  MobileMenuGroup.tsx       группын гарчиг + цагаан карт (divide-y)
  MobileMenuRow.tsx         icon + label + (badge | switch) + chevron
src/hooks/useDashboardCounts.ts   саналын/захиалгын/репортын тоо
```

Хариуцлагын хуваарилалт:

- **`DashboardMobileMenu`** — цорын ганц «хуудас мэддэг» компонент. Групп бүрийн бүтэц,
  `WalletTopUpDrawer`-ын нээлттэй төлөв, `signOut` энд амьдарна. `openTopUp` prop-ыг
  `WalletSection`-ы адил серверээс query string-ээс авна (`?topup=1` deep link), тиймээс
  `useSearchParams` шаардахгүй, Suspense хил хэрэггүй.
- **`MobileAccountCard`** — зөвхөн харуулна; `onTopUp` callback-аар drawer-ыг эцэгтээ нээлгэнэ.
  Үлдэгдлийг `useWalletBalance()`-аас, нэрийг `useSession()`-оос уншина.
- **`MobileMenuGroup` / `MobileMenuRow`** — цэвэр presentational. `MobileMenuRow` нь `href`
  (Link), эсвэл `onClick` (товч), эсвэл `trailing` (Switch) гурвын нэгийг авна.
- **`useDashboardCounts`** — `["stats","bids"]`, `["stats","orders"]`, `["stats","reports"]`
  гурван query-г нэг hook болгож гаргана. `DashboardStats` эдгээрийг одоо дотроо inline
  бичсэн байгааг энэ hook руу шилжүүлнэ — ижил query key, ижил `staleTime`, тиймээс desktop
  болон мобайл хоёр өөр тоо хэзээ ч харуулахгүй.

## UI бүтэц

```
┌──────────────────────────────────┐
│  Хэрэглэгчийн булан            ☰ │   ← @mobileHeader slot (fixed, h-14)
├──────────────────────────────────┤
│ ┌──────────────────────────────┐ │
│ │ (АБ)  Анхбаяр Б.             │ │
│ │                              │ │
│ │ ДАНСНЫ ҮЛДЭГДЭЛ            ⟳ │ │
│ │ 1,200,000₮                   │ │
│ │ ● Premium идэвхтэй           │ │   төлөвөөс хамаарч:
│ │ ▓▓▓▓▓░░░░  300,000₮ дутуу    │ │   progress bar доогуур үед
│ │ [ Данс цэнэглэх ]            │ │
│ └──────────────────────────────┘ │
│                                  │
│  МИНИЙ ҮЙЛ АЖИЛЛАГАА             │
│ ┌──────────────────────────────┐ │
│ │ ⚖  Миний саналууд      12  › │ │
│ │ 🚚 Захиалсан машин      3  › │ │
│ │ 📄 Миний репортууд      5  › │ │
│ └──────────────────────────────┘ │
│                                  │
│  МИНИЙ ЖАГСААЛТ                  │
│ ┌──────────────────────────────┐ │
│ │ ♡  Хадгалсан машин      7  › │ │
│ │ ⇄  Харьцуулах           2  › │ │
│ └──────────────────────────────┘ │
│                                  │
│  БҮРТГЭЛ                         │
│ ┌──────────────────────────────┐ │
│ │ 👤 Профайл                 › │ │
│ │ 🌙 Шөнийн горим         [⏻] │ │
│ └──────────────────────────────┘ │
│                                  │
│  ТУСЛАМЖ                         │
│ ┌──────────────────────────────┐ │
│ │ 📞 +976 7511-5888          › │ │
│ │ ✉  Холбоо барих            › │ │
│ └──────────────────────────────┘ │
│ ┌──────────────────────────────┐ │
│ │ ⏻  Гарах            (улаан) │ │
│ └──────────────────────────────┘ │
├──────────────────────────────────┤
│  ⌂    ◍    🚚   🛡   ♡    👤    │   ← MobileBottomNav (Профайл идэвхтэй)
└──────────────────────────────────┘
```

### Дансны карт

Одоогийн `WalletBalanceCard`-ын мобайл эквивалент, гэхдээ **богиносгосон**:

- аватар (нэрний эхний үсгүүд) + бүтэн нэр — `MobileDrawer`-ын `getInitials` логиктой ижил
- `ДАНСНЫ ҮЛДЭГДЭЛ` шошго + том тоо + шинэчлэх (⟳) товч
- Premium төлөв: `● Premium идэвхтэй` эсвэл `● Premium болоход {amount} дутуу`
- Босгоос доогуур үед progress bar + доод үлдэгдлийн мөр
- `[ Данс цэнэглэх ]` товч → одоо байгаа `WalletTopUpDrawer`

**Санаатай орхиж буй зүйл:** desktop карт дээрх «Premium давуу тал» 4 мөрийн жагсаалт мобайл
дээр гарахгүй. Карт нь дэлгэцийн эхний хагаст багтаж, доор нь меню шууд эхлэх ёстой; давуу
талуудыг top-up drawer өөрөө тайлбарладаг.

Нэвтрээгүй үед: `useWalletBalance().isAuthenticated` false байвал `WalletBalanceCard`-тай ижил
skeleton. `/dashboard` нь `proxy.ts`-ийн auth guard-ын ард байдаг тул энэ нь зөвхөн session
ачаалагдах хормын төлөв.

### Меню мөрүүд

| Групп | Мөр | Зорилго | Trailing |
|---|---|---|---|
| Миний үйл ажиллагаа | Миний саналууд | `/dashboard/bids` | тоо (badge) |
| | Захиалсан машин | `/dashboard/orders` | тоо |
| | Миний репортууд | `/dashboard/reports` | тоо |
| Миний жагсаалт | Хадгалсан машин | `/wishlist` | `useWishlist().count` |
| | Харьцуулах | `/compare` | `useCompare().count` |
| Бүртгэл | Профайл | `/dashboard/profile` | — |
| | Шөнийн горим | — | antd `Switch` |
| Тусламж | +976 7511-5888 | `tel:` (external `<a>`) | — |
| | Холбоо барих | `/about` | — |
| — | Гарах | `signOut({callbackUrl: '/{locale}'})` | — |

Тоо 0 эсвэл ачаалж байгаа үед badge огт гарахгүй (зурааснаас илүү чимээгүй).

Шөнийн горим `MobileDrawer`-ын хэв маягийг давтана: `<html data-theme>`-ийг
`useSyncExternalStore`-оор уншиж, `setTheme` server action + `router.refresh()`. Логикийг
`MobileDrawer`-аас хуулахгүй — `src/hooks/useThemeToggle.ts` болгож гаргаад хоёул ашиглана.

### Стиль

Одоогийн dashboard-ын саарал фон дээр цагаан бүлэг картууд (iOS Settings хэв шинж):

- Групп карт: `rounded-xl border border-neutral-200 bg-white divide-y divide-neutral-100`
  (+ `dark:` хувилбарууд)
- Мөр: доод тал нь 52px өндөр, icon `h-[18px] w-[18px]`, label `text-[15px]`, баруун талд
  chevron `text-neutral-300`
- Групп гарчиг: `px-1 pb-2 pt-5 text-[11px] font-semibold uppercase text-neutral-400`
- Icon өнгө: `MobileDrawer`-ын одоогийн палитрыг үргэлжлүүлнэ (♡ rose, 🌙 indigo, 📞 emerald,
  ✉ sky, гарах rose)
- `tracking-*`, `font-mono` ашиглахгүй (төслийн дүрэм)
- `hover:` бус `pointer-fine:hover:` — Tailwind v4-т `hover:` нь `(hover:hover)`-ын ард тул
  утсан дээр идэвхжихгүй; мөрийн дарагдсан төлөвт `active:bg-neutral-50` ашиглана

## Орчуулга

Шинэ `dashboard.mobile` namespace, **mn/en/ru гурвуулд**:

```
dashboard.mobile.title          Хэрэглэгчийн булан
dashboard.mobile.groupActivity  Миний үйл ажиллагаа
dashboard.mobile.groupLists     Миний жагсаалт
dashboard.mobile.groupAccount   Бүртгэл
dashboard.mobile.groupSupport   Тусламж
```

`groupLists` нь `header.wishlist` («Хадгалсан машин»)-тай давхцахгүй байхаар сонгосон —
«ХАДГАЛСАН» гэсэн бүлгийн доор «Хадгалсан машин» гэсэн мөр байвал давхардал болно.

Бусад бүх шошго одоо байгаа түлхүүрүүдээс дахин ашиглагдана — `dashboard.bids.title`,
`dashboard.orders.title`, `dashboard.reports.title`, `dashboard.profile.title`,
`dashboard.wallet.*`, `header.wishlist`, `header.compare`, `header.theme.darkMode`,
`header.topbar.contact.label`, `header.menu.signout`.

## Хөндөгдөх файлууд

Шинэ:
- `src/app/[locale]/@mobileHeader/dashboard/[[...rest]]/page.tsx`
- `src/components/dashboard/mobile/DashboardMobileMenu.tsx`
- `src/components/dashboard/mobile/MobileAccountCard.tsx`
- `src/components/dashboard/mobile/MobileMenuGroup.tsx`
- `src/components/dashboard/mobile/MobileMenuRow.tsx`
- `src/hooks/useDashboardCounts.ts`
- `src/hooks/useThemeToggle.ts`

Өөрчлөгдөх:
- `src/app/[locale]/dashboard/layout.tsx` — mobile үед сайдбаргүй
- `src/app/[locale]/dashboard/page.tsx` — device салгалт
- `src/components/dashboard/DashboardHeader.tsx` — mobile үед `null`
- `src/components/dashboard/DashboardStats.tsx` — `useDashboardCounts` руу шилжинэ
- `src/components/layout/mobile/MobileHeader.tsx` — `right={null}` дэмжих нэг мөр
- `src/components/layout/mobile/MobileDrawer.tsx` — theme логик hook руу шилжинэ
- `messages/{mn,en,ru}.json`

Хөндөгдөхгүй: `bids/`, `bids/[id]/`, `orders/`, `orders/[id]/`, `reports/`, `profile/`
хуудсууд, `Sidebar.tsx`, `WalletBalanceCard.tsx`, `WalletTopUpDrawer.tsx`.

## Баталгаажуулалт

Автомат тест энэ репод байхгүй тул баталгаажуулалт нь build + бодит харагдац:

1. `npx tsc --noEmit` болон `npm run lint` цэвэр өнгөрнө
2. `verify` skill-ээр аппыг ажиллуулж, `tjcar-device=mobile` cookie тавиад CDP-ийн
   `setDeviceMetricsOverride`-оор (390×844) дараах дэлгэцүүдийг зургаар шалгана:
   - `/mn/dashboard` — карт + 4 групп, header-т «Хэрэглэгчийн булан» + ☰
   - `/mn/dashboard/bids` — header-т гарчиг + буцах сум, хуудсан дотор `h1` **байхгүй**
   - `/mn/dashboard/reports` — header-ийн баруун талд ＋
   - `/mn/dashboard/bids/{id}` — «Саналын дэлгэрэнгүй» + `/dashboard/bids` руу буцах
   - `/mn/dashboard?topup=1` — top-up drawer шууд нээлттэй
   - Шөнийн горим асаагаад бүх групп картын dark хувилбарыг шалгана
3. Cookie-г `desktop` болгоод `/mn/dashboard` одоогийнхтой яг адилхан хэвээр эсэхийг шалгана

## Эрсдэл

- **Optional catch-all slot.** `@mobileHeader/dashboard/[[...rest]]` нь parallel route slot
  дотор ажиллах ёстой ч энэ хэв шинжийг энэ репод хараахан ашиглаагүй. Хэрэв Next 16 үүнийг
  хүлээж авахгүй бол хандлага **B** руу (route бүрд тусдаа жижиг файл, `japan/[id]`-тай яг
  ижил) буцна — гаднаа ижил үр дүнтэй, дотроо 6 файл.
- **Таблет.** `tjcar-device` cookie зөвхөн утасны UA дээр тавигддаг тул iPad энэ шинэ
  жагсаалтыг харахгүй, desktop сайдбартай хувилбараа авна. Энэ нь зориуд — төслийн
  тогтсон дүрэм.
