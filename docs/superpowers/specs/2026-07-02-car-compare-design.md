# Машин харьцуулах (Compare) — Дизайн

**Огноо:** 2026-07-02
**Хамрах хүрээ:** Япон (AJES) + Солонгос (CARAPIS) машинуудыг харьцуулах бүрэн функц — frontend (store, header dropdown, `/compare` хуудас) + backend (`GET /api/compare` batch endpoint).
**Эх сурвалж:** Wishlist функцийн архитектур (`wishlistStore` + `useSyncExternalStore` + snapshot) загвар болно.

## 1. Зорилго / шаардлагууд

1. **Холимог харьцуулалт** — Япон дотроо, Солонгос дотроо, эсвэл Япон↔Солонгос хооронд.
2. **Header badge + dropdown** — сонгосон машины тоо Badge-аар, icon дарахад custom dropdown-д машин бүрийн товч мэдээлэл (зураг, нэр, он, үнэ) + устгах + «Харьцуулах» товч.
3. **`/compare` хуудас** — бүх боломжит датагаар дэлгэрэнгүй хүснэгт.
4. **Local storage** — DB-д хадгалахгүй, localStorage; refresh-д алдагдахгүй.
5. **Авто цэвэрлэлт** — харьцуулалт амжилттай ачаалагдмагц түр жагсаалт цэвэрлэгдэнэ.

## 2. Тодорхойлсон шийдвэрүүд

| Асуулт | Шийдвэр |
|---|---|
| Цэвэрлэлтийн мөч | ID-нууд URL-д (`/compare?items=japan:123,korea:uuid`) явна. `/compare` дээр ≥1 машин амжилттай ачаалагдмагц store автоматаар цэвэрлэгдэнэ (badge → 0). Refresh-д URL хэвээр тул хүснэгт алдагдахгүй. Бүгд 404 бол store-ыг хадгална. |
| Дээд хязгаар | **4 машин.** Дүүрсэн үед toggle → `message.warning`. |
| Хүснэгтийн хэлбэр | Нэгдсэн мөрүүд + «—» (аль нэг эх үүсвэрт байхгүй талбар). Бүлгүүд: Ерөнхий / Үнэ / Техник / Дуудлага худалдаа (Япон-only) / Байдал (Солонгос-only). |
| Дата эх | Шинэ `GET /api/compare` — backend AJES/CARAPIS руу fan-out, fresh бүрэн дата. localStorage-д зөвхөн dropdown-д зориулсан хураангуй snapshot. |
| `CompareItem` төрөл | `WishlistItem`-ийн alias (snapshot хэрэгцээ ижил). Builders нь wishlist builders-ийн re-export. |
| Store дараалал | Append (wishlist-ийн prepend биш) — сонгосон дараалал URL/хүснэгтийн багана болно. |
| Premium USS branch | Compare endpoint алгасна — base AJES дата л буцаана (public, auth шаардахгүй). |
| Japan кэш | `compare:auction:{id}` 300s (`/auctions/{id}` live хэвээр). `PRICE_MNT` тооцоолол кэшлэгдэх өгөгдөл дотор. |
| Japan MNT үнэ | `CalculatorService->calculator(KUZOV, ENG_V, YEAR, RATE, avgPrice)` (`UpdateFeaturedCars` загвар); алдаа/0 → `null` → «—». |
| Олдоогүй машин | Entry `found:false, car:null` — бүхэл хүсэлт унахгүй. Frontend: Alert + хүснэгтээс хасна. |
| `source:"korea"` хуурамч кэйс | `FeaturedAuctionSchedule` AJES датаг korea гэж тэмдэглэдэг тул тэнд `disableCompare` prop дамжуулж товчийг нуана. `/cars/[id]` (локал stock) мөн compare-гүй. |

## 3. Backend contract (шинэ)

**`GET /api/compare?items=japan:{ID},korea:{UUID}`** (public)

- Validation: `items` таслалаар задарна → `array|min:1|max:4`, элемент бүр `^(japan:[A-Za-z0-9]+|korea:[A-Za-z0-9_-]+)$`, `distinct`. Буруу бол 422.
- Response (хүсэлтийн дараалал хадгална):

