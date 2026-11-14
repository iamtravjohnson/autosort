'use server';

import { parseRule, type Rule } from '@autosort/core';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db, schema } from '@/db';
import { getSource, spotifyStatus } from '@/lib/queries';
import { orderSchema, spotifyErrorResult, type ActionResult } from '@/lib/rules-ui';
import { requireUser } from '@/lib/session';
import { spotifyFor } from '@/lib/spotify';
import { analyzeSource, syncUser } from '@/lib/sync';

const createInput = z.object({
  sourceId: z.uuid(),
  items: z
    .array(z.object({ name: z.string().trim().min(1).max(100), rule: z.unknown(), order: orderSchema }))
    .min(1)
    .max(30),
});

/** Save the picked suggestions as smart playlists, create them in Spotify, then go home. */
export async function createSuggestedPlaylists(_prev: ActionResult | null, input: z.input<typeof createInput>): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = createInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Give each playlist a name, then try again.' };
  const source = await getSource(user.id, parsed.data.sourceId);
  if (!source) return { ok: false, error: "We couldn't find that source." };

  let items: Array<{ name: string; rule: Rule; order: z.infer<typeof orderSchema> }>;
  try {
    items = parsed.data.items.map((i) => ({ name: i.name, rule: parseRule(i.rule), order: i.order }));
  } catch {
    return { ok: false, error: 'One of the rules looks off. Reload the page and try again.' };
  }

  // Don't save anything if Spotify needs reconnecting first (otherwise the rows would sit unsynced).
  const status = await spotifyStatus(user.id);
  if (!status || status.status === 'reconnect') return { ok: false, reconnect: true, error: 'Spotify signed you out of AutoSort.' };

  const rows = await db()
    .insert(schema.smartPlaylists)
    .values(items.map((i) => ({ userId: user.id, sourceIds: [source.id], name: i.name, rule: i.rule, order: i.order, sync: {} })))
    .returning({ id: schema.smartPlaylists.id });

  try {
    await syncUser(user.id, { kind: 'create', smartPlaylistIds: rows.map((r) => r.id) });
  } catch (err) {
    console.error('createSuggestedPlaylists sync failed', err);
    // The playlists are saved; Home shows them as not synced yet and the next sync retries.
  }
  revalidatePath('/app', 'layout');
  redirect('/app');
}

/** Read the source from Spotify and look up its songs' data so suggestions can be made. */
export async function analyzeSourceNow(_prev: ActionResult | null, sourceId: string): Promise<ActionResult> {
  const user = await requireUser();
  const id = z.uuid().safeParse(sourceId);
  if (!id.success) return { ok: false, error: "We couldn't find that source." };
  const source = await getSource(user.id, id.data);
  if (!source) return { ok: false, error: "We couldn't find that source." };
  try {
    await analyzeSource(await spotifyFor(user.id), source);
  } catch (err) {
    console.error('analyzeSourceNow failed', err);
    return spotifyErrorResult(err);
  }
  revalidatePath('/app', 'layout');
  return { ok: true };
}
