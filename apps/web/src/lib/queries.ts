import 'server-only';
import { and, desc, eq } from 'drizzle-orm';
import { db, schema } from '@/db';

export async function userSources(userId: string) {
  return db().select().from(schema.sources).where(eq(schema.sources.userId, userId)).orderBy(schema.sources.createdAt);
}

export async function userSmartPlaylists(userId: string) {
  return db().select().from(schema.smartPlaylists).where(eq(schema.smartPlaylists.userId, userId)).orderBy(schema.smartPlaylists.createdAt);
}

export async function getSource(userId: string, id: string) {
  const [s] = await db()
    .select()
    .from(schema.sources)
    .where(and(eq(schema.sources.id, id), eq(schema.sources.userId, userId)));
  return s ?? null;
}

export async function getSmartPlaylist(userId: string, id: string) {
  const [p] = await db()
    .select()
    .from(schema.smartPlaylists)
    .where(and(eq(schema.smartPlaylists.id, id), eq(schema.smartPlaylists.userId, userId)));
  return p ?? null;
}

export async function recentRuns(userId: string, limit = 30) {
  return db().select().from(schema.syncRuns).where(eq(schema.syncRuns.userId, userId)).orderBy(desc(schema.syncRuns.startedAt)).limit(limit);
}

export async function lastRun(userId: string) {
  const [r] = await recentRuns(userId, 1);
  return r ?? null;
}

export async function spotifyStatus(userId: string) {
  const [a] = await db().select({ status: schema.spotifyAccounts.status, scope: schema.spotifyAccounts.scope }).from(schema.spotifyAccounts).where(eq(schema.spotifyAccounts.userId, userId));
  return a ?? null;
}
