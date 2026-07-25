# Мэдээ мэдээлэл (блог) — front талд холбох заавар

**Хэнд:** tjcar-front-v2 дээр ажиллах front хөгжүүлэгч
**Юуг:** нүүр хуудсанд сүүлийн 4 мэдээ, `/posts` жагсаалт (pagination), `/posts/[slug]` дэлгэрэнгүй хуудас
**Огноо:** 2026-07-25

---

## 1. Юу аль хэдийн бэлэн болсон

Admin панель (`manager.tjcar.mn`) дээр мэдээ бүртгэх хэсэг **бүрэн ажиллагаатай** болсон:

- Гурван хэлээр (mn / en / ru) гарчиг, slug, товч тойм, тайлбар, агуулга бичнэ. **Монгол хэл заавал**, en/ru сонголтоор.
- Агуулга нь Tiptap редактороор бичигдэж **HTML** хэлбэрээр хадгалагдана (markdown биш).
- Онцлох зураг болон агуулга дотор орсон зурагнууд AWS S3-д хуулагдаж `https://cdn.tjcar.mn/public/posts/<uuid>.jpg` хэлбэрээр ирнэ.
- Категори (`news` / `tutorial`), төлөв (`draft` / `published`), онцлох тэмдэглэгээ, хэвлэгдэх огноо.

Front талд **зөвхөн харуулах** ажил үлдсэн. API бэлэн, өгөгдөл бэлэн.

### Одоо front дээр байгаа зүйл

`src/components/home/BlogSection.tsx` нь дизайны хувьд бэлэн (4 карт, "Бүх нийтлэл", "Цааш унших"), гэхдээ өгөгдөл нь **hardcoded `POSTS` массив** + Unsplash зурагнууд. i18n текстүүд `homeBlog` namespace-д байна. Үүнийг API-руу залгах нь Task 1.

`/posts` жагсаалт болон дэлгэрэнгүй хуудас **байхгүй** — шинээр үүсгэнэ (Task 2, 3).

---

## 2. API contract

### Base URL

| Хаанаас | Юу хэрэглэх | Base |
|---|---|---|
| Server component | `ServerApi` (`src/services/ServerApi.ts`) | `NEXT_PUBLIC_API_URL` (`.../api`) |
| Client component | `Api` (`src/services/Api.ts`) | `/api/v1` proxy → мөн адил backend |

Блогийн бүх хуудсыг **server component**-оор бичихийг зөвлөж байна (SEO + hydration хэрэггүй). Тиймээс `ServerApi` хэрэглэнэ.

### Endpoint-ууд

```
GET /posts?page=1&per_page=12&category=news&is_featured=1
GET /posts/{slug эсвэл id}
```

Аль ч endpoint **authentication шаардахгүй**.

### Хэл (locale) — тусад нь юу ч дамжуулах шаардлагагүй

`ServerApi` болон `/api/v1` proxy хоёулаа **`Accept-Language` header-ийг автоматаар** дамжуулдаг (`getLocale()`-с). Backend үүнийг уншиж тохирох хэлний орчуулгыг буцаана.

Хэл сонгох дараалал: `?locale=` query > `Accept-Language` header > `mn`.
Хүссэн хэлний орчуулга **байхгүй бол монгол хувилбар руу автоматаар унана** (хоосон карт гарахгүй). Ямар хэл буцсаныг `locale` талбараас харна.

> Тусад нь `?locale=` дамжуулах шаардлага **байхгүй**. Зөвхөн Accept-Language-ээс өөр хэл хүсэх онцгой тохиолдолд хэрэглэнэ.

### Жагсаалтын хариу — `GET /posts`

Laravel-ийн стандарт paginated envelope, `src/types/api.ts`-ийн `Paginated<T>`-тэй яг таарна:

```json
{
  "data": [
    {
      "id": 3,
      "category": "tutorial",
      "status": "published",
      "featured_image": "https://cdn.tjcar.mn/public/posts/7f3a....jpg",
      "is_featured": true,
      "locale": "mn",
      "title": "Toyota Prius 50 / 51 / 55 загваруудын ялгаа",
      "slug": "toyota-prius-50-51-55-zagvaruudyn-yalgaa",
      "description": null,
      "excerpt": "Гурван загварын хөдөлгүүр, тоноглол, үнийн ялгаа.",
      "body": "<p>Агуулга ...</p>",
      "published_at": "2026-07-25 14:02:11",
      "created_at": "2026-07-25 14:02:11"
    }
  ],
  "links": { "first": "...", "last": "...", "prev": null, "next": "..." },
  "meta": { "current_page": 1, "last_page": 4, "per_page": 12, "total": 41, "from": 1, "to": 12, "links": [...] }
}
```

