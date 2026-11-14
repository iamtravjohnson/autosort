import 'server-only';
import {
  applyChange,
  enrichTracks,
  LastfmClient,
  matchesRule,
  planSmartPlaylist,
  restorePlaylist,
  ruleChips,
  type SmartPlaylistDefinition,
  type SpotifyClient,
  type TrackFacts,
  type TrackRef,
} from '@autosort/core';
import { and, eq, inArray, lt } from 'drizzle-orm';
import { db, schema } from '@/db';
import type { RunPlaylistResult, SmartPlaylist, Source, TrackSnapshot } from '@/db/schema';
import { dbCache, pruneCache } from './cache';
import { uploadCover } from './covers';
import { spotifyFor } from './spotify';

/** Suffix on playlists AutoSort creates in Spotify (the app shows the plain name). */
export const SPOTIFY_NAME_SUFFIX = ' (AutoSort)';
const RUN_RETENTION_DAYS = 30;

/** Per-run lookup budgets sized to finish inside a 300-second function. Big libraries fill in over a few runs. */
const BUDGET = { artists: 300, audio: 4000, years: 60, tags: 150 };

/* ---------- Snapshots: compact facts kept from the last analysis ---------- */

export function toSnapshot(f: TrackFacts): TrackSnapshot {
  return {
    id: f.id,
    uri: f.uri,
    name: f.name,
    artists: f.artists.map((a) => a.name),
    album: f.album.name,
    imageUrl: f.album.imageUrl,
    addedAt: f.addedAt,
    explicit: f.explicit,
    durationMs: f.durationMs,
    year: f.year,
    decade: f.decade,
    genres: f.genres,
    genreBuckets: f.genreBuckets,
    tags: f.tags,
    moods: f.moods,
    themes: f.themes,
    camelot: f.camelot,
    tempo: f.audio?.tempo ?? null,
    energy: f.audio?.energy ?? null,
    valence: f.audio?.valence ?? null,
    danceability: f.audio?.danceability ?? null,
  };
}

/** Rebuild engine facts from a snapshot (enough for rules and sorting). */
export function fromSnapshot(s: TrackSnapshot): TrackFacts {
  const hasAudio = s.tempo !== null;
  return {
    id: s.id,
    uri: s.uri,
    name: s.name,
    artists: s.artists.map((name) => ({ id: null, name })),
    album: { name: s.album, releaseDate: s.year ? String(s.year) : null, releaseDatePrecision: s.year ? 'year' : null, imageUrl: s.imageUrl },
    durationMs: s.durationMs,
    explicit: s.explicit,
    isrc: null,
    addedAt: s.addedAt,
    genres: s.genres,
    tags: s.tags,
    genreBuckets: s.genreBuckets as TrackFacts['genreBuckets'],
    year: s.year,
    yearSource: s.year ? 'album' : null,
    decade: s.decade,
    audio: hasAudio
      ? {
          tempo: s.tempo ?? 0,
          key: -1,
          mode: 1,
          energy: s.energy ?? 0,
          valence: s.valence ?? 0,
          danceability: s.danceability ?? 0,
          acousticness: 0,
          instrumentalness: 0,
          speechiness: 0,
          liveness: 0,
          loudness: 0,
        }
      : null,
    camelot: s.camelot,
    moods: s.moods as TrackFacts['moods'],
    themes: s.themes as TrackFacts['themes'],
  };
}

/* ---------- Reading and analyzing sources ---------- */

async function readSourceTracks(client: SpotifyClient, source: Source): Promise<TrackRef[]> {
  if (source.kind === 'liked') return client.savedTracks();
  if (!source.playlistId) return [];
  return client.playlistTracks(source.playlistId);
}

/** Read a source from Spotify, look up its data (within budget), and save the snapshot. */
export async function analyzeSource(client: SpotifyClient, source: Source): Promise<TrackFacts[]> {
  const refs = await readSourceTracks(client, source);
  const lastfm = process.env.LASTFM_API_KEY ? new LastfmClient({ apiKey: process.env.LASTFM_API_KEY }) : null;
  const result = await enrichTracks(refs, { spotify: client, cache: dbCache, lastfm, budget: BUDGET });
  await db()
    .update(schema.sources)
    .set({ snapshot: result.tracks.map(toSnapshot), snapshotAt: new Date(), pending: result.pending })
    .where(eq(schema.sources.id, source.id));
  return result.tracks;
}

