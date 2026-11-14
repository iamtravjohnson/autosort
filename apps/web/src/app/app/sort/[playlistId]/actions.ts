'use server';

import { moveArgs, type SpotifyClient } from '@autosort/core';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db, schema } from '@/db';
import type { RunPlaylistResult } from '@/db/schema';
import { playlistIdSchema, spotifyErrorResult, spotifyPlaylistUrl, trackUriSchema, type ActionResult } from '@/lib/rules-ui';
import { requireUser } from '@/lib/session';
import { spotifyFor } from '@/lib/spotify';
import { SPOTIFY_NAME_SUFFIX } from '@/lib/sync';

const NOT_YOURS = 'Spotify only lets AutoSort change playlists you own or collaborate on.';
const CHANGED = 'This playlist changed in Spotify since you opened it. Reload the page and try again.';
const HIDDEN =
  "This playlist has items AutoSort can't read (local files or podcast episodes), so it won't change the playlist itself. You can save the sorted songs as a new playlist instead.";

const text = (max: number) => z.string().trim().min(1).max(max);
const items = z.array(z.object({ index: z.number().int().min(0).max(50_000), uri: trackUriSchema })).min(1).max(500);
const uris = z.array(trackUriSchema).min(1).max(20_000);

/** Current track URIs, plus whether the playlist holds items we can't see (local files, episodes…). */
async function readPlaylist(client: SpotifyClient, playlistId: string): Promise<{ uris: string[]; hidden: boolean }> {
  const tracks = await client.playlistTracks(playlistId);
  const page = await client.request<{ total?: number }>('GET', `/playlists/${encodeURIComponent(playlistId)}/items?limit=1`);
  return { uris: tracks.map((t) => t.uri), hidden: typeof page.total === 'number' && page.total !== tracks.length };
}

function sameSongs(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const x = [...a].sort();
  const y = [...b].sort();
  return x.every((v, i) => v === y[i]);
}

async function logRun(userId: string, run: { summary: string; results: RunPlaylistResult[]; restore?: Record<string, string[]>; created?: string[]; status?: 'ok' | 'partial'; error?: string }) {
  await db()
    .insert(schema.syncRuns)
    .values({
      userId,
      kind: 'sort',
      status: run.status ?? 'ok',
      finishedAt: new Date(),
      summary: run.summary,
      results: run.results,
      restore: run.restore ?? {},
      createdPlaylistIds: run.created ?? [],
      error: run.error ?? null,
    });
}

/** Take the selected songs out of the playlist (logged so Activity can undo it). */
export async function removeSongs(input: { playlistId: string; name: string; items: Array<{ index: number; uri: string }> }): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = z.object({ playlistId: playlistIdSchema, name: text(200), items }).safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Pick at least one song first.' };
  const { playlistId, name } = parsed.data;
  const remove = [...new Set(parsed.data.items.map((i) => i.uri))];
  try {
    const client = await spotifyFor(user.id);
    const current = await readPlaylist(client, playlistId);
    if (current.hidden) return { ok: false, error: HIDDEN };
    if (!parsed.data.items.every((i) => current.uris[i.index] === i.uri)) return { ok: false, error: CHANGED };
    await client.removeItems(playlistId, remove);
    const removed = current.uris.filter((u) => remove.includes(u)).length;
    await logRun(user.id, {
      summary: `Removed ${removed} song${removed === 1 ? '' : 's'} from ${name}`,
      results: [{ playlistId, name, added: 0, removed }],
      restore: { [playlistId]: current.uris },
    });
  } catch (err) {
    console.error('removeSongs failed', err);
    return spotifyErrorResult(err, { forbidden: NOT_YOURS });
  }
  revalidatePath('/app', 'layout');
  return { ok: true, message: `Removed from ${name}. You can undo this in Activity for 30 days.` };
}

