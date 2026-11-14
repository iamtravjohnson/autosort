import 'server-only';
import type { Cache } from '@autosort/core';
import { and, eq, gt, inArray, lt, sql } from 'drizzle-orm';
import { db, schema } from '@/db';

/**
 * Postgres text can't hold NUL characters, and some engine cache keys use one as a separator
 * ("artist\u0000title"). Store them with a visible separator instead.
 */
const toDbKey = (key: string) => key.replace(/\u0000/g, '\u241f');

/** The engine's lookup cache, stored in Postgres with expiry. */
export const dbCache: Cache = {
  async getMany<T>(namespace: string, keys: readonly string[]) {
    const out = new Map<string, T | null>();
    if (keys.length === 0) return out;
    const original = new Map(keys.map((k) => [toDbKey(k), k]));
    const dbKeys = [...original.keys()];
    for (let i = 0; i < dbKeys.length; i += 500) {
      const slice = dbKeys.slice(i, i + 500);
      const rows = await db()
        .select({ key: schema.cacheEntries.key, value: schema.cacheEntries.value })
        .from(schema.cacheEntries)
        .where(and(eq(schema.cacheEntries.namespace, namespace), inArray(schema.cacheEntries.key, slice), gt(schema.cacheEntries.expiresAt, new Date())));
      for (const r of rows) out.set(original.get(r.key) ?? r.key, (r.value ?? null) as T | null);
    }
    return out;
  },
  async setMany<T>(namespace: string, entries: ReadonlyArray<readonly [string, T | null]>, ttlSeconds: number) {
    if (entries.length === 0) return;
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    for (let i = 0; i < entries.length; i += 500) {
      const values = entries.slice(i, i + 500).map(([key, value]) => ({ namespace, key: toDbKey(key), value: value as unknown, expiresAt }));
      await db()
        .insert(schema.cacheEntries)
        .values(values)
        .onConflictDoUpdate({
          target: [schema.cacheEntries.namespace, schema.cacheEntries.key],
          set: { value: sql`excluded.value`, expiresAt: sql`excluded.expires_at` },
        });
    }
  },
};

/** Drop expired cache rows (run from the daily job). */
export async function pruneCache() {
  await db().delete(schema.cacheEntries).where(lt(schema.cacheEntries.expiresAt, new Date()));
}
