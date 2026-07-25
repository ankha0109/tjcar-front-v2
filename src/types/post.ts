// Backend: App\Http\Resources\Post\PublicPostResource (tjcar-api-v2)

export type PostCategory = "news" | "tutorial";

/** Public blog post — already flattened to a single language by the backend. */
export type Post = {
  id: number;
  category: PostCategory;
  status: "published";
  featured_image: string | null;
  is_featured: boolean;
  /** Language actually returned — falls back to "mn" when the ask is missing. */
  locale: string;
  title: string;
  slug: string;
  description: string | null;
  excerpt: string | null;
  /** HTML straight out of Tiptap. NOT markdown. */
  body: string;
  /** "YYYY-MM-DD HH:mm:ss" (server local) — not ISO-8601, see `parsePostDate`. */
  published_at: string | null;
  created_at: string | null;
};
