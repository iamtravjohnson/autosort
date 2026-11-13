import { fetchWithRetry, readJson } from '../http.js';
import type { TrackRef } from '../types.js';
import { chunk, mapLimit, type FetchLike } from '../util.js';

export const SPOTIFY_API_URL = 'https://api.spotify.com/v1';
/** Spotify's max items per page and per write request. */
const PAGE = 50;
const WRITE_BATCH = 100;

export class SpotifyApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    /** e.g. "QUOTA_EXCEEDED" on a daily-quota 429. */
    readonly reason?: string,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = 'SpotifyApiError';
  }
}

export interface SpotifyClientOptions {
  /** Return a valid access token. Called with `forceRefresh` after a 401. */
  getAccessToken: (opts?: { forceRefresh?: boolean }) => Promise<string> | string;
  fetch?: FetchLike;
  baseUrl?: string;
  maxRetries?: number;
  /** Parallel requests for per-item lookups (e.g. artists). Default 4. */
  concurrency?: number;
  sleep?: (ms: number) => Promise<void>;
}

export interface SpotifyUser {
  id: string;
  displayName: string | null;
}

export interface PlaylistSummary {
  id: string;
  uri: string;
  name: string;
  description: string | null;
  ownerId: string;
  collaborative: boolean;
  public: boolean | null;
  snapshotId: string;
  itemCount: number | null;
  imageUrl: string | null;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  /** Spotify marks this field deprecated; it may be empty for many artists. */
  genres: string[];
}

interface RawTrack {
  id?: string | null;
  uri?: string;
  type?: string;
  is_local?: boolean;
  name?: string;
  explicit?: boolean;
  duration_ms?: number;
  external_ids?: { isrc?: string };
  artists?: Array<{ id?: string | null; name?: string }>;
  album?: {
    name?: string;
    release_date?: string;
    release_date_precision?: 'year' | 'month' | 'day';
    images?: Array<{ url: string }>;
  };
}

interface RawPlaylist {
  id: string;
  uri: string;
  name: string;
  description?: string | null;
  owner?: { id?: string };
  collaborative?: boolean;
  public?: boolean | null;
  snapshot_id?: string;
  items?: { total?: number };
  tracks?: { total?: number };
  images?: Array<{ url: string }> | null;
}

interface Paging<T> {
  items: T[];
  next: string | null;
  total?: number;
}

export function toTrackRef(raw: RawTrack | null | undefined, addedAt: string | null): TrackRef | null {
  if (!raw || raw.type !== 'track' || raw.is_local || !raw.id) return null;
  return {
    id: raw.id,
    uri: raw.uri ?? `spotify:track:${raw.id}`,
    name: raw.name ?? '',
    artists: (raw.artists ?? []).map((a) => ({ id: a.id ?? null, name: a.name ?? '' })),
    album: {
      name: raw.album?.name ?? '',
      releaseDate: raw.album?.release_date ?? null,
      releaseDatePrecision: raw.album?.release_date_precision ?? null,
      imageUrl: raw.album?.images?.[0]?.url ?? null,
    },
    durationMs: raw.duration_ms ?? 0,
    explicit: Boolean(raw.explicit),
    isrc: raw.external_ids?.isrc ?? null,
    addedAt,
  };
}

function toPlaylist(raw: RawPlaylist): PlaylistSummary {
  return {
    id: raw.id,
    uri: raw.uri,
    name: raw.name,
    description: raw.description ?? null,
    ownerId: raw.owner?.id ?? '',
    collaborative: Boolean(raw.collaborative),
    public: raw.public ?? null,
    snapshotId: raw.snapshot_id ?? '',
    itemCount: raw.items?.total ?? raw.tracks?.total ?? null,
    imageUrl: raw.images?.[0]?.url ?? null,
  };
}

/**
 * Minimal Spotify Web API client for AutoSort (post-February-2026 endpoints:
 * `/playlists/{id}/items`, `/me/playlists`). Token storage and refresh live in the app.
 */
export class SpotifyClient {
  private readonly fetchFn: FetchLike;
  private readonly baseUrl: string;

  constructor(private readonly opts: SpotifyClientOptions) {
    this.fetchFn = opts.fetch ?? ((input, init) => fetch(input, init));
    this.baseUrl = opts.baseUrl ?? SPOTIFY_API_URL;
  }

