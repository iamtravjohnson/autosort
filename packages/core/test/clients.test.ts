import { describe, expect, it, vi } from 'vitest';
import {
  buildAuthorizeUrl,
  createPkcePair,
  enrichTracks,
  LastfmClient,
  memoryCache,
  MusicBrainzClient,
  ReccoBeatsClient,
  refreshTokens,
  SpotifyApiError,
  SpotifyClient,
} from '../src/index.js';
import { audio, fakeFetch, json, noSleep, ref } from './fixtures.js';

const rawTrack = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  uri: `spotify:track:${id}`,
  type: 'track',
  name: `Track ${id}`,
  explicit: false,
  duration_ms: 1000,
  external_ids: { isrc: `ISRC${id}` },
  artists: [{ id: `art-${id}`, name: `Artist ${id}` }],
  album: { name: 'Album', release_date: '1997-08-26', release_date_precision: 'day', images: [{ url: 'img' }] },
  ...extra,
});

const client = (fetch: ReturnType<typeof fakeFetch>['fetch'], getAccessToken = vi.fn(async () => 'token')) =>
  new SpotifyClient({ getAccessToken, fetch, sleep: noSleep });

describe('SpotifyClient', () => {
  it('pages through playlist items, reading `item` (and legacy `track`), skipping local files and episodes', async () => {
    const { fetch, calls } = fakeFetch((url) =>
      url.includes('offset=50')
        ? json({ items: [{ added_at: '2024-02-01T00:00:00Z', track: rawTrack('c') }], next: null })
        : json({
            items: [
              { added_at: '2024-01-01T00:00:00Z', item: rawTrack('a') },
              { added_at: '2024-01-02T00:00:00Z', is_local: true, item: rawTrack('local') },
              { added_at: '2024-01-03T00:00:00Z', item: { ...rawTrack('ep'), type: 'episode' } },
              { added_at: '2024-01-04T00:00:00Z', item: rawTrack('b') },
            ],
            next: 'https://api.spotify.com/v1/playlists/p1/items?offset=50&limit=50',
          }),
    );
    const tracks = await client(fetch).playlistTracks('p1');
    expect(tracks.map((t) => t.id)).toEqual(['a', 'b', 'c']);
    expect(tracks[0]).toMatchObject({ isrc: 'ISRCa', addedAt: '2024-01-01T00:00:00Z', album: { releaseDate: '1997-08-26' } });
    expect(calls[0]?.url).toBe('https://api.spotify.com/v1/playlists/p1/items?limit=50&additional_types=track');
    expect((calls[0]?.init?.headers as Record<string, string>).Authorization).toBe('Bearer token');
  });

  it('retries 429s after Retry-After, but not daily quota errors', async () => {
    let n = 0;
    const retry = fakeFetch(() => (n++ === 0 ? json({ error: { status: 429 } }, 429, { 'Retry-After': '1' }) : json({ id: 'me' })));
    expect((await client(retry.fetch).me()).id).toBe('me');
    expect(retry.calls).toHaveLength(2);

    const quota = fakeFetch(() => json({ error: { status: 429, message: 'Too many requests', reason: 'QUOTA_EXCEEDED' } }, 429));
    const err = await client(quota.fetch).me().catch((e) => e);
    expect(err).toBeInstanceOf(SpotifyApiError);
    expect(err).toMatchObject({ status: 429, reason: 'QUOTA_EXCEEDED' });
    expect(quota.calls).toHaveLength(1);
  });

  it('refreshes the token once after a 401', async () => {
    let n = 0;
    const { fetch } = fakeFetch(() => (n++ === 0 ? json({ error: { status: 401 } }, 401) : json({ id: 'me' })));
    const getAccessToken = vi.fn(async (o?: { forceRefresh?: boolean }) => (o?.forceRefresh ? 'new' : 'old'));
    await client(fetch, getAccessToken).me();
    expect(getAccessToken).toHaveBeenLastCalledWith({ forceRefresh: true });
  });

  it('writes in batches of 100 with the documented bodies', async () => {
    const { fetch, calls } = fakeFetch(() => json({ snapshot_id: 'snap' }));
    const c = client(fetch);
    const uris = Array.from({ length: 250 }, (_, i) => `spotify:track:${i}`);

    await c.addItems('p', uris, 0);
    expect(calls.map((x) => JSON.parse(x.init?.body as string).position)).toEqual([0, 100, 200]);

    calls.length = 0;
    await c.replaceItems('p', uris.slice(0, 150));
    expect(calls.map((x) => [x.init?.method, JSON.parse(x.init?.body as string).uris.length])).toEqual([['PUT', 100], ['POST', 50]]);

    calls.length = 0;
    await c.removeItems('p', ['spotify:track:1']);
    expect(calls[0]?.init?.method).toBe('DELETE');
    expect(JSON.parse(calls[0]?.init?.body as string)).toEqual({ items: [{ uri: 'spotify:track:1' }] });
  });

  it('creates private playlists by default', async () => {
    const { fetch, calls } = fakeFetch(() => json({ id: 'new', uri: 'spotify:playlist:new', name: 'Country', items: { total: 0 } }, 201));
    const p = await client(fetch).createPlaylist({ name: 'Country', description: 'Genre: Country' });
    expect(p).toMatchObject({ id: 'new', itemCount: 0 });
    expect(calls[0]?.url).toBe('https://api.spotify.com/v1/me/playlists');
    expect(JSON.parse(calls[0]?.init?.body as string)).toEqual({ name: 'Country', public: false, description: 'Genre: Country' });
  });
});

