import 'server-only';
import type { EditorSource, SongsResult } from '@/components/editor/types';
import { userSources } from '@/lib/queries';
import { compactTrack, spotifyErrorResult } from '@/lib/rules-ui';
import { spotifyFor } from '@/lib/spotify';

/** The user's sources with compact snapshots, so the editor can preview rules in the browser. */
export async function editorSources(userId: string): Promise<EditorSource[]> {
  const sources = await userSources(userId);
  return sources.map((s) => ({ id: s.id, name: s.name, analyzed: Boolean(s.snapshot), tracks: (s.snapshot ?? []).map(compactTrack) }));
}

/** The smart playlist's songs in their current Spotify order (for the Songs tab). Never throws. */
export async function loadSongs(userId: string, spotifyPlaylistId: string, managedTrackIds: string[]): Promise<SongsResult> {
  try {
    const client = await spotifyFor(userId);
    const tracks = await client.playlistTracks(spotifyPlaylistId);
    const managed = new Set(managedTrackIds);
    return {
      ok: true,
      tracks: tracks.map((t) => ({
        id: t.id,
        name: t.name,
        artist: t.artists.map((a) => a.name).join(', '),
        imageUrl: t.album.imageUrl,
        manual: !managed.has(t.id),
      })),
    };
  } catch (err) {
    console.error('loadSongs failed', err);
    return spotifyErrorResult(err);
  }
}
