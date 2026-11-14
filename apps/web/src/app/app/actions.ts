'use server';

import { revalidatePath } from 'next/cache';
import { db, schema } from '@/db';
import { eq } from 'drizzle-orm';
import { requireUser } from '@/lib/session';
import { friendlyError, type ActionState } from '@/lib/stats';
import { syncUser } from '@/lib/sync';

/** "Sync now" on Home: bring every smart playlist up to date right away. */
export async function syncNow(): Promise<ActionState> {
  const user = await requireUser();
  let runId: string | null;
  try {
    runId = await syncUser(user.id, { kind: 'manual' });
  } catch (err) {
    revalidatePath('/app', 'layout');
    return friendlyError(err);
  }
  revalidatePath('/app', 'layout');
  if (!runId) return { message: 'A sync is already running. Give it a minute, then refresh.' };
  const [run] = await db().select().from(schema.syncRuns).where(eq(schema.syncRuns.id, runId));
  if (run?.status === 'error') return { message: 'The sync ran into problems. See Activity for details.', href: '/app/activity?filter=problems', hrefLabel: 'Open Activity' };
  if (run?.status === 'partial') return { message: `${run.summary ?? 'Synced'}, but some playlists had problems.`, href: '/app/activity?filter=problems', hrefLabel: 'See what happened' };
  return { ok: true, message: `Synced. ${run?.summary ?? 'Everything is up to date'}.` };
}
