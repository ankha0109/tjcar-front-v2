# Нүүр хуудасны Mongolia-Truck Lottie анимэйшн — дизайн

## Товч зорилго

Нүүр хуудасны дээд талд (hero section) Монгол улсын газрын зураг дээр УБ–Замын-Үүд хооронд нааш цааш явдаг ачааны машины 2D flat Lottie анимэйшныг нэмэх. Анимэйшн нь гараар бичсэн `.json` файл бөгөөд `lottie-react`-ээр хөрвүүлж үзүүлнэ.

## Хамрах хүрээ

Хамрагдах:
- Шинэ client component `MapAnimation.tsx`
- Гараар бичсэн Lottie JSON файл (Монгол улсын outline, зам, маркер, машин)
- [src/app/page.tsx](../../../src/app/page.tsx)-г шинэчилж hero section оруулах
- `lottie-react` dependency нэмэх

Хамаарахгүй:
- Нэмэлт элементүүд (галт тэрэг, онгоц, олон машин) — зөвхөн нэг машин
- 3D isometric загвар — Option B (2D flat) сонгогдсон
- After Effects-ээс экспортлосон Lottie файл — гараар бичнэ

## Техникийн шийдэл

**Номын сан:** `lottie-react` (React 19-тэй нийцтэй, хамгийн түгээмэл)

**Яагаад:**
- Одоогийн санал болгосон хувилбаруудаас bundle size бага (~45KB gzipped)
- React-idiomatic API (`<Lottie animationData={...} />`)
- Нэг JSON файл — портатив, өөр проект руу авч явах боломжтой

**Татгалзсан хувилбарууд:**
- **SVG + Framer Motion:** Хэрэглэгчийн анхны зорилго "Lottie" байсан тул татгалзсан. Үүнээс гадна `framer-motion` нь ~60KB нэмэгдэх байсан.
- **`@lottiefiles/dotlottie-react`:** `.lottie` формат нь After Effects-ээс экспортлодог, гараар зохиоход тохиромжгүй.

## Архитектур

### File layout

```
src/
├── components/
│   └── hero/
│       ├── MapAnimation.tsx       ← Client component, Lottie render
│       └── mongolia-truck.json    ← Lottie animation data
└── app/
    └── page.tsx                    ← Hero-ийн дээр MapAnimation оруулна
```

**Яагаад `src/components/hero/`:**
- Одоо `src/components/` дотор `cards/`, `layout/`, `pages/`, `svg/`, `dashboard/` гэсэн бүлэглэл байгаа. Hero нь тусдаа контексттэй тул өөрийн фолдертэй байх нь уялдаатай.
- JSON файл component-ийн хажууд байрлана (cohesion).

### Component interface

```tsx
// src/components/hero/MapAnimation.tsx
"use client";
import Lottie from "lottie-react";
import animationData from "./mongolia-truck.json";

export default function MapAnimation() {
  return (
    <div className="w-full max-w-7xl mx-auto aspect-12/5">
      <Lottie animationData={animationData} loop autoplay />
    </div>
  );
}
```

**Props:** Одоогоор props шаардлагагүй — анимэйшн автоматаар loop хийнэ.

### `page.tsx`-д интеграц

```tsx
// src/app/page.tsx (updated)
import MapAnimation from "@/components/hero/MapAnimation";
// ...

export default async function Home() {
  // ... existing logic ...
  return (
    <>
      <section className="w-full">
        <MapAnimation />
      </section>
      <div className="max-w-7xl mx-auto py-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Онцлох машинууд
        </h2>
        <div className="grid ...">
          {cars.map((car) => <FeaturedCard key={car.ID} car={car} />)}
        </div>
      </div>
    </>
  );
}
```

**Чухал:** `page.tsx` server component хэвээр үлдэнэ. `MapAnimation` нь client component тул Next.js автоматаар зааг тавьж өгнө.

## Lottie JSON-ны агуулга

### Canvas

- Хэмжээ: 1200×500px
- Frame rate: 30 fps
- Нийт frames: 240 (= 8 секунд)
- Loop: идэвхтэй

### Layers (доороос дээш)

