'use server';

import { and, eq, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { InviteState } from '@/components/access/add-member';
import type { ConfirmState } from '@/components/access/confirm-dialog';
import { db, schema } from '@/db';
import { deleteUserEverywhere, INVITE_DAYS, spotsUsed } from '@/lib/access';
import { appOrigin, MAX_PEOPLE } from '@/lib/config';
import { randomToken } from '@/lib/secrets';
import { requireOwner } from '@/lib/session';

const InviteInput = z.object({
  name: z.string().trim().min(1, 'Add their name.').max(60, 'Keep the name under 60 characters.'),
  email: z.union([z.literal(''), z.email('That email doesn’t look right.').max(254)]),
});

/** Step 2 of "Add a family member": make a one-time invite link that expires in 7 days. */
export async function createInvite(_prev: InviteState, formData: FormData): Promise<InviteState> {
  const owner = await requireOwner();
  const parsed = InviteInput.safeParse({
    name: String(formData.get('name') ?? ''),
    email: String(formData.get('email') ?? '').trim(),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the name and email.' };

  const spots = await spotsUsed();
  if (spots.used >= MAX_PEOPLE) {
    return { ok: false, error: `All ${MAX_PEOPLE} spots are in use. Remove someone or revoke an invite first.` };
  }

  const token = randomToken();
  await db()
    .insert(schema.invites)
    .values({
      token,
      name: parsed.data.name,
      email: parsed.data.email || null,
      createdBy: owner.id,
      expiresAt: new Date(Date.now() + INVITE_DAYS * 86_400_000),
    });
  revalidatePath('/app', 'layout');
  return { ok: true, name: parsed.data.name, link: `${await appOrigin()}/join/${token}` };
}

const TokenInput = z.object({ token: z.string().min(1).max(128) });

/** Revoke (or clear an expired) invite that nobody has used. */
export async function revokeInvite(formData: FormData): Promise<void> {
  await requireOwner();
  const parsed = TokenInput.safeParse({ token: formData.get('token') });
  if (!parsed.success) return;
  await db()
    .delete(schema.invites)
    .where(and(eq(schema.invites.token, parsed.data.token), isNull(schema.invites.usedBy)));
  revalidatePath('/app', 'layout');
}

const RemoveInput = z.object({ userId: z.uuid(), confirm: z.literal('yes') });

/** Remove a family member: deletes their user row and everything AutoSort stored for them. */
export async function removeMember(_prev: ConfirmState, formData: FormData): Promise<ConfirmState> {
  const owner = await requireOwner();
  const parsed = RemoveInput.safeParse({ userId: formData.get('userId'), confirm: formData.get('confirm') });
  if (!parsed.success) return { error: 'Confirm to remove this person.' };
  if (parsed.data.userId === owner.id) return { error: 'To leave, use Delete my data in Settings.' };

  const [target] = await db().select({ role: schema.users.role }).from(schema.users).where(eq(schema.users.id, parsed.data.userId));
  if (!target) {
    revalidatePath('/app', 'layout');
    return { ok: true };
  }
  if (target.role === 'owner') return { error: 'The owner can’t be removed here.' };

  await deleteUserEverywhere(parsed.data.userId);
  revalidatePath('/app', 'layout');
  return { ok: true };
}