`per_page` default = **12**, дээд хязгаар 100.

### Дэлгэрэнгүйн хариу — `GET /posts/{slug}`

Ижил объект, гэхдээ `{ "data": { ... } }` дотор (`ResourceObject<T>`).

`{slug}` нь **дурын хэлний slug** (`toyota-prius-...`, `toyota-prius-...-en`) эсвэл numeric id. Slug-ууд хэл тус бүрд unique.

### Юу харагдахгүй вэ (front тал шүүх шаардлагагүй)

Backend дараахыг **аль хэдийн шүүсэн** байна:

- `status = draft` постууд → жагсаалтад орохгүй, дэлгэрэнгүйд **404**
- Хэвлэгдэх огноо ирээдүйд тавигдсан (төлөвлөсөн хэвлэлт) → цаг болтол харагдахгүй
- Устгагдсан (soft deleted) постууд

Тиймээс front тал `status === "published"` гэж шүүх **шаардлагагүй** — шүүвэл pagination-ы тоолол зөрнө.

### Эрэмбэ

`published_at` буурахаар (огноо байхгүй бол `created_at`). Тэнцвэл `id` буурахаар. Front талд дахин sort хийх шаардлагагүй.

---

## 3. Task 0 — Type болон service нэмэх

### `src/types/post.ts` (шинэ)

```ts
// Backend: App\Http\Resources\Post\PublicPostResource (tjcar-api-v2)
export type PostCategory = "news" | "tutorial";

/** Нийтийн блогийн пост — нэг хэлээр тэгшилсэн (flat) хэлбэр. */
export type Post = {
  id: number;
  category: PostCategory;
  status: "published";
  featured_image: string | null;
  is_featured: boolean;
  /** Хариуд бодитоор буцсан хэл (хүссэн хэл байхгүй бол "mn" болно). */
  locale: string;
  title: string;
  slug: string;
  description: string | null;
  excerpt: string | null;
  /** Tiptap-аас гарсан HTML. Markdown БИШ. */
  body: string;
  published_at: string | null;
  created_at: string | null;
};
```

### `src/services/posts.ts` (шинэ)

`src/services/auctions.ts`-ийн хэв маягийг яг дагасан:

```ts
import "server-only";
import { cache } from "react";
import ServerApi, { ServerApiError } from "@/services/ServerApi";
import type { Paginated, ResourceObject } from "@/types/api";
import type { Post } from "@/types/post";
import type { QueryParams } from "@/utils/buildQuery";

/** Мэдээний хуудсанд нэг удаад харуулах тоо. */
export const POSTS_PER_PAGE = 12;

/** Нүүр хуудасны блог хэсэгт харуулах тоо. */
export const HOME_POSTS_COUNT = 4;

/**
 * GET /posts — хэвлэгдсэн мэдээ, хуудаслалттай. Хэлийг Accept-Language-ээр
 * ServerApi өөрөө дамжуулна. React `cache`-д хийсэн тул нэг request дотор
 * дахин уншихад API нэг л удаа дуудагдана.
 */
export const getPosts = cache(
  (params: QueryParams = {}): Promise<Paginated<Post>> =>
    ServerApi.get<Paginated<Post>>("/posts", params, { cache: "no-store" }),
);

/**
 * Нүүр хуудсанд харуулах сүүлийн N мэдээ. Алдаа гарвал хоосон массив буцаана —
 * блог хэсэг нүүр хуудсыг унагаах ёсгүй.
 */
export const getLatestPosts = cache(
  async (limit: number = HOME_POSTS_COUNT): Promise<Post[]> => {
    try {
      const { data } = await getPosts({ per_page: limit, page: 1 });
      return data;
    } catch {
      return [];
    }
  },
);

/**
 * GET /posts/{slug} — нэг мэдээ. Олдоогүй / хэвлэгдээгүй бол `null`
 * (дуудсан тал `notFound()` дуудна). Бусад алдаа (network, 5xx) шидэгдэнэ.
 */
export const getPost = cache(async (slug: string): Promise<Post | null> => {
  try {
    const { data } = await ServerApi.get<ResourceObject<Post>>(
      `/posts/${encodeURIComponent(slug)}`,
      {},
      { cache: "no-store" },
    );
    return data;
  } catch (err) {
    if (err instanceof ServerApiError && err.status === 404) return null;
    throw err;
  }
});
```

