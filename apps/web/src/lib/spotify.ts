import 'server-only';
import {
  isExpired,
  refreshTokens,
  SpotifyApiError,
  SpotifyAuthError,
  SpotifyClient,
  type FetchLike,
  type PlaylistSummary,
  type SpotifyClientOptions,
} from '@autosort/core';
import { eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { dbCache } from './cache';
import { spotifyCredentials } from './config';
import { decrypt, encrypt } from './secrets';

export class ReconnectNeeded extends Error {
  constructor() {
    super('Spotify needs to be reconnected');
    this.name = 'ReconnectNeeded';
  }
}

/**
 * Thrown instead of calling Spotify while it has an endpoint on a rate-limit pause. The message
 * keeps "(429)" so saved run and playlist errors still read as a rate limit.
 */
export class SpotifyPaused extends Error {
  readonly status = 429;
  constructor(readonly until: number) {
    super(`Spotify rate limit (429): paused until ${new Date(until).toISOString()}`);
    this.name = 'SpotifyPaused';
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

  const seen: Last429 = { retryAfterMs: null };
  const fetchFn: FetchLike = async (input, init) => {
    const res = await fetch(input, init);
    if (res.status === 429) seen.retryAfterMs = retryAfterMs(res.headers.get('retry-after'));
    return res;
  };
  return new PausingSpotifyClient({ getAccessToken: (o) => token(Boolean(o?.forceRefresh)), fetch: fetchFn }, seen);
}

/* ---------- Rate-limit pauses ----------
 *
 * Spotify's rate limit belongs to the Spotify app, so everyone on this AutoSort shares it. Short
 * limits clear in seconds and the engine waits them out. In Development Mode, Spotify can also
 * answer with a Retry-After of many hours; the engine gives up on those right away, and calling
 * again during the wait (a reload, the daily sync) only adds requests. So a long 429 pauses that
 * endpoint for the whole app, saved in app_settings, and calls to it fail fast until it ends.
 */

const PAUSE_KEY = 'spotify_paused_until';
/** Pause after a 429 that gave no long Retry-After (retries ran out, or no header). */
const SHORT_PAUSE_MS = 2 * 60_000;
/** Never pause longer than this, whatever Retry-After says. */
const MAX_PAUSE_MS = 24 * 3_600_000;
/** How long this server instance reuses its copy of the pauses before reading them again. */
const PAUSE_MEMO_MS = 10_000;

type Pauses = Record<string, number>;
interface Last429 {
  retryAfterMs: number | null;
}

let pauseMemo: { pauses: Pauses; readAt: number } | null = null;

/** Retry-After (seconds or an HTTP date) in milliseconds, or null if missing or unreadable. */
function retryAfterMs(header: string | null): number | null {
  if (!header) return null;
  const seconds = Number(header);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const date = Date.parse(header);
  return Number.isFinite(date) ? Math.max(0, date - Date.now()) : null;
}

/** "/playlists/abc/items?limit=50" or a full next-page URL → "/playlists/:id/items". */
export function endpointOf(pathOrUrl: string): string {
  const path = pathOrUrl.replace(/^https?:\/\/[^/]+\/v1(?=\/)/, '').split('?')[0] ?? '';
  return path.replace(/\/(playlists|artists|albums|tracks|users)\/[^/]+/g, '/$1/:id');
}

/** Endpoints Spotify has paused, with when each pause ends (epoch ms). Expired pauses are dropped. */
async function currentPauses(): Promise<Pauses> {
  if (pauseMemo && Date.now() - pauseMemo.readAt < PAUSE_MEMO_MS) return pauseMemo.pauses;
  const [row] = await db().select().from(schema.appSettings).where(eq(schema.appSettings.key, PAUSE_KEY));
  const pauses: Pauses = {};
  if (row?.value && typeof row.value === 'object') {
    for (const [endpoint, iso] of Object.entries(row.value as Record<string, unknown>)) {
      const until = Date.parse(String(iso));
      if (until > Date.now()) pauses[endpoint] = until;
    }
  }
  pauseMemo = { pauses, readAt: Date.now() };
  return pauses;
}

/** Pause an endpoint until `until` (or longer, if it's already paused longer). Returns the end. */
async function pauseEndpoint(endpoint: string, until: number): Promise<number> {
  pauseMemo = null; // read fresh, so pauses saved by other instances are kept
  const pauses = { ...(await currentPauses()) };
  const end = Math.max(pauses[endpoint] ?? 0, Math.min(until, Date.now() + MAX_PAUSE_MS));
  pauses[endpoint] = end;
  const value = Object.fromEntries(Object.entries(pauses).map(([k, v]) => [k, new Date(v).toISOString()]));
  await db()
    .insert(schema.appSettings)
    .values({ key: PAUSE_KEY, value })
    .onConflictDoUpdate({ target: schema.appSettings.key, set: { value, updatedAt: new Date() } });
  pauseMemo = { pauses, readAt: Date.now() };
  return end;
}

/** A SpotifyClient that stays off an endpoint while Spotify has it paused. Throws SpotifyPaused. */
class PausingSpotifyClient extends SpotifyClient {
  constructor(
    opts: SpotifyClientOptions,
    private readonly seen: Last429,
  ) {
    super(opts);
  }

  override async request<T>(
    method: string,
    pathOrUrl: string,
    body?: unknown,
    idempotent?: boolean,
    raw?: { body: string; contentType: string },
  ): Promise<T> {
    const endpoint = endpointOf(pathOrUrl);
    const pausedUntil = (await currentPauses())[endpoint];
    if (pausedUntil) throw new SpotifyPaused(pausedUntil);
    this.seen.retryAfterMs = null;
    try {
      return await super.request<T>(method, pathOrUrl, body, idempotent, raw);
    } catch (err) {
      if (!(err instanceof SpotifyApiError) || err.status !== 429) throw err;
      const asked = this.seen.retryAfterMs;
      const until = await pauseEndpoint(endpoint, Date.now() + Math.max(asked ?? 0, SHORT_PAUSE_MS));
      console.warn(
        `Spotify said 429 on ${method} ${endpoint} (Retry-After: ${asked === null ? 'none' : `${Math.round(asked / 1000)}s`}${err.reason ? `, ${err.reason}` : ''}); not calling it again until ${new Date(until).toISOString()}`,
      );
      throw new SpotifyPaused(until);
    }
  }
}

/* ---------- Cached reads ---------- */

const PLAYLISTS_NS = 'spotify:my-playlists';
const PLAYLISTS_TTL_S = 60;

/**
 * The user's playlists for list pages (Home, Add a source, Sort), reused for a minute so moving
 * between pages doesn't re-read a big library from Spotify each time.
 */
export async function listMyPlaylists(userId: string): Promise<PlaylistSummary[]> {
  const hit = (await dbCache.getMany<PlaylistSummary[]>(PLAYLISTS_NS, [userId])).get(userId);
  if (hit) return hit;
  const lists = await (await spotifyFor(userId)).myPlaylists();
  await dbCache.setMany(PLAYLISTS_NS, [[userId, lists]], PLAYLISTS_TTL_S);
  return lists;
}
