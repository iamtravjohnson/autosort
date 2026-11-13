/**
 * Storage-agnostic cache for looked-up data (artist genres, audio features, years, tags).
 * Apps back this with their own database. A stored `null` means "looked up, nothing found".
 *
 * Spotify's terms don't allow storing Spotify content indefinitely, so every entry has a TTL.
 */
export interface Cache {
  /** Return entries that exist and haven't expired. Missing keys are simply absent from the map. */
  getMany<T>(namespace: string, keys: readonly string[]): Promise<Map<string, T | null>>;
  setMany<T>(namespace: string, entries: ReadonlyArray<readonly [string, T | null]>, ttlSeconds: number): Promise<void>;
}

/** In-memory cache, handy for tests, scripts and single runs. */
export function memoryCache(now: () => number = Date.now): Cache {
  const store = new Map<string, { value: unknown; expires: number }>();
  return {
    async getMany<T>(namespace: string, keys: readonly string[]) {
      const out = new Map<string, T | null>();
      for (const key of keys) {
        const hit = store.get(`${namespace}\u0000${key}`);
        if (hit && hit.expires > now()) out.set(key, hit.value as T | null);
      }
      return out;
    },
    async setMany<T>(namespace: string, entries: ReadonlyArray<readonly [string, T | null]>, ttlSeconds: number) {
      for (const [key, value] of entries) store.set(`${namespace}\u0000${key}`, { value, expires: now() + ttlSeconds * 1000 });
    },
  };
}

export const DAY = 24 * 60 * 60;
