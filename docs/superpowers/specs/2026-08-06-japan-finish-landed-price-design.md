# Japan lot — landed MNT under the auction result price

Дууссан Японы лотын хуудсанд, аукционы эцсийн ¥ дүнгийн доор, тухайн машиныг
Монголд авчрахад гарах төгрөгийн дүнг жижгээр харуулна. Дүнг **шинэ**
тооцоолуур (`App\Services\VehicleCost`, `POST /v1/vehicle-cost/calculate`-ийн
ард байдаг) гаргана.

Хамрах хүрээ: хоёр репо — `tjcar-api-v2` (тооцоолол, шинэ талбар) ба
`tjcar-front-v2` (харуулалт).

## Асуудал

`AuctionResultSection` дууссан лотын `FINISH`-ийг зөвхөн иенээр харуулдаг
(`AuctionResultSection.tsx`). Худалдан авагчийн шийдвэрт хэрэгтэй тоо бол
төгрөгийн эцсийн өртөг.

Хуудсанд аль хэдийн нэг төгрөгийн дүн байгаа — `LandedPriceCard`-ийн харуулдаг
`PRICE_MNT` (`JapanCarDetail.tsx`). Гэхдээ тэр нь **өөр зүйл**: ижил
chassis + он + rate-тэй сүүлийн 10 борлуулалтын **дундаж**-аас, **хуучин**
`CalculatorService`-ээр бодогдсон таамаг. Энэ лот өөрөө ямар үнээр зарагдсаныг
илэрхийлдэггүй.

## Шийдэл

`GET /api/japan/{id}` хариунд `FINISH_LANDED_MNT` шинэ талбар нэмнэ — энэ лотын
өөрийн `FINISH`-ийг шинэ тооцоолуураар бодсон Монгол дахь нийт өртөг. Front тал
зөвхөн хэвлэнэ.

### Яагаад лотын хариунд, тусад нь дуудахгүй вэ

Шинэ тооцоолуур Японы хувьд `freightUSD`-ийг **заавал** нэхдэг
(`CalculateVehicleCostRequest.php:29`) — Солонгос шиг default байхгүй. Тэр дүн
нь `transport_costs` хүснэгтээс chassis-аар олддог серверийн мэдээлэл тул front
тал өөрөө нөхөж чадахгүй. Ямар ч тохиолдолд backend-д өөрчлөлт хэрэгтэй байсан
бөгөөд лотын хариунд шууд суулгах нь хамгийн бага өртөгтэй: нэмэлт HTTP хүсэлт
байхгүй, тоо эхний paint дээрээ гарна.

Талбар нь **зөвхөн нийт дүн** (`number | null`), задаргаа биш. Хүсэлт нь
«доод талд жижгээр нэг тоо» — `lines[]`-ийг зөөх нь одоо ашиглагдахгүй payload.

## Backend — `tjcar-api-v2`

### `FinishLandedPrice` сервис

Шинэ класс `App\Services\Auction\FinishLandedPrice`.

