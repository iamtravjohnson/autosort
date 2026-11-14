import { exchangeCode, SpotifyClient } from '@autosort/core';
import { and, eq, gt, isNull, sql } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { MAX_PEOPLE, redirectUri, spotifyCredentials } from '@/lib/config';
import { startSession } from '@/lib/session';
import { saveTokens } from '@/lib/spotify';

function fail(request: Request, reason: string, invite?: string) {
  const path = invite ? `/join/${encodeURIComponent(invite)}` : '/connect';
  return NextResponse.redirect(new URL(`${path}?error=${encodeURIComponent(reason)}`, request.url));
}

/**
 * Spotify sends people back here. The first person to connect becomes the owner. After that,
 * only existing members or people with a valid invite can join (5 people max, Spotify's limit).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const jar = await cookies();
  const expected = jar.get('autosort_oauth_state')?.value;
  const inviteToken = jar.get('autosort_invite')?.value;
  jar.delete('autosort_oauth_state');
  jar.delete('autosort_invite');

  if (url.searchParams.get('error')) return fail(request, 'denied', inviteToken);
  const code = url.searchParams.get('code');
  if (!code || !expected || url.searchParams.get('state') !== expected) return fail(request, 'state', inviteToken);
  const creds = spotifyCredentials();
  if (!creds) return NextResponse.redirect(new URL('/setup', request.url));

  let tokens;
  try {
    tokens = await exchangeCode({ ...creds, code, redirectUri: await redirectUri() });
  } catch {
    return fail(request, 'exchange', inviteToken);
  }

  const client = new SpotifyClient({ getAccessToken: () => tokens.accessToken });
  let me;
  try {
    me = await client.me();
  } catch (err) {
    // A 403 here means this Spotify account isn't on the developer app's user list yet.
    return fail(request, err instanceof Error && /403/.test(err.message) ? 'not-allowlisted' : 'profile', inviteToken);
  }

  const d = db();
  const [existing] = await d.select().from(schema.users).where(eq(schema.users.spotifyId, me.id));
  let userId = existing?.id;

  if (!existing) {
    const [{ count }] = await d.select({ count: sql<number>`count(*)::int` }).from(schema.users);
    if (count === 0) {
      const [owner] = await d.insert(schema.users).values({ spotifyId: me.id, displayName: me.displayName, role: 'owner' }).returning();
      userId = owner!.id;
    } else {
      if (count >= MAX_PEOPLE) return fail(request, 'full', inviteToken);
      if (!inviteToken) return fail(request, 'invite-required');
      const [invite] = await d
        .select()
        .from(schema.invites)
        .where(and(eq(schema.invites.token, inviteToken), isNull(schema.invites.usedBy), gt(schema.invites.expiresAt, new Date())));
      if (!invite) return fail(request, 'invite-invalid', inviteToken);
      const [member] = await d.insert(schema.users).values({ spotifyId: me.id, displayName: me.displayName, role: 'member' }).returning();
      userId = member!.id;
      await d.update(schema.invites).set({ usedBy: userId }).where(eq(schema.invites.token, inviteToken));
    }
  } else if (me.displayName && me.displayName !== existing.displayName) {
    await d.update(schema.users).set({ displayName: me.displayName }).where(eq(schema.users.id, existing.id));
  }

  await saveTokens(userId!, tokens);
  await startSession(userId!);
  return NextResponse.redirect(new URL('/app', request.url));
}
