import 'server-only';
import { eq, sql } from 'drizzle-orm';
import { connection } from 'next/server';
import { db, hasDatabaseUrl, schema } from '@/db';
import { dailySchedule } from './access';
import { spotifyCredentials } from './config';

export type CheckState = 'done' | 'missing' | 'optional';

export interface SetupStatus {
  /** True once the app can sign people in (keys + database). */
  ready: boolean;
  hasOwner: boolean;
  checks: Array<{ key: 'clientId' | 'clientSecret' | 'database' | 'cron' | 'lastfm' | 'covers'; label: string; state: CheckState; detail: string }>;
}

/** What's configured on this instance, for the first-run checklist. */
export async function setupStatus(): Promise<SetupStatus> {
  // Always check at request time. Otherwise Next can prerender a page that calls this during the
  // build and bake in a redirect to /setup.
  await connection();
  const creds = spotifyCredentials();
  let dbOk = false;
  let migrated = false;
  let hasOwner = false;
  let lastCron: string | null = null;
  if (hasDatabaseUrl()) {
    try {
      const d = db();
      await d.execute(sql`select 1`);
      dbOk = true;
      const [{ owners }] = await d.select({ owners: sql<number>`count(*)::int` }).from(schema.users).where(eq(schema.users.role, 'owner'));
      migrated = true;
      hasOwner = owners > 0;
      const [cron] = await d.select().from(schema.appSettings).where(eq(schema.appSettings.key, 'last_cron_at'));
      lastCron = cron ? String(cron.value) : null;
    } catch {
      // Connected but tables missing means migrations haven't run.
    }
  }
  const onVercel = Boolean(process.env.VERCEL);
  const checks: SetupStatus['checks'] = [
    {
      key: 'clientId',
      label: 'Spotify Client ID',
      state: process.env.SPOTIFY_CLIENT_ID ? 'done' : 'missing',
      detail: process.env.SPOTIFY_CLIENT_ID ? 'Found SPOTIFY_CLIENT_ID' : 'Add SPOTIFY_CLIENT_ID in your Vercel project’s Environment Variables',
    },
    {
      key: 'clientSecret',
      label: 'Spotify Client Secret',
      state: process.env.SPOTIFY_CLIENT_SECRET ? 'done' : 'missing',
      detail: process.env.SPOTIFY_CLIENT_SECRET ? 'Found SPOTIFY_CLIENT_SECRET' : 'Add SPOTIFY_CLIENT_SECRET in your Vercel project’s Environment Variables',
    },
    {
      key: 'database',
      label: 'Database connected',
      state: dbOk && migrated ? 'done' : 'missing',
      detail: !hasDatabaseUrl()
        ? 'No DATABASE_URL: add the Neon integration in Vercel → Storage, then redeploy'
        : !dbOk
          ? 'DATABASE_URL is set but the database can’t be reached'
          : migrated
            ? 'Connected and up to date'
            : 'Connected, but the tables are missing: redeploy to run migrations',
    },
    {
      key: 'cron',
      label: 'Daily sync scheduled',
      state: lastCron || onVercel ? 'done' : 'optional',
      detail: lastCron
        ? `Last ran ${new Date(lastCron).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}`
        : onVercel
          ? `Scheduled by vercel.json: ${dailySchedule().label.toLowerCase()}`
          : 'Runs on Vercel only. Locally, use Sync now.',
    },
    {
      key: 'lastfm',
      label: 'Last.fm key (better moods and themes)',
      state: process.env.LASTFM_API_KEY ? 'done' : 'optional',
      detail: process.env.LASTFM_API_KEY ? 'Found LASTFM_API_KEY' : 'Optional: a free key from last.fm/api improves Love Songs, Worship and mood playlists',
    },
    {
      key: 'covers',
      label: 'AI playlist covers',
      state: process.env.OPENROUTER_API_KEY ? 'done' : 'optional',
      detail: process.env.OPENROUTER_API_KEY
        ? 'Found OPENROUTER_API_KEY: new smart playlists get a photo cover'
        : 'Optional: add OPENROUTER_API_KEY for photo covers. Without it, AutoSort uploads its own designed covers.',
    },
  ];
  return { ready: Boolean(creds) && dbOk && migrated, hasOwner, checks };
}