1. **Background** — `#ffffff` бүрэн дэвсгэр
2. **Mongolia outline** — 20-30 bezier цэгтэй хялбаршуулсан хэлбэр
   - Fill: `#f5f5f5` (цайвар саарал)
   - Stroke: `#333333`, 1.5px
3. **Route path** — УБ (баруун-хойд) → Замын-Үүд (өмнөд) хүртэл муруй bezier
   - Stroke: `#d0d0d0`, 2px, dashed
   - Dashoffset анимэйшн → "flow" эффект
4. **UB marker** — цэг (ø 10px, `#333333`) + "УБ" текст (12px)
5. **Замын-Үүд marker** — цэг + "Замын-Үүд" текст
6. **Truck** — side-view икон:
   - Cabin, cargo box: `#f1472c` (brand primary)
   - 2 дугуй: `#1a1a1a`
   - Дугуйнууд хөдөлж байхад эргэлдэх

### Mongolia outline

Реал газар зүйн нарийвчлал шаардлагагүй, 20-30 цэгтэй simplified polygon. Canvas координат дотор УБ ≈ (750, 180), Замын-Үүд ≈ (820, 400).

### Координатууд (canvas 1200×500)

| Цэг | X | Y |
|---|---|---|
| УБ | 750 | 180 |
| Замын-Үүд | 820 | 400 |

Замын bezier нь эдгээр 2 цэгийн хооронд нэг control point-той муруйлалттай байна.

## Анимэйшний timeline

| Үе | Frames | Секунд | Агуулга |
|---|---|---|---|
| 1 | 0-15 | 0-0.5s | Fade-in: газрын зураг, маркерууд, зам гарч ирнэ |
| 2 | 15-30 | 0.5-1s | Машин УБ дээр гарч ирнэ (scale 0→1) |
| 3 | 30-105 | 1-3.5s | Машин УБ → Замын-Үүд явна (motion path дагаж) |
| 4 | 105-120 | 3.5-4s | Замын-Үүд-д тогтоод эргэнэ (scaleX: 1→-1) |
| 5 | 120-195 | 4-6.5s | Машин Замын-Үүд → УБ буцаж явна |
| 6 | 195-210 | 6.5-7s | УБ дээр эргэнэ (scaleX: -1→1) |
| 7 | 210-240 | 7-8s | Богино зогсолт, дараа нь 3-р үе рүү loop үсэрнэ |

### Нэмэлт detail-ууд

- **Машины дугуй эргэлдэх** — хөдөлж байхад rotation анимэйшн
- **Маркерын pulse** — scale 1→1.2→1, давтагдсан (секунд бүр)
- **Замын "flow" эффект** — dashoffset анимэйшн

### Easing

- Машины хөдөлгөөн (3, 5-р үе): `easeInOutQuad`
- Эргэх (4, 6-р үе): `easeOutCubic`
- Fade-in (1-р үе): `easeOutQuad`

## Accessibility

- `prefers-reduced-motion: reduce` system setting-тэй хэрэглэгчдэд анимэйшныг **зогсоох**.
- `MapAnimation` component нь `matchMedia('(prefers-reduced-motion: reduce)')`-ийг шалгаад `autoplay={false}` болгож, эхний frame-ийг static харуулна.

## Туршилт

### Build & type check

- `npm run build` амжилттай болох ёстой.
- `lottie-react` + React 19-ийн нийцтэй байдлыг баталгаажуулна. Үл нийцэх тохиолдолд `@lottiefiles/react-lottie-player`-руу шилжих боломжтой.

### Dev server (port 2500)

Шалгах жагсаалт:
- [ ] Анимэйшн 0.5s дотор харагдаж эхэлж байна
- [ ] Машин УБ-аас Замын-Үүд рүү жигд явж байна
- [ ] Машин эргэж буцаж ирж байна (scaleX flip зөв)
- [ ] Анимэйшн тасралтгүй давтагдаж байна
- [ ] Мобайл дэлгэц (320-768px) дээр aspect ratio хэвээр, агуулга таслагдахгүй

### Performance

- Chrome DevTools Performance tab дээр CPU ашиглалт <10% байх.
- JSON файл <50KB байх (gzipped <15KB).

### Accessibility

- OS-дээ "Reduce Motion"-ийг идэвхжүүлээд анимэйшн зогсох эсэхийг шалгана.