```json
{ "data": [
  { "source": "japan", "id": "5GTW...", "found": true,  "car": { "...AuctionLotResource + PRICE_MNT": null } },
  { "source": "korea", "id": "d201...", "found": true,  "car": { "...KoreaListingResource (price_mnt-тэй)": null } },
  { "source": "japan", "id": "dead1", "found": false, "car": null }
] }
```

- Шинэ файлууд: `UsdRateResolver` (KoreaListingController-ийн `usdRate()`-ийг татан гаргасан), `CompareRequest`, `CompareService`, `CompareController` (invokable), `CompareTest`.

## 4. Frontend бүтэц

### 4.1 Шинэ файлууд

- `src/types/compare.ts` — `CompareItem` alias, `MAX_COMPARE=4`, `CompareSource`, `isComparableSource`, `parseCompareParam`/`buildCompareParam`.
- `src/lib/compareStore.ts` — `tjcar:compare:v1` / `tjcar:compare:change`; `add():boolean`, `toggle(): "added"|"removed"|"full"`, `isFull()`, append дараалал.
- `src/hooks/useCompare.ts` — local-only `useSyncExternalStore` hook.
- `src/lib/compare.ts` — builder re-exports.
- `src/services/compare.ts` — server-only `getCompare(items)` → `CompareEntry[]`.
- `src/lib/compareAdapter.ts` — `COMPARE_SECTIONS` мөрийн загвар + `comparedCarFromEntry` normalizer (суурь: `fromFeaturedCar`, `koreaListingToCarItem`).
- `src/components/layout/desktop/CompareDropdown.tsx` — Badge + antd v6 `Dropdown popupRender`.
- `src/components/compare/{CompareView,CompareTable,CompareFromStore}.tsx` — авто цэвэрлэлт + Alert / sticky хүснэгт / store→URL redirect.

### 4.2 Өөрчлөгдөх файлууд

- `CardActions.tsx` — stub → `useCompare`; `disableCompare` prop (`CarCard`/`CarListItem`/`CarTableView`-ээр дамжина).
- `CarActionButtons.tsx` — stub → `useCompare`; `enableCompare` prop (Japan detail ✓, Korea detail ✓, stock ✗).
- `DesktopHeader.tsx` — `compareCount=0` устгаж `<CompareDropdown />`.
- `MobileDrawer.tsx` — compare entry + badge.
- `src/app/[locale]/compare/page.tsx` — stub → жинхэнэ хуудас.
- `messages/{mn,en,ru}.json` — `compare` namespace өргөтгөнө.

## 5. Хүснэгтийн мөрийн загвар

| Бүлэг | Мөрүүд | Japan эх | Korea эх |
|---|---|---|---|
| Ерөнхий | brand, model, grade, year, bodyType, color, region, evaluation | MARKA_NAME, MODEL_NAME, GRADE, YEAR, KUZOV, COLOR, TOWN, IMAGES[0] | brand_name, model_name, trim, year, body_type, color, region, photos[0] |
| Үнэ | priceOriginal, priceUsd, avgPrice, priceMnt | START (JPY), —, AVG_STRING/AVG_PRICE, PRICE_MNT | price_original+currency, price_usd, —, price_mnt |
| Техник | mileage, engine, transmission, fuel, drive | MILEAGE, ENG_V, KPP, —, LHDRIVE | mileage, engine_cc, transmission, fuel_type, drive_type |
| Дуудлага худалдаа | auctionName, auctionDate, lot, rate, equipment | AUCTION, AUCTION_DATE, LOT, RATE, EQUIP | — |
| Байдал | accident, owners, verified, region | — | has_accident, owner_count, is_verified, region |

Утгын формат: MNT → `formatMnt`; тоо → `.toLocaleString()` + CarCard-тай ижил unit suffix; boolean → Тийм/Үгүй; байхгүй → «—».

**Зургийн конвенц:** зураг 1-ээс олон үед index 0 нь үнэлгээний (үзлэгийн) хуудас — CarDetail-ийн gallery split-тэй ижил. Тиймээс машины нүүр зураг (snapshot `thumbnail`, хүснэгтийн баганын зураг) нь `images[1]`, харин `images[0]` нь тусдаа `evaluationImage` талбарт хадгалагдаж, хүснэгтэд «Үнэлгээний хуудас» мөрөнд шинэ tab-аар нээгдэх thumbnail болж харагдана. Зөвхөн 1 зурагтай бол тэр нь машины зураг гэж үзнэ.
