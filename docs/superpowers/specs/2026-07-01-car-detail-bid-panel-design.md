# CarDetail — Үнэ илгээх (Bid) панел — Дизайн

**Огноо:** 2026-07-01
**Хамрах хүрээ:** `/japan/[id]` дуудлага худалдааны дэлгэрэнгүй хуудсанд `CarDetail`-д bid панел нэмэх.
**Эх сурвалж:** v1 `AuctionBid.js` + `auction/view/[id]/page.js` логикийг v2 стек рүү буулгах.

## 1. Зорилго / шаардлагууд

Хэрэглэгчийн 5 шаардлагыг хангах:

1. **Auth gate** — зөвхөн нэвтэрсэн хэрэглэгч үнэ илгээх боломжтой форм.
2. **Доод үнэ** — үнэ илгээхдээ backend `/calculator`-оор доод үнийг тооцоолж, түүнээс дээш л зөвшөөрөх.
3. **Deposit gate** — хэтэвчиндээ (`balance`) доод хэмжээний deposit байршуулсан байх шаардлага.
4. **Валют (user.type)** — `type == 2` хэрэглэгч төгрөг/иенээр сонгож илгээх; бусад нь зөвхөн төгрөгөөр.
5. **Ачилтын тооцоолуур** — MNT bid-д урьдчилгаа (20/30/60%) ба Монголд буусны дараах үлдэгдэл төлбөрийг автомат харуулах задаргаа.

## 2. Тодорхойлсон шийдвэрүүд

| Асуулт | Шийдвэр |
|---|---|
| "Ачилтын тооцоолуур" гэж юу вэ | Урьдчилгаа задаргаа (v1 шиг): 20/30/60% tier + "Монголд буусны дараах төлбөр". Зөвхөн MNT валютад. |
| Иен→төгрөг ханш | Backend `GET /config` (live), CarDetail server component дээр татаж prop-оор дамжуулна. |
| Валютын дүрэм | `user.type === 2` → ₮/¥ сонгоно; бусад бол зөвхөн ₮ (Select disabled). v1-тэй яг адил. |
| Mobile UX | **Bottom Drawer** — sticky товч дарахад доороос Drawer нээгдэж форм гарна. |
| Хамрах хүрээ | Зөвхөн `/japan/[id]` (auction). `/korea`, `/cars` жагсаалтууд одоогийн `CarBidCta` stub-ээ хэвээр авна. |
| `MINIMUM_BALANCE` | Код доторх тогтмол `2_000_000` (env биш), `src/lib/bidConfig.ts` дотор. |

## 3. Backend contract-ууд (v2 API — source of truth)

Laravel v2 (`/Users/ankhbayar/Herd/tjcar-api-v2`), бүгд `/api/proxy` дундуур дамжина.

- **`POST /calculator`** (public) — `{ chassis, engineSize, year, rate, price }` →
  `{ data: { average: number } }`. `average` = Монголд буусны нийт өртөг (MNT), доод үнэ болно.
- **`POST /bids`** (auth: sanctum) — `{ auction_id, bid_price, currency }` →
  `{ message, data: {...bid} }`. **v1-ийн `/auctions/sendbid` БИШ.** Backend timing шалгалт: дуудлага
  одоогоос 2+ цагийн дараа байх ёстой, эс бөгөөс татгалзана. Balance шалгалт backend-д **байхгүй** (frontend gate).
- **`GET /config`** (public) — `{ data: { JPY, USD, lots, ... } }`. `JPY` = иен→төгрөгийн ханш.

Proxy (`src/app/api/proxy/[...path]/route.ts`) нь session cookie-оос Bearer token-ыг backend руу
автоматаар дамжуулдаг тул `/bids` client талаас authenticated болно.

## 4. v2 стекийн баримтууд

- **Session (client):** `useSession()` (next-auth 5). `session.user: CustomerUser` =
  `{ id, email, phone, firstname, lastname, balance, currency, type, status }`.
  Wallet/deposit тусдаа талбар БАЙХГҮЙ — `balance` (number) ашиглана.
- **Client API:** `import Api from "@/services/Api"` → `Api.post("/calculator", body)` нь бүтэн JSON
  body буцаана (тухайлбал `res.data.average`).
- **Server API:** `ServerApi.get("/config")` (`src/services/ServerApi.ts`).
- **Navigation:** locale-aware `Link`, `useRouter` нь `@/i18n/navigation`-оос.
- **antd v6:** `App.useApp()` → `{ modal, message }`; `Grid.useBreakpoint()`; `Drawer` `placement="bottom"`.
- **CarFixture:** `/japan/[id]` нь `auctionLotToFixture` ашигладаг тул `car.ID` = AJES lot id →
  `/bids`-ийн `auction_id`. Шаардагдах талбарууд бүгд байгаа: `KUZOV, ENG_V, YEAR, RATE, START,
  AUCTION_DATE, STATUS, LOT, ID`.

