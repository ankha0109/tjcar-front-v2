import type { CarSource } from "@/types/car";
import type { WishlistItem } from "@/types/wishlist";

/**
 * Guest wishlist persisted in localStorage. Exposes a `useSyncExternalStore`
 * contract (`subscribe` + `getSnapshot`) so every heart on the page reacts to a
 * change, plus small mutators. The in-memory `cache` is only replaced on
 * mutation / storage events, keeping `getSnapshot` referentially stable (a
 * requirement of `useSyncExternalStore`). Follows the app's storage convention
 * (`tjcar:{feature}:v{n}`, SSR-guarded, try/catch-wrapped).
 */
const STORAGE_KEY = "tjcar:wishlist:v1";
const CHANGE_EVENT = "tjcar:wishlist:change";
const EMPTY: WishlistItem[] = [];

let cache: WishlistItem[] = EMPTY;
let hydrated = false;

function isItem(value: unknown): value is WishlistItem {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as { id?: unknown }).id === "string" &&
    typeof (value as { source?: unknown }).source === "string"
  );
}

function read(): WishlistItem[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isItem) : EMPTY;
  } catch {
    return EMPTY;
  }
}

function ensureHydrated(): void {
  if (hydrated || typeof window === "undefined") return;
  cache = read();
  hydrated = true;
}

function write(items: WishlistItem[]): void {
  cache = items;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Quota / disabled storage is non-fatal — the in-memory cache still works.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function matches(item: WishlistItem, source: CarSource, id: string): boolean {
  return item.source === source && item.id === id;
}

export const wishlistStore = {
  getSnapshot(): WishlistItem[] {
    ensureHydrated();
    return cache;
  },

  getServerSnapshot(): WishlistItem[] {
    return EMPTY;
  },

  subscribe(onStoreChange: () => void): () => void {
    if (typeof window === "undefined") return () => {};
    // Cross-tab writes: re-read before notifying so this tab's cache catches up.
    const onStorage = () => {
      cache = read();
      onStoreChange();
    };
    window.addEventListener(CHANGE_EVENT, onStoreChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(CHANGE_EVENT, onStoreChange);
      window.removeEventListener("storage", onStorage);
    };
  },

  has(source: CarSource, id: string): boolean {
    ensureHydrated();
    return cache.some((item) => matches(item, source, id));
  },

  add(item: WishlistItem): void {
    ensureHydrated();
    if (cache.some((existing) => matches(existing, item.source, item.id))) return;
    // Stamp at save-time so newest-first ordering is accurate regardless of when
    // the snapshot object was built.
    write([{ ...item, savedAt: new Date().toISOString() }, ...cache]);
  },

  remove(source: CarSource, id: string): void {
    ensureHydrated();
    write(cache.filter((item) => !matches(item, source, id)));
  },

  toggle(item: WishlistItem): void {
    if (this.has(item.source, item.id)) this.remove(item.source, item.id);
    else this.add(item);
  },

  clear(): void {
    write(EMPTY);
  },

  getAll(): WishlistItem[] {
    ensureHydrated();
    return cache;
  },
};
