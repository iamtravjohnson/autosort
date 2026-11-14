import 'server-only';
import { isExpired, refreshTokens, SpotifyAuthError, SpotifyClient } from '@autosort/core';
import { eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { spotifyCredentials } from './config';
import { decrypt, encrypt } from './secrets';

export class ReconnectNeeded extends Error {
  constructor() {
    super('Spotify needs to be reconnected');
    this.name = 'ReconnectNeeded';
  }
}

/** Save a fresh token set for a user (encrypted). */
export async function saveTokens(userId: string, t: { accessToken: string; refreshToken: string; expiresAt: number; scope: string }) {
  const row = {
    userId,
    accessToken: await encrypt(t.accessToken),
    refreshToken: await encrypt(t.refreshToken),
    expiresAt: new Date(t.expiresAt),
    scope: t.scope,
    status: 'connected' as const,
    updatedAt: new Date(),
  };
  await db()
    .insert(schema.spotifyAccounts)
    .values(row)
    .onConflictDoUpdate({ target: schema.spotifyAccounts.userId, set: row });
}

/** A Spotify client for a user that refreshes and saves tokens as needed. Throws ReconnectNeeded. */
export async function spotifyFor(userId: string): Promise<SpotifyClient> {
  const creds = spotifyCredentials();
  if (!creds) throw new Error('SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET are not set');

  async function token(forceRefresh = false): Promise<string> {
    const [acct] = await db().select().from(schema.spotifyAccounts).where(eq(schema.spotifyAccounts.userId, userId));
    if (!acct || acct.status === 'reconnect') throw new ReconnectNeeded();
    if (!forceRefresh && !isExpired({ expiresAt: acct.expiresAt.getTime() })) return decrypt(acct.accessToken);
    try {
      const fresh = await refreshTokens({ ...creds!, refreshToken: await decrypt(acct.refreshToken) });
      await saveTokens(userId, fresh);
      return fresh.accessToken;
    } catch (err) {
      if (err instanceof SpotifyAuthError && err.error === 'invalid_grant') {
        await db().update(schema.spotifyAccounts).set({ status: 'reconnect' }).where(eq(schema.spotifyAccounts.userId, userId));
        throw new ReconnectNeeded();
      }
      throw err;
    }
  }

  return new SpotifyClient({ getAccessToken: (o) => token(Boolean(o?.forceRefresh)) });
}
