'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import type { ConfirmState } from '@/components/access/confirm-dialog';
import { deleteUserEverywhere } from '@/lib/access';
import { endSession, requireUser } from '@/lib/session';

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