describe('auth', () => {
  it('builds a PKCE authorize URL', async () => {
    const { verifier, challenge } = await createPkcePair();
    expect(verifier).toHaveLength(64);
    expect(challenge).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const url = new URL(buildAuthorizeUrl({ clientId: 'id', redirectUri: 'http://127.0.0.1:3000/cb', state: 's', codeChallenge: challenge }));
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('scope')).toContain('playlist-modify-private');
  });

  it('keeps the old refresh token when Spotify omits a new one', async () => {
    const { fetch, calls } = fakeFetch(() => json({ access_token: 'a2', expires_in: 3600, scope: 's' }));
    const tokens = await refreshTokens({ clientId: 'id', clientSecret: 'secret', refreshToken: 'r1', fetch });
    expect(tokens).toMatchObject({ accessToken: 'a2', refreshToken: 'r1' });
    expect((calls[0]?.init?.headers as Record<string, string>).Authorization).toBe(`Basic ${btoa('id:secret')}`);
  });
});

describe('data sources', () => {
  it('ReccoBeats batches 40 ids and maps results back by Spotify id', async () => {
    const { fetch, calls } = fakeFetch((url) => {
      const ids = new URL(url).searchParams.get('ids')!.split(',');
      return json({ content: ids.slice(0, 2).map((id) => ({ href: `https://open.spotify.com/track/${id}`, tempo: 128, key: 9, mode: 0, energy: 0.8 })) });
    });
    const ids = Array.from({ length: 45 }, (_, i) => `id${i}`);
    const out = await new ReccoBeatsClient({ fetch }).audioFeatures(ids);
    expect(calls).toHaveLength(2);
    expect(out.get('id0')).toMatchObject({ tempo: 128, key: 9, mode: 0 });
    expect(out.get('id40')).toBeDefined();
    expect(out.has('id5')).toBe(false);
  });

  it('Last.fm normalizes single tags and treats "not found" as empty', async () => {
    const one = fakeFetch(() => json({ toptags: { tag: { name: 'country', count: '100' } } }));
    expect(await new LastfmClient({ apiKey: 'k', fetch: one.fetch }).trackTopTags('A', 'B')).toEqual([{ name: 'country', count: 100 }]);
    const missing = fakeFetch(() => json({ error: 6, message: 'Track not found' }));
    expect(await new LastfmClient({ apiKey: 'k', fetch: missing.fetch }).trackTopTags('A', 'B')).toEqual([]);
  });

  it('MusicBrainz takes the earliest confident first-release year and throttles', async () => {
    const { fetch } = fakeFetch(() =>
      json({ recordings: [{ score: 100, 'first-release-date': '2003-09-29' }, { score: 100, 'first-release-date': '2004' }, { score: 40, 'first-release-date': '1990' }] }),
    );
    let clock = 0;
    const sleep = vi.fn(async (ms: number) => void (clock += ms));
    const mb = new MusicBrainzClient({ fetch, sleep, now: () => clock });
    expect(await mb.originalYear('X')).toBe(2003);
    await mb.originalYear('Y');
    expect(sleep).toHaveBeenCalledWith(1100);
  });
});

describe('enrichTracks', () => {
  it('uses the cache on later runs and reports work left over the budget', async () => {
    const tracks = [ref({ id: 'x', isrc: 'I1', artist: 'p' }), ref({ id: 'y', isrc: 'I2', artist: 'q' })];
    const spotify = { artists: vi.fn(async (ids: readonly string[]) => new Map(ids.map((id) => [id, { id, name: id, genres: ['country'] }]))) };
    const reccobeats = { audioFeatures: vi.fn(async (ids: readonly string[]) => new Map(ids.map((id) => [id, audio({ key: 9, mode: 0 })]))) };
    const musicbrainz = { originalYear: vi.fn(async () => 1994) };
    const cache = memoryCache();

    const first = await enrichTracks(tracks, { spotify, reccobeats, musicbrainz, cache, budget: { years: 1, artists: 400 } });
    expect(first.pending.years).toBe(1);
    expect(first.complete).toBe(false);
    expect(first.tracks[0]).toMatchObject({ genreBuckets: ['country'], camelot: '8A', year: 1994 });

    const second = await enrichTracks(tracks, { spotify, reccobeats, musicbrainz, cache, budget: { artists: 400 } });
    expect(second.complete).toBe(true);
    expect(spotify.artists).toHaveBeenCalledTimes(1);
    expect(reccobeats.audioFeatures).toHaveBeenCalledTimes(1);
    expect(musicbrainz.originalYear).toHaveBeenCalledTimes(2);
  });

  it('keeps going when a source fails and leaves the work pending', async () => {
    const spotify = { artists: vi.fn(async () => new Map()) };
    const reccobeats = { audioFeatures: vi.fn(async () => Promise.reject(new Error('down'))) };
    const result = await enrichTracks([ref({ id: 'z' })], { spotify, reccobeats, musicbrainz: null });
    expect(result.pending.audio).toBe(1);
    expect(result.errors[0]).toMatchObject({ step: 'audio', message: 'down' });
    expect(result.tracks[0]?.audio).toBeNull();
  });
});
