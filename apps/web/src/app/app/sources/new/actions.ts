'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db, schema } from '@/db';
import { userSources } from '@/lib/queries';
import { requireUser } from '@/lib/session';
import { spotifyFor } from '@/lib/spotify';
import { friendlyError, type ActionState } from '@/lib/stats';
import { analyzeSource } from '@/lib/sync';

const pickSchema = z.object({
  pick: z.union([z.literal('liked'), z.string().regex(/^playlist:[A-Za-z0-9]{1,64}$/)]),
});

/** Add a source (a playlist the user owns or collaborates on, or Liked Songs), read it, then show suggestions. */
export async function addSource(_prev: ActionState | null, form: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = pickSchema.safeParse({ pick: form.get('pick') });
  if (!parsed.success) return { message: 'Pick a playlist first.' };
  const pick = parsed.data.pick;
  const playlistId = pick === 'liked' ? null : pick.slice('playlist:'.length);

  const existing = await userSources(user.id);
  const dupe = existing.find((s) => (playlistId ? s.kind === 'playlist' && s.playlistId === playlistId : s.kind === 'liked'));
  if (dupe) redirect(`/app/sources/${dupe.id}`);

  let sourceId: string | null = null;
  let sourceName = 'Liked Songs';
  try {
    const client = await spotifyFor(user.id);
    let row: { kind: 'playlist' | 'liked'; playlistId: string | null; name: string; imageUrl: string | null };
    if (!playlistId) {
      row = { kind: 'liked', playlistId: null, name: 'Liked Songs', imageUrl: null };
    } else {
      const found = (await client.myPlaylists()).find((p) => p.id === playlistId);
      if (!found) return { message: "We couldn't find that playlist in your Spotify library." };
      if (found.ownerId !== user.spotifyId && !found.collaborative) {
        return { message: 'Spotify only lets apps read playlists you own or collaborate on, so AutoSort can’t use this one.' };
      }
      row = { kind: 'playlist', playlistId, name: found.name, imageUrl: found.imageUrl };
    }
    sourceName = row.name;
    const [source] = await db()
      .insert(schema.sources)
      .values({ userId: user.id, ...row })
      .returning();
    sourceId = source!.id;
    await analyzeSource(client, source!);
  } catch (err) {
    revalidatePath('/app', 'layout');
    const e = friendlyError(err);
    if (!sourceId) return e;
    return {
      ...e,
      message: `We added ${sourceName} but couldn't finish reading it. ${e.message ?? ''}`.trim(),
      href: `/app/sources/${sourceId}`,
      hrefLabel: 'Open it and try again',
    };
  }

  revalidatePath('/app', 'layout');
  redirect(`/app/sources/${sourceId}/suggestions`);
}