/** Move the selected songs up one, down one, or to the top, in Spotify. */
export async function moveSongs(input: { playlistId: string; direction: 'up' | 'down' | 'top'; items: Array<{ index: number; uri: string }> }): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = z.object({ playlistId: playlistIdSchema, direction: z.enum(['up', 'down', 'top']), items: items.max(100) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Pick up to 100 songs to move.' };
  const { playlistId, direction } = parsed.data;
  try {
    const client = await spotifyFor(user.id);
    const current = await readPlaylist(client, playlistId);
    if (current.hidden) return { ok: false, error: HIDDEN };
    if (!parsed.data.items.every((i) => current.uris[i.index] === i.uri)) return { ok: false, error: CHANGED };

    // Simulate on positions, then send one move per step (Spotify moves one block at a time).
    const picked = new Set(parsed.data.items.map((i) => i.index));
    const order = current.uris.map((_, i) => i);
    const steps: Array<[number, number]> = [];
    const move = (from: number, to: number) => {
      const [x] = order.splice(from, 1);
      order.splice(to, 0, x!);
      steps.push([from, to]);
    };
    if (direction === 'up') {
      for (let i = 1; i < order.length; i++) if (picked.has(order[i]!) && !picked.has(order[i - 1]!)) move(i, i - 1);
    } else if (direction === 'down') {
      for (let i = order.length - 2; i >= 0; i--) if (picked.has(order[i]!) && !picked.has(order[i + 1]!)) move(i, i + 1);
    } else {
      let slot = 0;
      for (let i = 0; i < order.length; i++) {
        if (!picked.has(order[i]!)) continue;
        if (i !== slot) move(i, slot);
        slot++;
      }
    }
    for (const [from, to] of steps) await client.moveItems(playlistId, moveArgs(from, to));
  } catch (err) {
    console.error('moveSongs failed', err);
    return spotifyErrorResult(err, { forbidden: NOT_YOURS });
  }
  revalidatePath(`/app/sort/${playlistId}`);
  return { ok: true, message: 'Moved in Spotify.' };
}

/** Replace the playlist's order with the sorted one (undo point saved for Activity). */
export async function reorderPlaylist(input: { playlistId: string; name: string; label: string; uris: string[] }): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = z.object({ playlistId: playlistIdSchema, name: text(200), label: text(60), uris }).safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Nothing to save yet.' };
  const { playlistId, name, label } = parsed.data;
  try {
    const client = await spotifyFor(user.id);
    const current = await readPlaylist(client, playlistId);
    if (current.hidden) return { ok: false, error: HIDDEN };
    if (!sameSongs(current.uris, parsed.data.uris)) return { ok: false, error: CHANGED };
    await client.replaceItems(playlistId, parsed.data.uris);
    await logRun(user.id, {
      summary: `Sorted ${name} (${label})`,
      results: [{ playlistId, name, added: 0, removed: 0 }],
      restore: { [playlistId]: current.uris },
    });
  } catch (err) {
    console.error('reorderPlaylist failed', err);
    return spotifyErrorResult(err, { forbidden: NOT_YOURS });
  }
  revalidatePath('/app', 'layout');
  return { ok: true, message: 'Saved the new order. You can undo it in Activity for 30 days.', href: spotifyPlaylistUrl(playlistId) };
}

/** Save the sorted order as a brand-new playlist ("Name · Sort (AutoSort)"). */
export async function saveAsNewPlaylist(input: { playlistId: string; name: string; label: string; uris: string[] }): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = z.object({ playlistId: playlistIdSchema, name: text(200), label: text(60), uris }).safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Nothing to save yet.' };
  const { playlistId, name, label } = parsed.data;
  const newName = `${`${name} · ${label}`.slice(0, 85)}${SPOTIFY_NAME_SUFFIX}`;
  let createdId: string | null = null;
  try {
    const client = await spotifyFor(user.id);
    const current = await client.playlistTracks(playlistId);
    if (!sameSongs(current.map((t) => t.uri), parsed.data.uris)) return { ok: false, error: CHANGED };
    const created = await client.createPlaylist({ name: newName, description: `${name}, sorted by ${label.toLowerCase()}. Made with AutoSort.`.slice(0, 300) });
    createdId = created.id;
    await client.addItems(created.id, parsed.data.uris);
    await logRun(user.id, {
      summary: `Saved ${newName} as a new playlist`,
      results: [{ playlistId: created.id, name: newName, added: parsed.data.uris.length, removed: 0, created: true }],
      created: [created.id],
    });
  } catch (err) {
    console.error('saveAsNewPlaylist failed', err);
    if (createdId) {
      await logRun(user.id, {
        status: 'partial',
        summary: `Started ${newName}, but not every song was added`,
        results: [{ playlistId: createdId, name: newName, added: 0, removed: 0, created: true, error: err instanceof Error ? err.message : String(err) }],
        created: [createdId],
        error: err instanceof Error ? err.message : String(err),
      }).catch(() => undefined);
    }
    return spotifyErrorResult(err);
  }
  revalidatePath('/app', 'layout');
  return {
    ok: true,
    message: `Saved “${newName}” to your library. Spotify may make new playlists public; you can make it private in the Spotify app.`,
    ...(createdId ? { href: spotifyPlaylistUrl(createdId) } : {}),
  };
}
