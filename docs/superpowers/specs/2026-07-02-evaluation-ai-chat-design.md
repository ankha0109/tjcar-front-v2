# Үнэлгээний хуудасны AI чат — бодит backend холболт — Дизайн

**Огноо:** 2026-07-02
**Хамрах хүрээ:** `EvaluationAiChat`-ыг статик хариултаас бодит vision AI руу шилжүүлэх. Frontend (`tjcar-front-v2`) + Backend (`/Users/ankhbayar/Herd/tjcar-api-v2`) хоёуланд өөрчлөлт орно.
**Өмнөх байдал:** `EvaluationAiChat.tsx` нь `src/lib/evaluationChat.ts`-ийн keyword matching-аар `messages/*.json`-ийн бэлэн хариултуудыг харуулдаг статик demo.

## 1. Зорилго / шаардлагууд

1. Үнэлгээний хуудасны **зургийг** AI-д өгч бодитоор шинжлүүлж тайлбарлуулна.
2. Машины **марк, модел, он, үнэлгээ (rate/grade/equip)**-г зурагтай хамт дамжуулна.
3. AI нь **зөвхөн тухайн машины үнэлгээ, төлөв байдлын** асуултад хариулна — бусад сэдвийг эелдгээр татгалзана.
4. Хариулт хэрэглэгчийн locale (mn/en/ru)-аар байна.

## 2. Тодорхойлсон шийдвэрүүд

| Асуулт | Шийдвэр |
|---|---|
| Шинжилгээ хэзээ ажиллах | Машин + locale бүрд **нэг л удаа** ажиллаж, үр дүн cache-лэгдэнэ. Дараагийн үзэлтүүд cache-ээс шууд авна. |
| Follow-up асуултын контекст | **Зураг + cache-лсэн шинжилгээ хоёуланг** асуулт бүрт AI-д өгнө (байрлал/тэмдэгтийн нарийн асуултад зураг заавал хэрэгтэй). |
| Хандалт | **Зочдод нээлттэй**, IP-д суурилсан rate limit-тэй (глобал чаттай ижил бодлого, тусдаа limiter). |
| Дамжуулах хэлбэр | **Streaming** — одоогийн `/ai/chat`-ын Echo/Reverb инфраг дахин ашиглана (`text_delta` → `stream_end`). Cache hit intro нь stream-гүй шууд JSON. |
| Харилцан ярианы төлөв | **Stateless** — DB-д `AgentConversation` үүсгэхгүй. Frontend сүүлийн ~6 мессежийг request бүрт дамжуулна. |
| Модель | `gpt-5.4-mini` (одоогийн чаттай ижил, vision дэмждэг, OpenAI default provider). |

## 3. Backend дизайн (tjcar-api-v2)

### 3.1 Route-ууд (`routes/api.php`, `ai` prefix дотор)

```php
Route::middleware('throttle:ai-evaluation')->prefix('evaluation')->group(function () {
    Route::post('intro', [EvaluationChatController::class, 'intro']);
    Route::post('chat', [EvaluationChatController::class, 'chat']);
});
```

Шинэ `ai-evaluation` rate limiter (`AppServiceProvider`/`bootstrap` дээр глобал `ai-chat`-тай зэрэгцүүлж): IP тус бүрээр минутад ~10 хүсэлт.

### 3.2 `POST /ai/evaluation/intro`

- **Request:** `{ car_id, image_url, marka, model, year, rate, grade, equip }`
- **Validation:** `car_id`, `image_url` заавал; бусад нь nullable string (max 100 тэмдэгт тус бүр).
- **Cache түлхүүр:** `ai:eval:{car_id}:{locale}`, TTL 30 хоног, Laravel `Cache` facade (database store).
- **Cache hit:** `200 { analysis: string, cached: true }` — шууд буцна, stream үгүй.
- **Cache miss:** `200 { channel: string }` буцаагаад `ChatService::dispatchStream`-тэй ижил хэв маягаар queue дээр vision агент ажиллуулж, `Channel("eval.{uuid}")` public суваг руу `text_delta`/`stream_end` broadcast хийнэ. Stream амжилттай дуусмагц бүтэн текстийг cache-д бичнэ.

### 3.3 `POST /ai/evaluation/chat`

- **Request:** `{ question, history: [{role, content}...], car_id, image_url, marka, model, year, rate, grade, equip }`
- **Validation:** `question` max 500 тэмдэгт; `history` max 6 элемент, элемент бүрийн `content` max 2000 тэмдэгт, `role` ∈ {user, assistant}.
- **Response:** `200 { channel }` → intro-той ижил streaming протокол.
- Агентад: system instructions + cache-лсэн шинжилгээ (байвал) + `history` + асуулт, мөн `Image::fromUrl($image_url)` хавсаргана.

### 3.4 `App\Services\Ai\EvaluationChatService`

`ChatService`-тэй ижил бүтэцтэй шинэ сервис:

- `INSTRUCTIONS` constant (Монгол суурь + "хэрэглэгчийн хэлээр хариул" заавар): Та TJ CAR-ийн дуудлага худалдааны үнэлгээний хуудас тайлбарлагч AI. Танд машины үнэлгээний хуудасны зураг, марк/модел/он, үнэлгээний дүн өгөгдөнө. Зөвхөн энэ машины үнэлгээ, гэмтлийн тэмдэглэгээ, тоноглол, төлөв байдлын асуултад хариул. Огт өөр сэдэв (улс төр, спорт, өөр машин худалдаж авах зөвлөгөө г.м.)-ийг "Би зөвхөн энэ машины үнэлгээний хуудасны талаар хариулах боломжтой" гэж татгалз. Auction sheet-ийн стандарт тэмдэглэгээг (A/U/W/S/C, 4.5/R/RA grade г.м.) тайлбарлаж чадна.
- `dispatchIntroStream(...)` — vision агент + cache бичилт
- `dispatchChatStream(...)` — vision агент + history
- Хэл: request-ийн `Accept-Language`-аас locale-ийг авч instructions-д "Хариултаа {locale} хэлээр бич" гэж нэмнэ.

### 3.5 Хамгаалалт

- **Image host allowlist:** `image_url`-ийн hostname нь `config/services.php` (эсвэл шинэ config)-д env-ээр тохируулсан домэйн жагсаалтад байх ёстой. Үгүй бол `422`. Энэ нь endpoint-ыг үнэгүй OCR/vision үйлчилгээ болгон ашиглахаас сэргийлнэ.
- Throttle (3.1), богино утгын validation (3.3).
- Broadcast суваг нь таамаглах боломжгүй UUID-тай public channel (глобал guest чаттай ижил загвар).

## 4. Frontend дизайн (tjcar-front-v2)

### 4.1 `CarEvaluation.tsx`

`EvaluationAiChat`-д шинэ prop-ууд: `image` (үнэлгээний хуудасны URL — `withImageSize(image, "original")`), `carId` (`car.ID`), `marka` (`car.MARKA_NAME`), `model` (`car.MODEL_NAME`), `year`. Одоогийн `rate/grade/equip` хэвээр.

### 4.2 `EvaluationAiChat.tsx`

- **Mount:** `Api().post("/ai/evaluation/intro", {...})` — `Api.ts` нь `/api/v1` proxy + `Accept-Language` (NEXT_LOCALE cookie)-ийг автоматаар өгдөг тул locale/auth асуудалгүй.
  - `{ analysis }` ирвэл шууд assistant мессеж болгож харуулна.
  - `{ channel }` ирвэл `getEcho()`-оор subscribe хийж `text_delta`-г урсган, `stream_end`-д хаана.
- **Асуулт:** `Api().post("/ai/evaluation/chat", { question, history: сүүлийн 6, ...car context })` → мөн stream.
- **`useEvaluationStream` hook** (шинэ файл, `src/hooks/`): channel subscribe / delta append / stream_end / error / cleanup логик. `AiChatContext`-ын дотоод логикийг хуулбарлан тусгаарлана — глобал чатыг **хөндөхгүй** (нэгтгэх refactor нь хамрах хүрээнээс гадуур).
- Suggested асуултууд (`carDetail.evaluation.ai.suggested`) хэвээр — одоо бодит AI руу илгээгдэнэ.
- **Алдаа:** error bubble + retry товч; `429` үед rate limit мессеж (глобал чатын UX загвар). Backend унасан үед intro-ийн орчуулгын статик fallback текст харуулна.

### 4.3 Устгах / өөрчлөх

- Устгах: `src/lib/evaluationChat.ts` (keyword matching бүхэлдээ, `SUGGESTED_ANSWER_KEYS` хамт).
- `messages/{mn,en,ru}.json`: `carDetail.evaluation.ai.answers.*` бэлэн хариултуудыг устгана; `intro`-г "AI шинжилж байна..." loading/fallback утга болгож солино; error/retry түлхүүрүүд нэмнэ. **Гурван locale зэрэг.**

## 5. Алдааны боловсруулалт

| Тохиолдол | Үйлдэл |
|---|---|
| intro/chat HTTP алдаа | Error bubble + retry; intro-д статик fallback текст |
| `429` | Rate limit мессеж, retry идэвхгүй хэсэг хугацаанд |
| Stream тасрах (`.error` event) | Error bubble + retry |
| Зургийн URL allowlist-д байхгүй | Backend `422` — frontend generic алдаа (хэвийн хэрэглээнд гарахгүй) |
| AI провайдер уначихвал | Queue job fail → `.error` broadcast → frontend error bubble |

## 6. Туршилт

- **Backend (Pest):** validation (question/history/image_url хязгаарууд), image host allowlist `422`, cache hit → JSON зам, cache miss → channel зам, throttle 429. AI дуудлагыг laravel/ai-ийн fake/mock-оор орлуулна.
- **Frontend:** `pnpm build` + type check амжилттай. `EvaluationAiChat` static хэвээр орж ирсэн import үлдээгүй эсэх (`evaluationChat` устгагдсаныг баталгаажуулах).
- **End-to-end гар шалгалт:** local Herd (`tjcar-api-v2.test`) + Reverb + бодит OpenAI key-тэй `/japan/[id]` хуудсан дээр: (1) intro stream → refresh → cache hit шууд гарах, (2) follow-up асуулт зургийн агуулгаар зөв хариулах, (3) сэдвээс гадуур асуултыг татгалзах.

## 7. Хамрах хүрээнээс гадуур

- Глобал `AiChatContext`-тай streaming логик нэгтгэх refactor.
- Admin analytics (`ChatInsightService`)-д үнэлгээний Q&A бүртгэх.
- Урьдчилан шинжлэх background job.
- Солонгос машины үнэлгээний хуудас (одоогоор `CarEvaluation` нь evaluation image байгаа үед л харагддаг — байгаа газарт нь автоматаар ажиллана).
