import 'server-only';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db, schema } from '@/db';
import type { User } from '@/db/schema';
import { BASE_PATH } from './base-path';
import { sign } from './secrets';

const COOKIE = 'autosort_session';
const MAX_AGE = 60 * 60 * 24 * 90; // 90 days

async function encode(userId: string, exp: number): Promise<string> {
  const payload = `${userId}.${exp}`;
  return `${payload}.${await sign(payload)}`;
}

async function decode(value: string | undefined): Promise<string | null> {
  if (!value) return null;
  const [userId, exp, sig] = value.split('.');
  if (!userId || !exp || !sig) return null;
  if (Number(exp) < Date.now() / 1000) return null;
  return (await sign(`${userId}.${exp}`)) === sig ? userId : null;
}

export async function startSession(userId: string) {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  (await cookies()).set(COOKIE, await encode(userId, exp), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: BASE_PATH || '/',
    maxAge: MAX_AGE,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

/** The signed-in user, or null. */
export async function currentUser(): Promise<User | null> {
  const id = await decode((await cookies()).get(COOKIE)?.value);
  if (!id) return null;
  const [user] = await db().select().from(schema.users).where(eq(schema.users.id, id));
  return user ?? null;
}

/** The signed-in user; sends anyone else to /connect. */
export async function requireUser(): Promise<User> {
  const user = await currentUser();
  if (!user) redirect('/connect');
  return user;
}

export async function requireOwner(): Promise<User> {
  const user = await requireUser();
  if (user.role !== 'owner') redirect('/app');
  return user;
}