### Зургийн helper — `src/utils/postImage.ts` (шинэ)

S3-д зураг бүр **3 хувилбараар** хадгалагддаг: эх зураг, `_w320.jpg` (320px өргөн), `_h50.jpg` (50px өндөр). Картанд `_w320` хэрэглэвэл хамаагүй хөнгөн.

```ts
/**
 * Постын зургийн хувилбар. Auction CDN-ээс ялгаатай: query param биш,
 * файлын нэрний суффикс (`<uuid>_w320.jpg`).
 */
export type PostImageSize = "original" | "card" | "thumb";

const SUFFIX: Record<Exclude<PostImageSize, "original">, string> = {
  card: "_w320.jpg",
  thumb: "_h50.jpg",
};

export function postImage(
  url: string | null,
  size: PostImageSize = "original",
): string | null {
  if (!url) return null;
  if (size === "original") return url;
  return url.replace(/\.[^./]+$/, SUFFIX[size]);
}
```

> `featured_image` нь `null` байж болно (зураггүй мэдээ). Placeholder / gradient fallback заавал бэлдэнэ.

### `next/image` — заавал `unoptimized`

`next.config.ts`-ийн `images.remotePatterns` дээр `images.unsplash.com` л зөвшөөрөгдсөн, **`cdn.tjcar.mn` байхгүй**. Хоёр сонголт:

1. **Зөвлөж байна:** `unoptimized` prop хэрэглэх — `CarCard.tsx` (мөр 283-295) яг ингэж хийсэн. remotePatterns шалгагдахгүй, тохиргоо хөндөхгүй.
2. Эсвэл `next.config.ts`-д нэмэх:
   ```ts
   remotePatterns: [
     { protocol: "https", hostname: "images.unsplash.com" },
     { protocol: "https", hostname: "cdn.tjcar.mn" },
   ],
   ```

Аль нэгийг сонгоно — `unoptimized`-гүйгээр, remotePatterns-д нэмэлгүй бол зураг **runtime дээр алдаа** гаргана.

---

## 4. Task 1 — Нүүр хуудас: сүүлийн 4 мэдээ

**Файл:** `src/components/home/BlogSection.tsx`

Дизайн, layout, i18n текстийг **хөндөхгүй**. Зөвхөн өгөгдлийн эх сурвалжийг сольно:

**Хасах:**
- `POSTS` hardcoded массив болон `PostKey` type
- `t("posts.<key>.title")` / `t("posts.<key>.excerpt")` дуудалтууд
- Unsplash зургууд

**Нэмэх:**

```tsx
import { getLatestPosts } from "@/services/posts";
import { postImage } from "@/utils/postImage";

export default async function BlogSection() {
  const t = await getTranslations("homeBlog");
  const posts = await getLatestPosts(); // 4

  // Мэдээ байхгүй бол блог хэсгийг бүхэлд нь харуулахгүй
  if (posts.length === 0) return null;

  return (
    <section ...>
      {/* ... eyebrow / heading / subheading тэр чигээрээ ... */}

      {/* "Бүх нийтлэл" товч: href="#" → /posts */}
      <Link href="/posts">{t("viewAll")} <ArrowIcon ... /></Link>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {posts.map((post) => (
          <Link key={post.id} href={`/posts/${post.slug}`} className="group ...">
            <div className="relative aspect-[16/10] ...">
              {post.featured_image ? (
                <Image
                  src={postImage(post.featured_image, "card")!}
                  alt={post.title}
                  fill
                  sizes="(min-width: 1024px) 23vw, (min-width: 640px) 48vw, 100vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                  unoptimized
                />
              ) : null /* gradient fallback аль хэдийн div-д байгаа */}
            </div>
            <div className="flex flex-1 flex-col gap-2 p-4 md:p-5">
              <h3 className="line-clamp-2 ...">{post.title}</h3>
              <p className="line-clamp-2 ...">{post.excerpt}</p>
              <span className="mt-auto ...">{t("readMore")} <ArrowIcon ... /></span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
```

`Link` нь `@/i18n/navigation`-с ирдэг тул `/posts/<slug>` гэж бичихэд locale prefix (`/mn/posts/...`) автоматаар нэмэгдэнэ.