`LandedPriceEstimator`-т арга нэмэхгүй: тэр класс бүхэлдээ хуучин
`CalculatorService`-ийн тухай баримтжуулагдсан ("the single implementation
behind every гар дээр ирэх үнэ the API serves"), v1-ийн арга тэнд орвол нэг
класст хоёр формул холилдоно.

AJES мөрөөс v1-ийн оролт:

| v1 талбар | Эх сурвалж |
|---|---|
| `country` | `JAPAN` |
| `purchasePriceJPY` | `FINISH` |
| `auctionName` | `trim(AUCTION)` |
| `freightUSD` | `JapanFreightResolver` (доор) |
| `manufactureYear` | `YEAR` |
| `engineCc` | `ENG_V` |
| `chassis` | `KUZOV` — `PowertrainResolver` хайбрид эсэхийг тогтооно |
| `manufactureMonth` | **өгөхгүй** |

`manufactureMonth`-ыг өгөхгүй нь санаатай: AJES лот сар агуулдаггүй. Тухайн үед
`age.source` нь `ASSUMED` болж, сервер хуучин `/calculator`-ын дүрмээр нас
тооцно (жилийн зөрүү, яг 10 бол 9) — өөрөөр хэлбэл хуучин тайлтай ижил насны
суурь дээр.

Дүнг `VehicleCostCalculator::calculate()`-ийн буцаасан массивын
`result.landedCostMNT`-ээс авна. `additionalCostsMNT` дамжуулахгүй тул энэ нь
`CostBreakdownBuilder`-ийн `total.amount`-тай яг тэнцүү — builder дуудах
шаардлагагүй.

Дүрэм:

- `FINISH <= 0` (эсвэл байхгүй) → `null`. Ирээдүйн лот энд ордог.
- `VehicleCostException` (`AUCTION_NOT_FOUND`, `INVALID_ENGINE_CC`,
  `EXCHANGE_RATE_UNAVAILABLE`, …) болон бусад `Throwable` → `Log::warning` +
  `null`. `LandedPriceEstimator::estimate`-тэй ижил зарчим: нэг үнэлэгдэхгүй лот
  бүтэн хуудсыг унагаахгүй, гэхдээ чимээгүй ч алга болохгүй. `AUCTION_NOT_FOUND`
  бол бодит тохиолдол — `CompareJapanVehicleCost` «FOB алга» гэж алгасдаг лотууд
  байдаг.

### `JapanFreightResolver`

Freight-ийн логик аль хэдийн **хоёр** газар давхардсан:
`CalculatorService::transportUsd` (private) ба
`CompareJapanVehicleCost::legacyFreightUsd`. Гуравдахийг нэмэхгүй — шинэ
`App\Services\VehicleCost\JapanFreightResolver` болгон гаргаж, гурвуулаа тэрийг
дуудна.

Логик өөрчлөгдөхгүй, verbatim: `transport_costs`-оос `value = <chassis>` мөр
олж, `transportType->{$transportConfig}`; олдохгүй бол
`TransportType::findOrFail(2)->{$transportConfig}`. `$transportConfig` нь
`configs` хүснэгтийн `transport` мөр (`regular` | `express`).

`CalculatorService`-ийн chassis-аар memoize хийдэг зан хэвээр үлдэнэ — жагсаалт
үнэлэхэд нэг chassis дахин дахин ирдэг.

### `AuctionController::show`

`PRICE_MNT` тавьдаг мөрийн дараа:

```php
$row['FINISH_LANDED_MNT'] = $this->finishLandedPrice->forLot($row);
```

`AuctionLotResource` бол pass-through тул өөр өөрчлөлт хэрэггүй.

Зөвхөн `show`. Жагсаалт (`/japan`), `/compare`, `/japan/history` хөндөхгүй —
хүсэлт нь дэлгэрэнгүй хуудасны тухай, мөн жагсаалтад мөр тутамд нэмэлт
хайлт хийх нь шаардлагагүй зардал.

Гүйцэтгэлийн зардал: upstream дуудлага **байхгүй**. `auction_fobs`,
`transport_costs`, `transport_types`, `configs`, `hybrid_chassis` бүгд дотоод
хүснэгт. `PRICE_MNT`-ийн comparable lookup (~300ms upstream) хэвээр үлдэнэ.

### Тестүүд

`tests/Feature/Public/AuctionTest.php`:

- Дууссан лот (`FINISH > 0`, танигдах `AUCTION`) → `FINISH_LANDED_MNT` эерэг
  бүхэл тоо.
- Ирээдүйн лот (`FINISH` хоосон/0) → `null`.
- FOB-д байхгүй `AUCTION`-той лот → `null`, хариу 200 (500 биш).

`tests/Unit`-д `JapanFreightResolver` — chassis мөр олдсон/олдоогүй хоёр зам.

## Frontend — `tjcar-front-v2`

### Төрлүүд

`src/types/featured.ts` → `FeaturedCar`-т:

```ts
/**
 * This lot's OWN FINISH run through the v1 vehicle-cost calculator — the total
 * MNT to land THIS car. `/japan/{id}` only; null when the lot has no FINISH or
 * the calculator refused it (unknown auction, missing rate).
 *
 * Not a second opinion on PRICE_MNT: that field is a comparable-sales AVERAGE
 * from the legacy calculator, this one is what this exact car fetched.
 */
FINISH_LANDED_MNT?: number | null;
```

`src/lib/carFixtures.ts` → `CarFixture`-т `FINISH_LANDED_MNT: number | null`;
`auctionLotToFixture` дамжуулна, бусад builder (`carResourceToFixture`,
`koreaListingToFixture`) `null`.

### `AuctionResultSection`

Шинэ prop `landedMnt?: number | null`. `JapanCarDetail`
`landedMnt={car.FINISH_LANDED_MNT}` дамжуулна.

Үндсэн картад ¥ дүнгийн доор:

```
ЗАРАГДСАН ҮНЭ
1,405,000¥
Гар дээр ирэхэд ≈ 104,517,347₮
```

- `formatMnt` (`@/lib/bidConfig`).
- `text-[12px] font-medium text-neutral-500 dark:text-neutral-400`.
- `landedMnt` нь `null` эсвэл `<= 0` бол мөр **огт гарахгүй**. «Тодорхойгүй»
  гэж бичихгүй — гол тоо аль хэдийн байгаа, орлуулах юмгүй.

Мобайлын доод sticky bar-т мөн — `¥` мөрийн доор шошгогүй, `text-[11px]`:

```
● Зарагдсан            ♡  ⇄
1,405,000¥
≈ 104,517,347₮
```

Bar `aria-hidden` хэвээр (үндсэн картын хуулбар).

### Төлөвүүд

Бүх дууссан лотод гарна — `sold`, `unsold`, `cancelled`, `other`. Зарагдаагүй
лот дээр `FINISH` бол талбарын хүрсэн хамгийн өндөр санал (дээрх шошго
«Дуудсан хамгийн өндөр үнэ» болж солигддог), тэр үнээр авбал төгрөгөөр хэд
болохыг харуулах нь худалдан авагчид мөн адил хэрэгтэй.

### i18n

`carDetail.result.landed` — гурван locale-д:

| locale | утга |
|---|---|
| `mn` | `Гар дээр ирэхэд ≈ {price}` |
| `en` | `≈ {price} landed in Mongolia` |
| `ru` | `≈ {price} с доставкой и растаможкой` |

`carDetail.landed.title` («Гар дээр ирэх **дундаж** үнэ») хэвээр — «дундаж»
гэдэг үг хоёр тоог салгаж өгнө.

Мобайл bar-т шошго байхгүй тул тусдаа түлхүүр хэрэггүй — `"≈ "` тэмдэг
(орчуулагдах үг биш) + `formatMnt`.

## Шийдсэн зүйлс

- **Хуучин тайл үлдэнэ.** `LandedPriceCard` (дундаж, хуучин тооцоолуур) болон
  шинэ мөр (энэ машин, шинэ тооцоолуур) зэрэг харагдана. Хоёр өөр асуултын хоёр
  өөр хариулт; шошго нь ялгаж өгнө.
- **Задаргаа одоохондоо алга.** Зөвхөн нийт дүн. Хэрэв дараа нь мөр мөрөөр
  харуулах шаардлага гарвал `GET /japan/{id}`-д бүтэн объект нэмэх эсвэл
  Японы лотод `calculate`-ийг шууд дуудах хоёр зам нээлттэй хэвээр.
- **Жагсаалт хөндөгдөхгүй.** `/japan`, `/compare`, `/japan/history` дээр шинэ
  талбар гарахгүй.
