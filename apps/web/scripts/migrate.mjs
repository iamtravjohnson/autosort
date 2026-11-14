// Applies database migrations before `next build` (and via `npm run db:migrate`).
// Skips quietly when no database is configured yet, so the first deploy still builds
// and the setup screen can explain what's missing.
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
if (!url) {
  console.log('[autosort] No DATABASE_URL yet: skipping migrations.');
  process.exit(0);
}

const client = postgres(url, { max: 1, prepare: false });
try {
  await migrate(drizzle(client), { migrationsFolder: new URL('../drizzle', import.meta.url).pathname });
  console.log('[autosort] Database is up to date.');
} catch (err) {
  console.error('[autosort] Migration failed:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  await client.end();
}
