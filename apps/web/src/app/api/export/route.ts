import { desc, eq, sql } from 'drizzle-orm';
import { db, schema } from '@/db';
import { APP_VERSION } from '@/lib/config';
import { requireUser } from '@/lib/session';

/**
 * "Export my data": this person's sources (without track snapshots), smart playlists and
 * activity, as a JSON download. Undo data (old track orders) is left out.
 */
export async function GET() {
  const user = await requireUser();
  const d = db();
  const [sources, smartPlaylists, runs] = await Promise.all([
    d
      .select({
        id: schema.sources.id,
        kind: schema.sources.kind,
        playlistId: schema.sources.playlistId,
        name: schema.sources.name,
        songs: sql<number>`coalesce(jsonb_array_length(${schema.sources.snapshot}), 0)::int`,
        analyzedAt: schema.sources.snapshotAt,
        createdAt: schema.sources.createdAt,
      })
      .from(schema.sources)
      .where(eq(schema.sources.userId, user.id))
      .orderBy(schema.sources.createdAt),
    d.select().from(schema.smartPlaylists).where(eq(schema.smartPlaylists.userId, user.id)).orderBy(schema.smartPlaylists.createdAt),
    d
      .select({
        id: schema.syncRuns.id,
        kind: schema.syncRuns.kind,
        status: schema.syncRuns.status,
        startedAt: schema.syncRuns.startedAt,
        finishedAt: schema.syncRuns.finishedAt,
        summary: schema.syncRuns.summary,
        results: schema.syncRuns.results,
        unmatched: schema.syncRuns.unmatched,
        createdPlaylistIds: schema.syncRuns.createdPlaylistIds,
        undoneAt: schema.syncRuns.undoneAt,
        error: schema.syncRuns.error,
      })
      .from(schema.syncRuns)
      .where(eq(schema.syncRuns.userId, user.id))
      .orderBy(desc(schema.syncRuns.startedAt)),
  ]);

  const now = new Date();
  const body = {
    exportedAt: now.toISOString(),
    autosortVersion: APP_VERSION,
    user: { displayName: user.displayName, role: user.role, joinedAt: user.createdAt },
    sources,
    smartPlaylists,
    runs,
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="autosort-export-${now.toISOString().slice(0, 10)}.json"`,
      'Cache-Control': 'no-store',
    },
  });
}