  async request<T>(method: string, pathOrUrl: string, body?: unknown, idempotent = method === 'GET' || method === 'PUT'): Promise<T> {
    const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${this.baseUrl}${pathOrUrl}`;
    const send = async (token: string) =>
      fetchWithRetry(
        this.fetchFn,
        url,
        {
          method,
          headers: { Authorization: `Bearer ${token}`, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        },
        {
          maxRetries: this.opts.maxRetries ?? 4,
          retryServerErrors: idempotent,
          isFatal429: async (res) => ((await readJson(res)) as { error?: { reason?: string } } | null)?.error?.reason === 'QUOTA_EXCEEDED',
          ...(this.opts.sleep ? { sleep: this.opts.sleep } : {}),
        },
      );

    let res = await send(await this.opts.getAccessToken());
    if (res.status === 401) res = await send(await this.opts.getAccessToken({ forceRefresh: true }));
    const data = await readJson(res);
    if (!res.ok) {
      const err = (data as { error?: { message?: string; reason?: string } } | null)?.error;
      throw new SpotifyApiError(
        `Spotify ${method} ${url.replace(this.baseUrl, '')} failed (${res.status}): ${err?.message ?? res.statusText}`,
        res.status,
        err?.reason,
        data,
      );
    }
    return data as T;
  }

  private async all<T>(path: string): Promise<T[]> {
    const out: T[] = [];
    let next: string | null = path;
    while (next) {
      const page: Paging<T> = await this.request<Paging<T>>('GET', next);
      out.push(...(page.items ?? []));
      next = page.next;
    }
    return out;
  }

  async me(): Promise<SpotifyUser> {
    const raw = await this.request<{ id: string; display_name?: string | null }>('GET', '/me');
    return { id: raw.id, displayName: raw.display_name ?? null };
  }

  /** Every playlist in the user's library (owned, collaborative and followed). */
  async myPlaylists(): Promise<PlaylistSummary[]> {
    const raw = await this.all<RawPlaylist | null>(`/me/playlists?limit=${PAGE}`);
    return raw.filter((p): p is RawPlaylist => Boolean(p)).map(toPlaylist);
  }

  /** Tracks in a playlist the user owns or collaborates on (local files and episodes are skipped). */
  async playlistTracks(playlistId: string): Promise<TrackRef[]> {
    type Entry = { added_at?: string | null; is_local?: boolean; item?: RawTrack | null; track?: RawTrack | null };
    const entries = await this.all<Entry>(`/playlists/${encodeURIComponent(playlistId)}/items?limit=${PAGE}&additional_types=track`);
    return entries
      .filter((e) => !e.is_local)
      .map((e) => toTrackRef(e.item ?? e.track, e.added_at ?? null))
      .filter((t): t is TrackRef => t !== null);
  }

  /** The user's Liked Songs, newest first. */
  async savedTracks(): Promise<TrackRef[]> {
    type Entry = { added_at?: string | null; track?: RawTrack | null; item?: RawTrack | null };
    const entries = await this.all<Entry>(`/me/tracks?limit=${PAGE}`);
    return entries.map((e) => toTrackRef(e.track ?? e.item, e.added_at ?? null)).filter((t): t is TrackRef => t !== null);
  }

  async artist(id: string): Promise<SpotifyArtist | null> {
    try {
      const raw = await this.request<{ id: string; name: string; genres?: string[] }>('GET', `/artists/${encodeURIComponent(id)}`);
      return { id: raw.id, name: raw.name, genres: raw.genres ?? [] };
    } catch (err) {
      if (err instanceof SpotifyApiError && (err.status === 404 || err.status === 400)) return null;
      throw err;
    }
  }

  /** Look up many artists (Spotify removed the batch endpoint, so this fans out with a concurrency limit). */
  async artists(ids: readonly string[]): Promise<Map<string, SpotifyArtist | null>> {
    const results = await mapLimit(ids, this.opts.concurrency ?? 4, (id) => this.artist(id));
    return new Map(ids.map((id, i) => [id, results[i] ?? null]));
  }

  async createPlaylist(input: { name: string; description?: string; public?: boolean }): Promise<PlaylistSummary> {
    const raw = await this.request<RawPlaylist>(
      'POST',
      '/me/playlists',
      { name: input.name, public: input.public ?? false, ...(input.description ? { description: input.description } : {}) },
      false,
    );
    return toPlaylist(raw);
  }

  /** Add tracks, in order, at `position` (or the end). Returns the last snapshot id. */
  async addItems(playlistId: string, uris: readonly string[], position?: number): Promise<string | null> {
    let snapshot: string | null = null;
    for (const [i, batch] of chunk(uris, WRITE_BATCH).entries()) {
      const body = position === undefined ? { uris: batch } : { uris: batch, position: position + i * WRITE_BATCH };
      snapshot = (await this.request<{ snapshot_id: string }>('POST', `/playlists/${encodeURIComponent(playlistId)}/items`, body, false)).snapshot_id;
    }
    return snapshot;
  }

  /** Replace the playlist's contents with exactly `uris` (empty clears it). */
  async replaceItems(playlistId: string, uris: readonly string[]): Promise<string | null> {
    const [first = [], ...rest] = chunk(uris, WRITE_BATCH);
    let snapshot: string | null = (
      await this.request<{ snapshot_id: string }>('PUT', `/playlists/${encodeURIComponent(playlistId)}/items`, { uris: first })
    ).snapshot_id;
    for (const batch of rest) snapshot = await this.addItems(playlistId, batch);
    return snapshot;
  }

  /** Remove every occurrence of each URI. */
  async removeItems(playlistId: string, uris: readonly string[]): Promise<string | null> {
    let snapshot: string | null = null;
    for (const batch of chunk(uris, WRITE_BATCH)) {
      snapshot = (
        await this.request<{ snapshot_id: string }>(
          'DELETE',
          `/playlists/${encodeURIComponent(playlistId)}/items`,
          { items: batch.map((uri) => ({ uri })) },
          true,
        )
      ).snapshot_id;
    }
    return snapshot;
  }
}
