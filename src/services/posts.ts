import "server-only";
import { cache } from "react";
import ServerApi, { ServerApiError } from "@/services/ServerApi";
import type { Paginated, ResourceObject } from "@/types/api";
import type { Post } from "@/types/post";
import type { QueryParams } from "@/utils/buildQuery";

/** How many posts one page of /posts shows. Backend default, max 100. */
export const POSTS_PER_PAGE = 12;

/** How many posts the home page blog strip shows. */
export const HOME_POSTS_COUNT = 4;

/**
 * GET /posts — published posts, paginated and already sorted newest-first by
 * the backend. Language rides along on `Accept-Language`, which `ServerApi`
 * sets from the request locale. Drafts, scheduled and deleted posts are
 * filtered server-side, so never re-filter here — it would skew the counts.
 */
export const getPosts = cache(
  (params: QueryParams = {}): Promise<Paginated<Post>> =>
    ServerApi.get<Paginated<Post>>("/posts", params, { cache: "no-store" }),
);

/**
 * The latest N posts for the home page. Returns `[]` on any failure — a blog
 * strip must never take the home page down with it.
 */
export const getLatestPosts = cache(
  async (limit: number = HOME_POSTS_COUNT): Promise<Post[]> => {
    try {
      const { data } = await getPosts({ per_page: limit, page: 1 });
      return data;
    } catch (err) {
      console.error("[posts] /posts fetch failed:", err);
      return [];
    }
  },
);

/**
 * GET /posts/{slug} — a single post, or `null` when it is unknown, unpublished
 * or scheduled (404), which the caller turns into `notFound()`. Network and 5xx
 * failures still throw. `{slug}` may be any language's slug, or a numeric id.
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
