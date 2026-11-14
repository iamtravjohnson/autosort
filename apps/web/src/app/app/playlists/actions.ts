'use server';

import { parseRule, ruleChips, ruleKey, type Rule } from '@autosort/core';
import { and, eq, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import type { SaveResult } from '@/components/editor/types';
import { db, schema } from '@/db';
import type { SmartPlaylist } from '@/db/schema';
import { getSmartPlaylist, userSources } from '@/lib/queries';
import { friendlyLastError, orderSchema, spotifyErrorResult, stableJson, syncSchema, trackIdSchema, type ActionResult } from '@/lib/rules-ui';
import { requireUser } from '@/lib/session';
import { spotifyFor } from '@/lib/spotify';
import { SPOTIFY_NAME_SUFFIX, syncUser } from '@/lib/sync';
import { aiCoversEnabled, COVER_CONCURRENCY, playlistImage, uploadCover } from '@/lib/covers';

const draftSchema = z.object({
  name: z.string().trim().min(1, 'Give it a name.').max(100, 'Keep the name under 100 characters.'),
  sourceIds: z.array(z.uuid()).min(1, 'Pick at least one source.').max(20),
  rule: z.unknown(),
  order: orderSchema,
  sync: syncSchema,
  include: z.array(trackIdSchema).max(10_000),
  exclude: z.array(trackIdSchema).max(10_000),
  pinned: z.record(trackIdSchema, z.number().int().min(0).max(100_000)),
});

const idSchema = z.uuid();

function description(rule: Rule): string {
  return `${ruleChips(rule).join(' · ')} · Kept in sync by AutoSort`.slice(0, 300);
}

/** Write the saved row to Spotify: rename if needed, then run a sync for just this playlist. */
async function pushToSpotify(userId: string, id: string, before: SmartPlaylist | null, name: string, rule: Rule): Promise<SaveResult> {
  try {
    if (before?.spotifyPlaylistId && (before.name !== name || stableJson(before.rule) !== stableJson(rule))) {
      const client = await spotifyFor(userId);
      await client.updatePlaylistDetails(before.spotifyPlaylistId, { name: `${name}${SPOTIFY_NAME_SUFFIX}`, description: description(rule) });
    }
    const runId = await syncUser(userId, { kind: before ? 'edit' : 'create', smartPlaylistIds: [id] });
    if (!runId) return { ok: true, saved: true, message: 'Saved. Another sync is running, so Spotify will catch up when it finishes.' };
  } catch (err) {
    console.error('saveSmartPlaylist sync failed', err);
    return { ...spotifyErrorResult(err, { prefix: "Saved here, but Spotify wasn't updated." }), saved: true };
  }
  const [row] = await db()
    .select({ lastError: schema.smartPlaylists.lastError, trackCount: schema.smartPlaylists.trackCount })
    .from(schema.smartPlaylists)
    .where(eq(schema.smartPlaylists.id, id));
  if (row?.lastError) return { ok: false, saved: true, error: `Saved here, but Spotify wasn't updated. ${friendlyLastError(row.lastError)}` };
  const n = row?.trackCount ?? 0;
  return { ok: true, saved: true, message: `Saved. ${name} has ${n.toLocaleString('en-US')} song${n === 1 ? '' : 's'} in Spotify.` };
}

/** Save the editor (update, or insert on /new), then bring the Spotify playlist up to date. */
export async function saveSmartPlaylist(input: { id?: string; draft: unknown }): Promise<SaveResult> {
  const user = await requireUser();
  let id: string | undefined;
  if (input.id !== undefined) {
    const parsedId = idSchema.safeParse(input.id);
    if (!parsedId.success) return { ok: false, error: "We couldn't find that playlist." };
    id = parsedId.data;
  }
  const parsed = draftSchema.safeParse(input.draft);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Something in the form looks off.' };
  let rule: Rule;
  try {
    rule = parseRule(parsed.data.rule);
  } catch {
    return { ok: false, error: 'One of the rules looks off. Check each row and try again.' };
  }

  const owned = new Set((await userSources(user.id)).map((s) => s.id));
  if (!parsed.data.sourceIds.every((s) => owned.has(s))) return { ok: false, error: "One of those sources isn't yours anymore. Reload and try again." };

  const { name, sourceIds, order, sync, include, exclude, pinned } = parsed.data;
  const values = { name, sourceIds: [...new Set(sourceIds)], rule, order, sync, include: [...new Set(include)], exclude: [...new Set(exclude)], pinned };

  let before: SmartPlaylist | null = null;
  if (id) {
    before = await getSmartPlaylist(user.id, id);
    if (!before) return { ok: false, error: "We couldn't find that playlist." };
    await db()
      .update(schema.smartPlaylists)
      .set(values)
      .where(and(eq(schema.smartPlaylists.id, id), eq(schema.smartPlaylists.userId, user.id)));
  } else {
    const [row] = await db()
      .insert(schema.smartPlaylists)
      .values({ userId: user.id, ...values })
      .returning({ id: schema.smartPlaylists.id });
    id = row!.id;
  }

  const result: SaveResult = before?.paused
    ? { ok: true, saved: true, message: "Saved. This playlist is paused, so Spotify won't change until you resume it." }
    : await pushToSpotify(user.id, id, before, name, rule);

  revalidatePath('/app', 'layout');
  if (!before) redirect(`/app/playlists/${id}`);
  return result;
}

/** Pause (daily sync skips it) or resume (and catch up now). */
export async function setPlaylistPaused(input: { id: string; paused: boolean }): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = z.object({ id: idSchema, paused: z.boolean() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "We couldn't find that playlist." };
  const p = await getSmartPlaylist(user.id, parsed.data.id);
  if (!p) return { ok: false, error: "We couldn't find that playlist." };
  await db()
    .update(schema.smartPlaylists)
    .set({ paused: parsed.data.paused })
    .where(and(eq(schema.smartPlaylists.id, p.id), eq(schema.smartPlaylists.userId, user.id)));

  let result: ActionResult = parsed.data.paused
    ? { ok: true, message: 'Paused. AutoSort will leave it alone in Spotify until you resume it.' }
    : { ok: true, message: 'Resumed and brought up to date.' };
  if (!parsed.data.paused) {
    try {
      const runId = await syncUser(user.id, { kind: 'edit', smartPlaylistIds: [p.id] });
      if (!runId) result = { ok: true, message: 'Resumed. Another sync is running, so Spotify will catch up when it finishes.' };
    } catch (err) {
      console.error('setPlaylistPaused sync failed', err);
      result = spotifyErrorResult(err, { prefix: "Resumed, but Spotify wasn't updated." });
    }
  }
  revalidatePath('/app', 'layout');
  return result;
}

/** Delete a smart playlist; optionally also remove it from the user's Spotify library. */
export async function deleteSmartPlaylist(input: { id: string; removeFromSpotify: boolean }): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = z.object({ id: idSchema, removeFromSpotify: z.boolean() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "We couldn't find that playlist." };
  const p = await getSmartPlaylist(user.id, parsed.data.id);
  if (!p) return { ok: false, error: "We couldn't find that playlist." };
  if (parsed.data.removeFromSpotify && p.spotifyPlaylistId) {
    try {
      const client = await spotifyFor(user.id);
      await client.removeFromLibrary([`spotify:playlist:${p.spotifyPlaylistId}`]);
    } catch (err) {
      console.error('deleteSmartPlaylist removeFromLibrary failed', err);
      return spotifyErrorResult(err, { prefix: "Couldn't remove it from Spotify, so nothing was deleted." });
    }
  }
  await db()
    .delete(schema.smartPlaylists)
    .where(and(eq(schema.smartPlaylists.id, p.id), eq(schema.smartPlaylists.userId, user.id)));
  // Autopilot won't recreate a playlist the user deleted.
  const key = ruleKey(p.rule);
  const fed = p.sourceIds.length
    ? await db().select().from(schema.sources).where(and(eq(schema.sources.userId, user.id), inArray(schema.sources.id, p.sourceIds)))
    : [];
  for (const s of fed) {
    if (!s.dismissedRules.includes(key)) await db().update(schema.sources).set({ dismissedRules: [...s.dismissedRules, key] }).where(eq(schema.sources.id, s.id));
  }
  revalidatePath('/app', 'layout');
  redirect('/app/playlists');
}

/** Make a new cover for the playlist in Spotify: an AI photo when OPENROUTER_API_KEY is set, else AutoSort's designed cover. */
export async function regenerateCover(input: { id: string }): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = z.object({ id: z.uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "We couldn't find that playlist." };
  const p = await getSmartPlaylist(user.id, parsed.data.id);
  if (!p) return { ok: false, error: "We couldn't find that playlist." };
  if (!p.spotifyPlaylistId) return { ok: false, error: 'Save the playlist to Spotify first, then make a cover.' };
  try {
    const client = await spotifyFor(user.id);
    const kind = await uploadCover(client, p.spotifyPlaylistId, p);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const imageUrl = await playlistImage(client, p.spotifyPlaylistId).catch(() => null);
    if (imageUrl) await db().update(schema.smartPlaylists).set({ imageUrl }).where(eq(schema.smartPlaylists.id, p.id));
    revalidatePath('/app', 'layout');
    return {
      ok: true,
      message:
        kind === 'ai'
          ? 'New cover uploaded. Spotify can take a minute to show it.'
          : aiCoversEnabled()
            ? "The AI image didn't work this time, so AutoSort used its own design. Try again in a bit."
            : 'Cover uploaded. Add OPENROUTER_API_KEY in Vercel for photo covers.',
    };
  } catch (err) {
    return spotifyErrorResult(err, { prefix: "The cover wasn't uploaded." });
  }
}

/**
 * Make a new cover for every smart playlist in Spotify: a photo when OPENROUTER_API_KEY is set,
 * else AutoSort's designed cover. Replaces their current covers. A few at a time (photos take ~20 s).
 */
export async function regenerateAllCovers(): Promise<ActionResult & { made?: number; failed?: number }> {
  const user = await requireUser();
  const rows = (await db().select().from(schema.smartPlaylists).where(eq(schema.smartPlaylists.userId, user.id))).filter((p) => p.spotifyPlaylistId);
  if (rows.length === 0) return { ok: false, error: 'Your smart playlists aren’t in Spotify yet. Sync first, then try again.' };
  let client;
  try {
    client = await spotifyFor(user.id);
  } catch (err) {
    return spotifyErrorResult(err);
  }
  let made = 0;
  let failed = 0;
  let plain = 0;
  for (let i = 0; i < rows.length; i += COVER_CONCURRENCY) {
    const batch = rows.slice(i, i + COVER_CONCURRENCY);
    const settled = await Promise.allSettled(batch.map((p) => uploadCover(client, p.spotifyPlaylistId!, p)));
    settled.forEach((s, j) => {
      if (s.status === 'fulfilled') {
        made++;
        if (s.value === 'designed' && aiCoversEnabled()) plain++;
      }
      else {
        failed++;
        console.error(`Cover upload failed for "${batch[j]!.name}":`, s.reason instanceof Error ? s.reason.message : s.reason);
      }
    });
  }
  await new Promise((resolve) => setTimeout(resolve, 1500));
  for (const p of rows) {
    const imageUrl = await playlistImage(client, p.spotifyPlaylistId!).catch(() => null);
    if (imageUrl) await db().update(schema.smartPlaylists).set({ imageUrl }).where(eq(schema.smartPlaylists.id, p.id));
  }
  revalidatePath('/app', 'layout');
  if (failed) return { ok: false, made, failed, error: `${failed} cover${failed === 1 ? '' : 's'} didn’t upload. Try again in a minute.` };
  if (plain)
    return {
      ok: false,
      made,
      failed,
      error: `${plain} of ${made} covers got the color design because the photo service turned them down, usually because your OpenRouter credits are running low. Add credits at openrouter.ai/settings/credits, then click again.`,
    };
  return { ok: true, made, failed };
}

/** "Ask for a playlist": save the rule built from the user's words, build it in Spotify, then open it. */
export async function createAskedPlaylist(input: { name: string; rule: unknown; sourceIds: string[] }): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = z.object({ name: z.string().trim().min(1).max(100), rule: z.unknown(), sourceIds: z.array(idSchema).min(1).max(20) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Give the playlist a name and pick a source, then try again.' };
  let rule: Rule;
  try {
    rule = parseRule(parsed.data.rule);
  } catch {
    return { ok: false, error: "That request didn't turn into a rule. Try different words." };
  }
  const owned = new Set((await userSources(user.id)).map((s) => s.id));
  const sourceIds = parsed.data.sourceIds.filter((id) => owned.has(id));
  if (!sourceIds.length) return { ok: false, error: "We couldn't find that source." };
  const [row] = await db()
    .insert(schema.smartPlaylists)
    .values({ userId: user.id, sourceIds, name: parsed.data.name, rule, order: { by: 'addedAt', direction: 'desc' }, sync: {} })
    .returning({ id: schema.smartPlaylists.id });
  try {
    await syncUser(user.id, { kind: 'create', smartPlaylistIds: [row!.id] });
  } catch (err) {
    console.error('createAskedPlaylist sync failed', err);
  }
  revalidatePath('/app', 'layout');
  redirect(`/app/playlists/${row!.id}`);
}
