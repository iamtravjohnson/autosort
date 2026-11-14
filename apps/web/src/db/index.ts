import 'server-only';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export type Db = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { __autosortDb?: Db };

/** The database, from DATABASE_URL (Vercel's Neon integration sets it during deploy). */
export function db(): Db {
  if (globalForDb.__autosortDb) return globalForDb.__autosortDb;
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  const client = postgres(url, { max: 5, prepare: false, idle_timeout: 20 });
  globalForDb.__autosortDb = drizzle(client, { schema });
  return globalForDb.__autosortDb;
}

export function hasDatabaseUrl(): boolean {
  return Boolean(process.env.DATABASE_URL ?? process.env.POSTGRES_URL);
}

export { schema };