**Тэмдэглэл:** `excerpt` нь `null` байж болно — `{post.excerpt}` хоосон гарна. Хүсвэл `post.excerpt ?? ""` эсвэл `body`-с текст авах логик нэмж болно (доорх *Edge cases*).

**i18n:** `messages/{mn,en,ru}.json`-ы `homeBlog.posts.*` тодорхойлолтууд ашиглагдахаа болино — цэвэрлэж болно. `eyebrow`, `heading`, `subheading`, `viewAll`, `readMore`, `latest` нь хэрэгтэй хэвээр.

---

## 5. Task 2 — `/posts` жагсаалт (pagination)

**Файл:** `src/app/[locale]/posts/page.tsx` (шинэ)

`src/app/[locale]/japan/page.tsx`-ийн хэв маягийг дагана (`params`/`searchParams` нь Promise, `setRequestLocale`).

```tsx
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPosts, POSTS_PER_PAGE } from "@/services/posts";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "posts.metadata" });
  return { title: t("title"), description: t("description") };
}

export default async function PostsPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const category = typeof sp.category === "string" ? sp.category : undefined;

  const result = await getPosts({ page, per_page: POSTS_PER_PAGE, category })
    .catch(() => null);

  // ... header + PostCard grid + Pagination
}
```

**Шаардлага:**

- Хуудас `?page=N` query-гээр дамжина (server-side, SEO-д индекслэгдэнэ). Client-side infinite scroll хэрэггүй.
- `meta.current_page`, `meta.last_page`, `meta.total` дээр тулгуурлан pagination зурна. `meta.links` массивт Laravel-ийн дугаарласан товчнууд бэлэн байна (`{url, label, page, active}`) — хүсвэл шууд хэрэглэж болно.
- **`links.next` / `links.prev` дэх URL-ыг шууд `href` болгож болохгүй** — тэр нь backend-ийн хаяг (`api.tjcar.mn/api/posts?page=2`). Зөвхөн `null` эсэхийг шалгаж, өөрсдийн `/posts?page=N` линкийг үүсгэнэ.
- `page` нь `last_page`-с их байвал API хоосон `data` буцаана → "мэдээ олдсонгүй" төлөв харуулна (404 биш).
- Картны компонентыг Task 1-тэй хуваалцвал сайн: `src/components/posts/PostCard.tsx` гаргаж, BlogSection ч түүнийг хэрэглэнэ.
- Категорийн шүүлтүүр (`news` / `tutorial`) сонголтоор — `?category=` дамжуулна.

**Одоо байгаа pagination:** `src/components/cards/AuctionBrowser.tsx` болон `views/CarTableView.tsx` дотор pagination логик бий — тэднээс санаа авч болно (гэхдээ тэд client-side state дээр ажилладаг тул шууд хуулж болохгүй).

---

## 6. Task 3 — `/posts/[slug]` дэлгэрэнгүй

**Файл:** `src/app/[locale]/posts/[slug]/page.tsx` (шинэ)

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getPost } from "@/services/posts";
import { postImage } from "@/utils/postImage";

type PageProps = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.excerpt ?? post.description ?? undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      images: post.featured_image ? [post.featured_image] : undefined,
      type: "article",
      publishedTime: post.published_at ?? undefined,
    },
  };
}

