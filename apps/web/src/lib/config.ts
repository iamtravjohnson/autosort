import 'server-only';
import { headers } from 'next/headers';

export const APP_VERSION = '0.1.0';
export const MAX_PEOPLE = 5; // Spotify Development Mode: 5 users per developer app
export const GITHUB_URL = 'https://github.com/iamtravjohnson/autosort';
export const DOCS_URL = 'https://autosort.app/docs/quick-start';
export const DISCLAIMER = 'AutoSort is an independent open-source project, not affiliated with or endorsed by Spotify.';

export function spotifyCredentials(): { clientId: string; clientSecret: string } | null {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

/** This instance's public origin, e.g. https://dana-autosort.vercel.app (or http://127.0.0.1:3000 locally). */
export async function appOrigin(): Promise<string> {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? '127.0.0.1:3000';
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('127.0.0.1') || host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

/** The exact Redirect URI to paste into the Spotify app. */
export async function redirectUri(): Promise<string> {
  return `${await appOrigin()}/api/auth/callback/spotify`;
}
