'use server';

import { suggestPlaylists } from '@autosort/core';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db, schema } from '@/db';
import { getSmartPlaylist, getSource, userSmartPlaylists } from '@/lib/queries';
import { requireUser } from '@/lib/session';
import { friendlyError, unmatchedTracks, type ActionState } from '@/lib/stats';
import { fromSnapshot, syncUser } from '@/lib/sync';

const createSchema = z.object({ sourceId: z.uuid(), key: z.string().min(2).max(4000) });

/** Create a smart playlist from a suggestion on the unmatched page, then build it in Spotify. */
export async function createFromSuggestion(_prev: ActionState | null, form: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = createSchema.safeParse({ sourceId: form.get('sourceId'), key: form.get('key') });
  if (!parsed.success) return { message: 'That suggestion looks wrong. Refresh the page and try again.' };
  const [source, playlists] = await Promise.all([getSource(user.id, parsed.data.sourceId), userSmartPlaylists(user.id)]);
  if (!source) return { message: "We couldn't find that source." };

  // Recompute rather than trusting the form: the rule comes from the engine, not the browser.
  const facts = unmatchedTracks(source, playlists).map(fromSnapshot);
  const suggestion = suggestPlaylists(facts, { existingRules: playlists.map((p) => p.rule), minSize: 5 }).find((s) => s.key === parsed.data.key);
  if (!suggestion) return { message: 'That suggestion changed since the page loaded. Refresh and try again.' };

  const [created] = await db()
    .insert(schema.smartPlaylists)
    .values({ userId: user.id, sourceIds: [source.id], name: suggestion.name, rule: suggestion.rule, order: suggestion.order })
    .returning({ id: schema.smartPlaylists.id });

  let runId: string | null;
  try {
    runId = await syncUser(user.id, { kind: 'create', smartPlaylistIds: [created!.id] });
  } catch (err) {
    revalidatePath('/app', 'layout');
    const e = friendlyError(err);
    return { ...e, message: `We saved ${suggestion.name}, but couldn't create it in Spotify yet. ${e.message ?? ''}`.trim() };
  }
  revalidatePath('/app', 'layout');
  if (!runId) return { ok: true, message: `Saved ${suggestion.name}. Another sync is running, so it will appear in Spotify on the next one.` };
  const saved = await getSmartPlaylist(user.id, created!.id);
  if (saved?.lastError) return { message: `We saved ${suggestion.name}, but Spotify had a problem creating it. See Activity for details.`, href: '/app/activity?filter=problems', hrefLabel: 'Open Activity' };
  const songs = saved?.trackCount ?? suggestion.count;
  return {
    ok: true,
    message: `${suggestion.name} is in Spotify with ${songs.toLocaleString('en-US')} ${songs === 1 ? 'song' : 'songs'}. If Spotify made it public, you can make it private in the Spotify app.`,
    href: `/app/playlists/${created!.id}`,
    hrefLabel: 'Open it',
  };
}

const addSchema = z.object({
  sourceId: z.uuid(),
  playlistId: z.uuid(),
  trackIds: z.array(z.string().regex(/^[A-Za-z0-9]{1,64}$/)).min(1).max(500),
});

/** "Add to…": pin songs into a smart playlist (its `include` list), then sync that playlist. */
export async function addToSmartPlaylist(_prev: ActionState | null, form: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = addSchema.safeParse({ sourceId: form.get('sourceId'), playlistId: form.get('playlistId'), trackIds: form.getAll('trackId') });
  if (!parsed.success) return { message: 'Pick at least one song and a playlist.' };
  const { sourceId, playlistId, trackIds } = parsed.data;
  const [source, playlist] = await Promise.all([getSource(user.id, sourceId), getSmartPlaylist(user.id, playlistId)]);
  if (!source || !playlist) return { message: "We couldn't find that playlist." };
  if (!playlist.sourceIds.includes(source.id)) return { message: `${playlist.name} doesn't read from ${source.name}, so it can't take songs from it.` };

  const inSource = new Set((source.snapshot ?? []).map((t) => t.id));
  const ids = [...new Set(trackIds)].filter((id) => inSource.has(id));
  if (!ids.length) return { message: `Those songs aren't in ${source.name} anymore. Refresh the page.` };

  const include = [...new Set([...playlist.include, ...ids])];
  const exclude = playlist.exclude.filter((id) => !ids.includes(id));
  await db()
    .update(schema.smartPlaylists)
    .set({ include, exclude })
    .where(and(eq(schema.smartPlaylists.id, playlist.id), eq(schema.smartPlaylists.userId, user.id)));

  const what = ids.length === 1 ? '1 song' : `${ids.length} songs`;
  let runId: string | null;
  try {
    runId = await syncUser(user.id, { kind: 'edit', smartPlaylistIds: [playlist.id] });
  } catch (err) {
    revalidatePath('/app', 'layout');
    const e = friendlyError(err);
    return { ...e, message: `Saved: ${what} will go in ${playlist.name}, but Spotify didn't update yet. ${e.message ?? ''}`.trim() };
  }
  revalidatePath('/app', 'layout');
  if (!runId) return { ok: true, message: `Saved. ${what} will be added to ${playlist.name} on the next sync (another one is running).` };
  return { ok: true, message: `Added ${what} to ${playlist.name}.` };
}