export default async function PostPage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-10 lg:px-6">
      <h1 className="text-2xl font-semibold md:text-3xl">{post.title}</h1>
      <time dateTime={post.published_at ?? undefined} className="...">
        {/* published_at нь "YYYY-MM-DD HH:mm:ss" — доорх огнооны тэмдэглэлийг уншина */}
      </time>

      {post.featured_image && (
        <Image src={post.featured_image} alt={post.title} width={1200} height={675} unoptimized className="..." />
      )}

      <div
        className="post-body mt-6"
        dangerouslySetInnerHTML={{ __html: post.body }}
      />
    </article>
  );
}
```

`getPost` нь `cache`-д хийгдсэн тул `generateMetadata` болон `page` хоёр дуудахад API **нэг л удаа** дуудагдана.

### Агуулгыг render хийх — 3 чухал зүйл

1. **`body` нь HTML, markdown биш.** Репод `react-markdown` байгаа ч энд **хэрэглэхгүй** — Tiptap-аас `<p>`, `<h2>`, `<ul>`, `<blockquote>`, `<a>`, `<img>`, `<pre>` зэрэг тэг ирнэ. `dangerouslySetInnerHTML` хэрэглэнэ.

2. **Стиль.** Tailwind-ийн typography plugin (`prose`) **суулгаагүй**. Тиймээс `globals.css`-д `.post-body` класс дор тэг тус бүрийн стиль бичих (эсвэл `@tailwindcss/typography` суулгаж `prose prose-neutral dark:prose-invert` хэрэглэх). Заавал хийх: `.post-body img { max-width: 100%; height: auto; border-radius: .5rem }`, `h2/h3`, `ul/ol` list-style, `a` өнгө + underline, `blockquote` зүүн зураас, `pre` overflow-x.

3. **Sanitization.** Агуулгыг зөвхөн admin (super admin) бичдэг тул XSS-ийн шууд эрсдэл бага. Гэхдээ хамгаалалт хүсвэл `isomorphic-dompurify` суулгаж server дээр цэвэрлэнэ:
   ```ts
   import DOMPurify from "isomorphic-dompurify";
   const clean = DOMPurify.sanitize(post.body);
   ```
   Шийдвэрийг тимлидтэй тохирно.

### Огноо

`published_at` / `created_at` нь **`"YYYY-MM-DD HH:mm:ss"` (UTC биш, серверийн local)** формат — ISO-8601 биш. `new Date("2026-07-25 14:02:11")` нь Safari-д `Invalid Date` буцаана. Тиймээс:

```ts
const iso = post.published_at?.replace(" ", "T");
const d = iso ? new Date(iso) : null;
```

Дараа нь `Intl.DateTimeFormat(locale, {...})`-аар харуулна. `src/utils/`-д огнооны helper байвал түүнийг хэрэглэнэ.

---

## 7. i18n нэмэх түлхүүрүүд

`messages/mn.json`, `en.json`, `ru.json` гурвуулд:

```json
"posts": {
  "metadata": { "title": "Мэдээ мэдээлэл", "description": "Япон, Солонгосын зах зээл, машин сонгох зөвлөгөө." },
  "heading": "Мэдээ мэдээлэл",
  "empty": "Одоогоор мэдээ байхгүй байна.",
  "readMore": "Цааш унших",
  "backToList": "Бүх нийтлэл",
  "category": { "news": "Мэдээ", "tutorial": "Заавар" },
  "pagination": { "prev": "Өмнөх", "next": "Дараах", "page": "Хуудас" }
}
```

Категорийн нэрийг backend ч буцаадаг (admin API-д `category_label`), гэхдээ **нийтийн endpoint нь `category` кодыг л буцаана** — нэрийг front талын i18n-ээс авна (ингэснээр en/ru-д зөв гарна).

---

## 8. Edge cases (тестлэхэд заавал)

| Тохиолдол | Хүлээгдэх зан үйл |
|---|---|
| Мэдээ байхгүй | Нүүрний блог хэсэг харагдахгүй (`return null`); `/posts` дээр `posts.empty` мессеж |
| `featured_image` = `null` | Placeholder / gradient. `next/image`-д `null` src дамжуулж болохгүй |
| `excerpt` = `null` | Хоосон орхих эсвэл `body`-с текст (`body.replace(/<[^>]+>/g, "").slice(0, 140)`) |
| en/ru орчуулга байхгүй | Backend mn руу унана — карт хоосон гарахгүй. `post.locale !== хүссэн хэл` бол хүсвэл "Монголоор" тэмдэглэгээ харуулж болно |
| `/posts/baihgui-slug` | API 404 → `getPost` `null` → `notFound()` |
| `?page=999` | Хоосон `data`, `meta.total` бодит тоо → "мэдээ олдсонгүй", 404 биш |
| API унасан (5xx) | `getLatestPosts` хоосон буцаана (нүүр унахгүй). `/posts` дээр try/catch + error төлөв |
| Хэл солих | `Accept-Language` автоматаар өөрчлөгдөнө. **Slug нь хэл тус бүрд өөр** — хэл солиход дэлгэрэнгүй хуудасны slug таарахгүй байж магадгүй. Одоогийн API дурын хэлний slug-аар хайдаг тул 404 болохгүй, гэхдээ хаяг нь өмнөх хэлний slug хэвээр үлдэнэ. Хүсвэл дараа нь `alternates.languages` (hreflang) нэмэх — тэгэхийн тулд API-с бүх хэлний slug авах шаардлагатай (одоогоор нийтийн endpoint нэг хэлийг л буцаана; хэрэгтэй бол backend талд хүсэлт тавь) |

---

## 9. Хийх дарааллын checklist

- [ ] `src/types/post.ts` — `Post` type
- [ ] `src/services/posts.ts` — `getPosts` / `getLatestPosts` / `getPost` + `POSTS_PER_PAGE`
- [ ] `src/utils/postImage.ts` — `_w320` / `_h50` хувилбарын helper
- [ ] Зургийн тохиргоо: `unoptimized` prop **эсвэл** `next.config.ts`-д `cdn.tjcar.mn`
- [ ] `src/components/posts/PostCard.tsx` — хуваалцсан карт
- [ ] `BlogSection.tsx` — hardcoded `POSTS` хасаж `getLatestPosts()`, "Бүх нийтлэл" → `/posts`
- [ ] `src/app/[locale]/posts/page.tsx` — жагсаалт + `?page=` pagination + `generateMetadata`
- [ ] `src/app/[locale]/posts/[slug]/page.tsx` — дэлгэрэнгүй + `notFound()` + OG metadata
- [ ] `.post-body` стиль (`globals.css`) эсвэл `@tailwindcss/typography`
- [ ] `messages/{mn,en,ru}.json` — `posts.*` түлхүүрүүд; `homeBlog.posts.*` цэвэрлэх
- [ ] Header/footer-ийн navigation-д `/posts` линк нэмэх
- [ ] Edge case-ууд шалгах (дээрх хүснэгт)

---

## 10. Локал дээр туршихад

Backend локал: `http://tjcar-api-v2.test/api` (`.env.local`-д аль хэдийн тохируулагдсан).

