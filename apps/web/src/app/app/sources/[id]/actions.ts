'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db, schema } from '@/db';
import { getSource, userSmartPlaylists } from '@/lib/queries';
import { requireUser } from '@/lib/session';
import { spotifyFor } from '@/lib/spotify';
import { friendlyError, type ActionState } from '@/lib/stats';
import { saveAutopilotPicks } from '@/lib/autopilot';
import { analyzeSource, fromSnapshot, syncUser } from '@/lib/sync';

const idSchema = z.object({ sourceId: z.uuid() });

/** Re-read a source from Spotify and look up any missing data. */
export async function refreshAnalysis(_prev: ActionState | null, form: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = idSchema.safeParse({ sourceId: form.get('sourceId') });
  if (!parsed.success) return { message: 'That source link looks wrong. Go back and try again.' };
  const source = await getSource(user.id, parsed.data.sourceId);
  if (!source) return { message: "We couldn't find that source." };
  let songs: number;
  try {
    songs = (await analyzeSource(await spotifyFor(user.id), source)).length;
  } catch (err) {
    return friendlyError(err);
  }
  revalidatePath('/app', 'layout');
  return { ok: true, message: `Done. Read ${songs.toLocaleString('en-US')} ${songs === 1 ? 'song' : 'songs'} from ${source.name}.` };
}

/**
 * Stop using a playlist as a source. Nothing changes in Spotify. Smart playlists that read
 * only from it are paused (otherwise the next sync would empty them).
 */
export async function removeSource(_prev: ActionState | null, form: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = idSchema.safeParse({ sourceId: form.get('sourceId') });
  if (!parsed.success) return { message: 'That source link looks wrong. Go back and try again.' };
  const source = await getSource(user.id, parsed.data.sourceId);
  if (!source) return { message: "We couldn't find that source." };

  const d = db();
  for (const p of await userSmartPlaylists(user.id)) {
    if (!p.sourceIds.includes(source.id)) continue;
    const sourceIds = p.sourceIds.filter((id) => id !== source.id);
    await d
      .update(schema.smartPlaylists)
      .set(sourceIds.length ? { sourceIds } : { sourceIds, paused: true })
      .where(and(eq(schema.smartPlaylists.id, p.id), eq(schema.smartPlaylists.userId, user.id)));
  }
  await d.delete(schema.sources).where(and(eq(schema.sources.id, source.id), eq(schema.sources.userId, user.id)));
  revalidatePath('/app', 'layout');
  redirect('/app/sources');
}

/**
 * Autopilot, right after an analysis: create every smart playlist AutoSort recommends for this
 * source (skipping ones the user deleted before), then build them in Spotify.
 */
export async function autopilotNow(sourceId: string): Promise<{ ok: true; created: string[] } | { ok: false; error: string }> {
  const user = await requireUser();
  const id = z.uuid().safeParse(sourceId);
  const source = id.success ? await getSource(user.id, id.data) : null;
  if (!source) return { ok: false, error: "We couldn't find that source." };
  if (!source.autopilot || !source.snapshot?.length) return { ok: true, created: [] };
  const rows = await saveAutopilotPicks(user.id, source, source.snapshot.map(fromSnapshot), await userSmartPlaylists(user.id));
  if (rows.length) {
    try {
      await syncUser(user.id, { kind: 'create', smartPlaylistIds: rows.map((r) => r.id) });
    } catch (err) {
      // They're saved; the next sync builds them in Spotify.
      console.error('autopilotNow sync failed', err);
    }
  }
  revalidatePath('/app', 'layout');
  return { ok: true, created: rows.map((r) => r.name) };
}

/** Turn Autopilot on or off for a source. */
export async function setAutopilot(sourceId: string, on: boolean): Promise<void> {
  const user = await requireUser();
  const id = z.uuid().safeParse(sourceId);
  if (!id.success) return;
  await db()
    .update(schema.sources)
    .set({ autopilot: on })
    .where(and(eq(schema.sources.id, id.data), eq(schema.sources.userId, user.id)));
  revalidatePath('/app', 'layout');
}
