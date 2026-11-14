import { describe, expect, it, vi } from 'vitest';
import { missingScopes, moveArgs, SPOTIFY_ALL_SCOPES, SPOTIFY_SCOPES, SpotifyClient } from '../src/index.js';
import { fakeFetch, json, noSleep } from './fixtures.js';

const client = (fetch: ReturnType<typeof fakeFetch>['fetch']) =>
  new SpotifyClient({ getAccessToken: vi.fn(async () => 'token'), fetch, sleep: noSleep });

const bodyOf = (call?: { init?: RequestInit }) => JSON.parse(call?.init?.body as string);

describe('library and playlist management', () => {
  it('saves and removes library items 40 URIs at a time via /me/library', async () => {
    const { fetch, calls } = fakeFetch(() => new Response(null, { status: 200 }));
    const uris = Array.from({ length: 45 }, (_, i) => `spotify:track:${i}`);
    await client(fetch).saveToLibrary(uris);
    expect(calls.map((c) => c.init?.method)).toEqual(['PUT', 'PUT']);
    const first = new URL(calls[0]!.url);
    expect(first.pathname).toBe('/v1/me/library');
    expect(first.searchParams.get('uris')!.split(',')).toHaveLength(40);

    calls.length = 0;
    await client(fetch).removeFromLibrary(['spotify:playlist:p1']);
    expect(calls[0]?.init?.method).toBe('DELETE');
    expect(new URL(calls[0]!.url).searchParams.get('uris')).toBe('spotify:playlist:p1');
  });

  it('likes tracks with their original dates', async () => {
    const { fetch, calls } = fakeFetch(() => new Response(null, { status: 200 }));
    await client(fetch).saveTracksWithDates([{ id: 'a', addedAt: '2019-03-01T12:00:00Z' }]);
    expect(calls[0]?.url).toBe('https://api.spotify.com/v1/me/tracks');
    expect(bodyOf(calls[0])).toEqual({ timestamped_ids: [{ id: 'a', added_at: '2019-03-01T12:00:00Z' }] });
  });

  it('asks for private playlists and reports what Spotify actually did', async () => {
    const { fetch, calls } = fakeFetch(() => json({ id: 'p', uri: 'spotify:playlist:p', name: 'Rap (AutoSort)', public: true }, 201));
    const p = await client(fetch).createPlaylist({ name: 'Rap (AutoSort)' });
    expect(bodyOf(calls[0])).toMatchObject({ public: false });
    expect(calls).toHaveLength(1); // no follow-up call: Spotify ignores it
    expect(p.public).toBe(true);
  });

  it('moves tracks and renames playlists', async () => {
    const { fetch, calls } = fakeFetch(() => json({ snapshot_id: 's2' }));
    const c = client(fetch);
    expect(await c.moveItems('p', { ...moveArgs(5, 2), snapshotId: 's1' })).toBe('s2');
    expect(bodyOf(calls[0])).toEqual({ range_start: 5, insert_before: 2, range_length: 1, snapshot_id: 's1' });
    await c.updatePlaylistDetails('p', { name: 'Rap (AutoSort)' });
    expect(calls[1]?.init?.method).toBe('PUT');
    expect(bodyOf(calls[1])).toEqual({ name: 'Rap (AutoSort)' });
  });

  it('uploads a JPEG cover as raw base64', async () => {
    const { fetch, calls } = fakeFetch(() => new Response(null, { status: 202 }));
    await client(fetch).uploadPlaylistCover('p', '/9j/4AAQ');
    expect(calls[0]?.url).toBe('https://api.spotify.com/v1/playlists/p/images');
    expect((calls[0]?.init?.headers as Record<string, string>)['Content-Type']).toBe('image/jpeg');
    expect(calls[0]?.init?.body).toBe('/9j/4AAQ');
  });

  it('computes move arguments for up, down and to-top', () => {
    expect(moveArgs(3, 2)).toEqual({ rangeStart: 3, insertBefore: 2 }); // up
    expect(moveArgs(3, 4)).toEqual({ rangeStart: 3, insertBefore: 5 }); // down
    expect(moveArgs(9, 0)).toEqual({ rangeStart: 9, insertBefore: 0 }); // to top
  });

  it('reports scopes a connection still needs', () => {
    const old = 'playlist-read-private playlist-read-collaborative playlist-modify-private playlist-modify-public user-library-read';
    expect(missingScopes(old)).toEqual(['user-library-modify', 'ugc-image-upload']);
    expect(missingScopes(SPOTIFY_ALL_SCOPES.join(' '), SPOTIFY_ALL_SCOPES)).toEqual([]);
    expect(SPOTIFY_ALL_SCOPES).toEqual(expect.arrayContaining([...SPOTIFY_SCOPES, 'user-top-read', 'user-modify-playback-state']));
  });
});