```bash
# Жагсаалт
curl -s "http://tjcar-api-v2.test/api/posts?per_page=4" | python3 -m json.tool

# Дэлгэрэнгүй (slug-аар)
curl -s "http://tjcar-api-v2.test/api/posts/toyota-prius-50-51-55-zagvaruudyn-yalgaa" | python3 -m json.tool

# Англи хэлээр (front-той ижилээр header-ээр)
curl -s -H "Accept-Language: en" "http://tjcar-api-v2.test/api/posts" | python3 -m json.tool
```

**Туршилтын өгөгдөл:** локал v2 DB (`tjcar-v2`) дээр аль хэдийн **6 хэвлэгдсэн + 1 draft** пост үүсгэсэн байгаа (draft нь нийтийн API-д харагдахгүйг шалгахад хэрэгтэй). Нэмж хүсвэл `php artisan tinker` дотор:

```php
App\Models\Post::factory()->count(6)->published()->create();          // mn орчуулга автоматаар
App\Models\Post::factory()->published()->withTranslations(
    App\Enums\PostLocale::En, App\Enums\PostLocale::Ru
)->create();                                                          // гурван хэлтэй
```

Factory-ийн постуудад `featured_image` нь `null` — зурагтай хувилбарыг шалгах бол admin панелиэр (`localhost:2100/posts/create`) нэг мэдээ оруулж, эсвэл `featured_image`-д `https://cdn.tjcar.mn/public/posts/...` линк гараар онооно.

Production өгөгдлийг харах бол `NEXT_PUBLIC_API_URL=https://api.tjcar.mn/api` болгож турш.

---

## 11. Cutover тэмдэглэл (backend хөгжүүлэгчид)

Одоо `api.tjcar.mn` нь v1 (`tjcar-api`) api-г заадаг. Блогийн нийтийн endpoint нь **v1 болон v2 хоёуланд ижил хэлбэрээр** бүртгэгдсэн (`GET /api/posts`, `GET /api/posts/{slugOrId}`), хариу нь байт тэнцүү. Тиймээс v1 → v2 cutover-ийн үед front талд **ямар ч засвар шаардахгүй**.

Backend файлууд:

| | v1 (`Projects/Sites/tjcar-api`) | v2 (`Herd/tjcar-api-v2`) |
|---|---|---|
| Route | `routes/api.php` → `posts` group | `routes/api.php` → `posts` group |
| Controller | `app/Http/Controllers/PostController.php` | `app/Http/Controllers/Public/PostController.php` |
| Resource | `app/Http/Resources/PublicPostResource.php` | `app/Http/Resources/Post/PublicPostResource.php` |