/** Merge several sources' facts; a song in more than one keeps its newest "date added". */
function mergeFacts(lists: TrackFacts[][]): TrackFacts[] {
  const out = new Map<string, TrackFacts>();
  for (const list of lists) {
    for (const t of list) {
      const prev = out.get(t.id);
      if (!prev || (t.addedAt ?? '') > (prev.addedAt ?? '')) out.set(t.id, t);
    }
  }
  return [...out.values()];
}

function definitionOf(p: SmartPlaylist): SmartPlaylistDefinition {
  return { id: p.id, name: p.name, rule: p.rule, order: p.order, sync: p.sync, include: p.include, exclude: p.exclude, pinned: p.pinned };
}

/* ---------- Locks (one run per user at a time) ---------- */

async function withLock<T>(userId: string, fn: () => Promise<T>): Promise<T | null> {
  const key = `lock:${userId}`;
  const now = Date.now();
  const [row] = await db().select().from(schema.appSettings).where(eq(schema.appSettings.key, key));
  if (row && typeof row.value === 'number' && now - row.value < 10 * 60_000) return null;
  await db()
    .insert(schema.appSettings)
    .values({ key, value: now })
    .onConflictDoUpdate({ target: schema.appSettings.key, set: { value: now, updatedAt: new Date() } });
  try {
    return await fn();
  } finally {
    await db().delete(schema.appSettings).where(eq(schema.appSettings.key, key));
  }
}

/* ---------- Sync ---------- */

export interface SyncOptions {
  kind: 'daily' | 'manual' | 'create' | 'edit';
  /** Limit to these smart playlists (default: every un-paused one). */
  smartPlaylistIds?: string[];
}

/**
 * Bring a user's smart playlists up to date: read and analyze their sources, plan each
 * playlist, write the changes to Spotify, and log the run (with undo data).
 * Returns the run id, or null if another run for this user is in progress.
 */
export async function syncUser(userId: string, opts: SyncOptions): Promise<string | null> {
  return withLock(userId, async () => {
    const d = db();
    const [run] = await d.insert(schema.syncRuns).values({ userId, kind: opts.kind }).returning({ id: schema.syncRuns.id });
    const runId = run!.id;
    const results: RunPlaylistResult[] = [];
    const restore: Record<string, string[]> = {};
    const created: string[] = [];
    const needCovers: Array<{ playlistId: string; name: string; rule: SmartPlaylist['rule'] }> = [];
    try {
      const client = await spotifyFor(userId);
      let playlists = await d.select().from(schema.smartPlaylists).where(eq(schema.smartPlaylists.userId, userId));
      playlists = opts.smartPlaylistIds ? playlists.filter((p) => opts.smartPlaylistIds!.includes(p.id)) : playlists.filter((p) => !p.paused);
      const userSources = await d.select().from(schema.sources).where(eq(schema.sources.userId, userId));
      const neededSourceIds = new Set(opts.smartPlaylistIds ? playlists.flatMap((p) => p.sourceIds) : userSources.map((s) => s.id));

      const factsBySource = new Map<string, TrackFacts[]>();
      for (const source of userSources.filter((s) => neededSourceIds.has(s.id))) {
        factsBySource.set(source.id, await analyzeSource(client, source));
      }

      for (const p of playlists) {
        const result: RunPlaylistResult = { smartPlaylistId: p.id, playlistId: p.spotifyPlaylistId, name: p.name, added: 0, removed: 0 };
        try {
          const facts = mergeFacts(p.sourceIds.map((id) => factsBySource.get(id) ?? []));
          let playlistId = p.spotifyPlaylistId;
          let current: TrackRef[] = [];
          if (playlistId) {
            current = await client.playlistTracks(playlistId);
          } else {
            const description = `${ruleChips(p.rule).join(' · ')} · Kept in sync by AutoSort`.slice(0, 300);
            playlistId = (await client.createPlaylist({ name: `${p.name}${SPOTIFY_NAME_SUFFIX}`, description })).id;
            created.push(playlistId);
            needCovers.push({ playlistId, name: p.name, rule: p.rule });
            result.created = true;
            result.playlistId = playlistId;
          }
          const plan = planSmartPlaylist({ definition: definitionOf(p), sourceTracks: facts, currentTracks: current, state: { managedTrackIds: p.managedTrackIds } });
          if (plan.change.kind !== 'noop') {
            if (current.length) restore[playlistId] = plan.currentUris;
            await applyChange(client, playlistId, plan.change);
          }
          result.added = plan.addedTrackIds.length;
          result.removed = plan.removedTrackIds.length;
          await d
            .update(schema.smartPlaylists)
            .set({
              spotifyPlaylistId: playlistId,
              managedTrackIds: plan.nextState.managedTrackIds,
              trackCount: plan.desiredUris.length,
              lastSyncedAt: new Date(),
              lastAddedCount: plan.addedTrackIds.length,
              lastError: null,
            })
            .where(eq(schema.smartPlaylists.id, p.id));
        } catch (err) {
          result.error = err instanceof Error ? err.message : String(err);
          await d.update(schema.smartPlaylists).set({ lastError: result.error }).where(eq(schema.smartPlaylists.id, p.id));
        }
        results.push(result);
      }

      // Covers for new playlists, a few at a time (AI images take ~20 s each). Failures don't fail the run.
      for (let i = 0; i < needCovers.length; i += 4) {
        await Promise.allSettled(needCovers.slice(i, i + 4).map((c) => uploadCover(client, c.playlistId, c)));
      }

      const allPlaylists = await d.select().from(schema.smartPlaylists).where(eq(schema.smartPlaylists.userId, userId));
      const unmatchedIds = new Set<string>();
      for (const [sourceId, facts] of factsBySource) {
        const fed = allPlaylists.filter((p) => p.sourceIds.includes(sourceId));
        for (const t of facts) {
          if (!fed.some((p) => !p.exclude.includes(t.id) && (p.include.includes(t.id) || matchesRule(t, p.rule)))) unmatchedIds.add(t.id);
        }
      }
      const unmatched = unmatchedIds.size;
      const failed = results.filter((r) => r.error).length;
      const addedTotal = results.reduce((n, r) => n + r.added, 0);
      await d
        .update(schema.syncRuns)
        .set({
          status: failed === 0 ? 'ok' : failed === results.length && results.length > 0 ? 'error' : 'partial',
          finishedAt: new Date(),
          results,
          restore,
          createdPlaylistIds: created,
          unmatched,
          summary:
            created.length > 0
              ? `Created ${created.length} playlist${created.length === 1 ? '' : 's'}`
              : `${addedTotal} new song${addedTotal === 1 ? '' : 's'} filed`,
        })
        .where(eq(schema.syncRuns.id, runId));
    } catch (err) {
      await d
        .update(schema.syncRuns)
        .set({ status: 'error', finishedAt: new Date(), error: err instanceof Error ? err.message : String(err), results, restore, createdPlaylistIds: created })
        .where(eq(schema.syncRuns.id, runId));
      throw err;
    }
    return runId;
  });
}

