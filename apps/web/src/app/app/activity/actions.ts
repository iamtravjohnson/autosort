'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db, schema } from '@/db';
import { requireUser } from '@/lib/session';
import { friendlyError, olderThanDays, type ActionState } from '@/lib/stats';
import { undoRun } from '@/lib/sync';

const undoSchema = z.object({ runId: z.uuid() });

/** Undo a run from the last 30 days: restore playlist orders and delete playlists it created. */
export async function undoRunAction(_prev: ActionState | null, form: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = undoSchema.safeParse({ runId: form.get('runId') });
  if (!parsed.success) return { message: 'That run link looks wrong. Refresh and try again.' };
  const [run] = await db()
    .select()
    .from(schema.syncRuns)
    .where(and(eq(schema.syncRuns.id, parsed.data.runId), eq(schema.syncRuns.userId, user.id)));
  if (!run) return { message: "We couldn't find that run." };
  if (run.undoneAt) return { ok: true, message: 'Already undone.' };
  if (olderThanDays(run.startedAt, 30)) return { message: 'Runs older than 30 days can’t be undone.' };
  if (!Object.keys(run.restore).length && !run.createdPlaylistIds.length) return { message: 'This run didn’t change anything, so there’s nothing to undo.' };

  try {
    await undoRun(user.id, run.id);
  } catch (err) {
    revalidatePath('/app', 'layout');
    return friendlyError(err);
  }
  revalidatePath('/app', 'layout');
  return {
    ok: true,
    message: run.createdPlaylistIds.length && !Object.keys(run.restore).length ? 'Done. Those playlists are gone from your library.' : 'Done. Your playlists are back the way they were.',
  };
}
