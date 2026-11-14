'use server';

import { ruleChips } from '@autosort/core';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import type { ConfirmState } from '@/components/access/confirm-dialog';
import { db, schema } from '@/db';
import { deleteUserEverywhere } from '@/lib/access';
import { isMosaic, playlistImage } from '@/lib/covers';
import { endSession, requireUser } from '@/lib/session';
import { spotifyFor } from '@/lib/spotify';
import { SPOTIFY_NAME_SUFFIX } from '@/lib/sync';

/** Album mosaic (Spotify's own), photo (OpenRouter) or AutoSort's designed cover. */
export async function setCoverStyle(style: string): Promise<void> {
  const user = await requireUser();
  const parsed = z.enum(['mosaic', 'photo', 'designed']).safeParse(style);
  if (!parsed.success) return;
  await db().update(schema.users).set({ coverStyle: parsed.data }).where(eq(schema.users.id, user.id));
  revalidatePath('/app', 'layout');
}

/**
 * Give every smart playlist Spotify's album mosaic. Spotify has no way for apps to remove a
 * cover, so each playlist with a custom cover is rebuilt: a fresh copy with the same songs in the
 * same order, then the old one is removed from the library. Playlists already showing Spotify's
 * own cover are left alone.
 */
export async function switchToAlbumMosaics(): Promise<{ ok: boolean; rebuilt: number; failed: number; error?: string }> {
  const user = await requireUser();
  await db().update(schema.users).set({ coverStyle: 'mosaic' }).where(eq(schema.users.id, user.id));
  const rows = (await db().select().from(schema.smartPlaylists).where(eq(schema.smartPlaylists.userId, user.id))).filter((p) => p.spotifyPlaylistId);
  let client;
  try {
    client = await spotifyFor(user.id);
  } catch {
    return { ok: false, rebuilt: 0, failed: 0, error: 'Spotify signed you out of AutoSort. Reconnect, then try again.' };
  }
  let rebuilt = 0;
  let failed = 0;
  for (const p of rows) {
    const oldId = p.spotifyPlaylistId!;
    try {
      const current = await playlistImage(client, oldId).catch(() => null);
      if (current && isMosaic(current)) continue;
      const tracks = await client.playlistTracks(oldId);
      const description = `${ruleChips(p.rule).join(' · ')} · Kept in sync by AutoSort`.slice(0, 300);
      const fresh = await client.createPlaylist({ name: `${p.name}${SPOTIFY_NAME_SUFFIX}`, description });
      if (tracks.length) await client.replaceItems(fresh.id, tracks.map((t) => t.uri));
      // Point AutoSort at the new copy before removing the old one, so nothing is lost if that fails.
      await db().update(schema.smartPlaylists).set({ spotifyPlaylistId: fresh.id, imageUrl: null }).where(eq(schema.smartPlaylists.id, p.id));
      await client.removeFromLibrary([`spotify:playlist:${oldId}`]).catch((err) => console.error(`Couldn't remove the old "${p.name}":`, err));
      rebuilt++;
    } catch (err) {
      failed++;
      console.error(`Rebuilding "${p.name}" for an album mosaic failed:`, err instanceof Error ? err.message : err);
    }
  }
  // Spotify takes a moment to make each mosaic; remember the addresses so AutoSort can show them.
  if (rebuilt) await new Promise((resolve) => setTimeout(resolve, 4000));
  const after = await db().select().from(schema.smartPlaylists).where(eq(schema.smartPlaylists.userId, user.id));
  for (const p of after) {
    if (!p.spotifyPlaylistId) continue;
    const imageUrl = await playlistImage(client, p.spotifyPlaylistId).catch(() => null);
    if (imageUrl) await db().update(schema.smartPlaylists).set({ imageUrl }).where(eq(schema.smartPlaylists.id, p.id));
  }
  revalidatePath('/app', 'layout');
  return failed
    ? { ok: false, rebuilt, failed, error: `${failed} playlist${failed === 1 ? '' : 's'} couldn't be rebuilt. Try again in a minute.` }
    : { ok: true, rebuilt, failed };
}

const ConfirmInput = z.object({ confirm: z.literal('yes') });

/**
 * Disconnect Spotify / Delete my data: removes this person's Spotify tokens, sources, smart
 * playlists, runs and user row. If the owner leaves while others remain, the oldest member
 * becomes owner. Then signs out.
 */
export async function deleteMyData(_prev: ConfirmState, formData: FormData): Promise<ConfirmState> {
  const user = await requireUser();
  const parsed = ConfirmInput.safeParse({ confirm: formData.get('confirm') });
  if (!parsed.success) return { error: 'Tick the box to confirm.' };
  try {
    await deleteUserEverywhere(user.id);
  } catch {
    return { error: 'Couldn’t delete your data just now. Nothing was removed. Please try again.' };
  }
  await endSession();
  revalidatePath('/app', 'layout');
  redirect('/connect?deleted=1');
}