## 5. Компонентын бүтэц

### 5.1 Шинэ файлууд

**`src/services/config.ts`** (server-only)
```ts
export const getConfig = cache(async (): Promise<{ JPY: number; USD: number }> => {
  const { data } = await ServerApi.get<{ data: Record<string, string> }>("/config", {}, { cache: "no-store" });
  return { JPY: Number(data.JPY) || 0, USD: Number(data.USD) || 0 };
});
```
Алдаа гарвал `{ JPY: 0, USD: 0 }` буцааж, панелд ханш байхгүй ч ажиллана (JPY-ийн MNT преview л алга болно).

**`src/lib/bidConfig.ts`**
```ts
export const MINIMUM_BALANCE = 2_000_000; // MNT
export function advanceTier(bidMnt: number): { percent: number; remainderPercent: number } {
  if (bidMnt <= 30_000_000) return { percent: 20, remainderPercent: 80 };
  if (bidMnt <= 120_000_000) return { percent: 30, remainderPercent: 70 };
  return { percent: 60, remainderPercent: 40 };
}
export const formatMnt = (n: number) => new Intl.NumberFormat("mn-MN").format(Math.round(n)) + "₮";
export const formatJpy = (n: number) => new Intl.NumberFormat("ja-JP").format(Math.round(n)) + "¥";
```

**`src/components/car-detail/CarBidSection.tsx`** (client) — "ухаалаг" wrapper.
- `useSession()`, `Grid.useBreakpoint()`, `App.useApp()`.
- Gating тооцоо (доор 5.3).
- Форм харагдах ёстой үед mount дээр нэг удаа `/calculator` дуудаж `minAmount` (MNT доод үнэ) +
  `loadingMin` авна.
- `Grid.useBreakpoint()`-оор **desktop-inline** эсвэл **mobile-sticky+Drawer**-ийн аль нэгийг **л**
  рендерлэнэ (давхар mount, давхар calculator дуудлагаас сэргийлнэ).
- `<CarBidForm>`-д `minAmount, jpyRate, car, userType` дамжуулна. Gating карт (login/deposit/closed)-ыг
  энд рендерлэнэ.

**`src/components/car-detail/CarBidForm.tsx`** (client) — форм өөрөө.
- antd `Form` instance эзэмшинэ, `bid_price` + `currency` watch.
- Валидаци, урьдчилгаа задаргаа, submit (`/bids`) + confirm/success/error modal.
- Яг нэг л удаа mount хийгдэнэ (breakpoint-оор).

### 5.2 Өөрчлөгдөх файлууд

**`src/components/car-detail/CarDetail.tsx`**
- `Props`-д `enableBid?: boolean` нэмнэ.
- `enableBid` үед `getConfig()`-оос `jpyRate` server-side татна.
- Одоогийн desktop CTA (`<CarBidCta>`) болон mobile sticky CTA хэсгийг: `enableBid` бол `<CarBidSection>`,
  эс бол одоогийн `<CarBidCta>`-гаар (хэвээр) орлуулна. `CarBidSection` өөрөө desktop/mobile layout-оо
  дотроо зохицуулна (одоогийн `hidden lg:block` desktop блок + mobile sticky bar-ыг орлоно).

**`src/app/[locale]/japan/[id]/page.tsx`**
```tsx
return <CarDetail car={auctionLotToFixture(lot)} hidePrice enableBid />;
```

### 5.3 CarBidSection — Gating (4 төлөв)

Дараах эрэмбээр:

1. **Дуудлага хаагдсан** — `STATUS ∈ {SOLD, Sold}` ЭСВЭЛ `AUCTION_DATE` тогтсон (цаг ≠ 00:00:00) бөгөөд
   `now > AUCTION_DATE − 2ц` → "Хугацаа дууссан" карт. (dayjs ашиглана; backend мөн шалгана.)
2. **Нэвтрээгүй** (`!session`) → login/register карт. Locale-aware `Link`
   `href="/auth/login"` + `?callbackUrl` (одоогийн pathname).
3. **Deposit хүрэлцээгүй** (`balance < MINIMUM_BALANCE`) → "Данс цэнэглэнэ үү (2 сая ₮)" карт + холбоо
   барих CTA.
4. **Форм** (`balance ≥ MINIMUM_BALANCE`) → `<CarBidForm>`.