/** Undo a run: put changed playlists back in their old order and delete playlists it created. */
export async function undoRun(userId: string, runId: string): Promise<void> {
  const d = db();
  const [run] = await d.select().from(schema.syncRuns).where(and(eq(schema.syncRuns.id, runId), eq(schema.syncRuns.userId, userId)));
  if (!run || run.undoneAt) return;
  const client = await spotifyFor(userId);
  for (const [playlistId, uris] of Object.entries(run.restore)) await restorePlaylist(client, playlistId, uris);
  if (run.createdPlaylistIds.length) {
    await client.removeFromLibrary(run.createdPlaylistIds.map((id) => `spotify:playlist:${id}`));
    await d
      .delete(schema.smartPlaylists)
      .where(and(eq(schema.smartPlaylists.userId, userId), inArray(schema.smartPlaylists.spotifyPlaylistId, run.createdPlaylistIds)));
  }
  await d.update(schema.syncRuns).set({ undoneAt: new Date() }).where(eq(schema.syncRuns.id, runId));
  await d.insert(schema.syncRuns).values({
    userId,
    kind: 'restore',
    status: 'ok',
    finishedAt: new Date(),
    summary: `Undid a ${run.kind} run from ${run.startedAt.toISOString().slice(0, 10)}`,
  });
}

/** The daily job: sync everyone who's connected, then tidy up old runs and cache rows. */
export async function syncEveryone(): Promise<{ users: number; errors: number }> {
  const d = db();
  const people = await d
    .select({ id: schema.users.id })
    .from(schema.users)
    .innerJoin(schema.spotifyAccounts, eq(schema.spotifyAccounts.userId, schema.users.id))
    .where(eq(schema.spotifyAccounts.status, 'connected'));
  let errors = 0;
  for (const p of people) {
    try {
      await syncUser(p.id, { kind: 'daily' });
    } catch {
      errors++;
    }
  }
  await d.delete(schema.syncRuns).where(lt(schema.syncRuns.startedAt, new Date(Date.now() - RUN_RETENTION_DAYS * 86_400_000)));
  await pruneCache();
  await d
    .insert(schema.appSettings)
    .values({ key: 'last_cron_at', value: new Date().toISOString() })
    .onConflictDoUpdate({ target: schema.appSettings.key, set: { value: new Date().toISOString(), updatedAt: new Date() } });
  return { users: people.length, errors };
}
