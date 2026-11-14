import { buildAuthorizeUrl, SPOTIFY_ALL_SCOPES } from '@autosort/core';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { redirectUri, spotifyCredentials } from '@/lib/config';
import { randomToken } from '@/lib/secrets';

/** Start Spotify sign-in. `?invite=<token>` carries a family invite through the round trip. */
export async function GET(request: Request) {
  const creds = spotifyCredentials();
  if (!creds) return NextResponse.redirect(new URL('/setup', request.url));
  const state = randomToken();
  const invite = new URL(request.url).searchParams.get('invite');
  const jar = await cookies();
  const opts = { httpOnly: true, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 600 };
  jar.set('autosort_oauth_state', state, opts);
  if (invite) jar.set('autosort_invite', invite, opts);
  const url = buildAuthorizeUrl({ clientId: creds.clientId, redirectUri: await redirectUri(), state, scopes: SPOTIFY_ALL_SCOPES, showDialog: true });
  return NextResponse.redirect(url);
}