> Тэмдэглэл: `balance`-ийн валют (MNT vs JPY хэрэглэгч) талаар v1-ийн адил энгийн threshold ашиглана.
> JPY-balance хэрэглэгчийн хувьд энэ нь төгс биш ч v1 зан төлөвтэй нийцнэ. Ирээдүйд `user.currency`-ээр
> сайжруулж болно.

## 6. CarBidForm — логик

### 6.1 Талбарууд
- `currency` — antd `Select` (`₮`/`¥`), `disabled = userType !== 2`, default `"MNT"`.
- `bid_price` — antd `InputNumber`, мянгатын таслалтай formatter, `prefix` валютаас хамаарна,
  `addonAfter = currency Select`.

### 6.2 Валидаци (`bid_price`)
- `required`.
- Валютаас хамаарсан доод хязгаар:
  - `currency === "JPY"` → `bid > Number(car.START)` (иен эхлэх үнэ).
  - `currency === "MNT"` → `bid > minAmount` (calculator-ийн MNT доод үнэ).
- Валют солиход `bid_price`-ыг дахин validate хийнэ (`useEffect` currency watch дээр).
- Help текст: JPY бол `Эхлэх үнэ: {formatJpy(START)}`; MNT бол `Доод үнэ: {formatMnt(minAmount)}`.
- `loadingMin` үед товч `loading`.

### 6.3 Урьдчилгаа задаргаа (шаардлага #5, зөвхөн MNT)
`currency === "MNT"` бөгөөд `bid_price > 0` үед 2 мөр:
- `Урьдчилгаа {percent}%` = `bid_price * percent / 100`
- `Монголд буусны дараах төлбөр` = `bid_price * remainderPercent / 100`

`percent`-ийг `advanceTier(bid_price)`-аас авна.

### 6.4 Submit
1. `modal.confirm({ title: "Үнэ илгээх үү?", content: "...", okText: "Үнэ илгээх" })`.
2. OK дээр `Api.post("/bids", { auction_id: car.ID, bid_price, currency })`.
3. Амжилт → `modal.success({ content: res.message })` → `router.push("/dashboard")` (locale-aware).
4. Алдаа (`ApiError`) → `modal.error({ content: err.message })`. Timing/balance татгалзлыг backend-ийн
   мессежээр шууд харуулна.

## 7. Өгөгдлийн урсгал

```
CarDetail (server, enableBid)
  └─ getConfig() → jpyRate ─┐
                            ▼
  CarBidSection (client) ── useSession(), Grid.useBreakpoint()
    ├─ gating: closed / guest / deposit / form
    ├─ mount → Api.post("/calculator") → minAmount
    └─ CarBidForm (client)
         ├─ Api.post("/bids", { auction_id: car.ID, ... })
         └─ router.push("/dashboard")
```

## 8. i18n

`carDetail.bid.*` namespace-ийг `messages/{mn,en,ru}.json` бүгдэд өргөтгөнө. Түлхүүрүүд (жишээ):
`title, currencyLabel, priceLabel, minPriceHelp, startPriceHelp, belowMin, required, advanceLabel,
remainderLabel, submit, confirmTitle, confirmBody, successTitle, errorTitle, guestTitle, guestBody,
login, register, depositTitle, depositBody, contact, closedTitle, closedBody, ok`. Одоо байгаа
`bid.cta/helper/comingSoon*` түлхүүрүүд `/korea`, `/cars`-ийн CTA-д хэрэгтэй хэвээр тул үлдээнэ.

## 9. Хамрахгүй зүйлс (YAGNI)

- Урьдчилгааны tier-ийг backend-ээс тооцоолох (frontend-only хэвээр).
- Live Mongolbank ханшийн hook (`/config` хангалттай).
- `/korea`, `/cars` хуудсанд bidding нэмэх.
- Bid засах/цуцлах UI (dashboard-ийн ажил, энэ scope-д үгүй).
- `balance`-ийн валютыг нарийвчлан ялгах (v1 threshold зан төлөв хэвээр).

## 10. Гол эрсдэл / шалгах зүйлс

- `Grid.useBreakpoint()` эхний render дээр хоосон буцааж hydration flash үүсгэж болзошгүй → mount хүртэл
  тодорхой default (жишээ mobile) ашиглах, эсвэл `mounted` flag-аар хамгаалах.
- `/config` унавал bid форм ажиллах ёстой (JPY preview л алга болно) — алдааг зөөлөн барина.
- `car.ID` заавал AJES lot id байх ёстой — `/japan/[id]` = `auctionLotToFixture` тул зөв. `enableBid`-ийг
  зөвхөн энэ route-д өгнө.
