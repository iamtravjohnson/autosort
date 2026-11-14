import { DAY, memoryCache, type Cache } from './cache.js';
import { classifyTrack } from './classify.js';
import { cleanAlbum, cleanTitle } from './genre.js';
import { MusicBrainzClient } from './sources/musicbrainz.js';
import { ReccoBeatsClient } from './sources/reccobeats.js';
import type { LastfmClient } from './sources/lastfm.js';
import type { SpotifyArtist, SpotifyClient } from './spotify/client.js';
import type { AudioFeatures, Tag, TrackFacts, TrackRef } from './types.js';
import { chunk, uniq } from './util.js';

export type EnrichStep = 'artists' | 'audio' | 'years' | 'tags' | 'albumTags' | 'artistTags';

export interface EnrichOptions {
  /**
   * Only used for Spotify artist genres, which Spotify no longer returns to most apps. The step is
   * off by default (budget 0); give `budget.artists` a value to try it.
   */
  spotify?: Pick<SpotifyClient, 'artists'>;
  /** Where looked-up data is kept between runs. Default: in-memory (nothing persists). */
  cache?: Cache;
  /** Audio features. Default: a keyless ReccoBeats client. Pass null to skip. */
  reccobeats?: Pick<ReccoBeatsClient, 'audioFeatures'> | null;
  /** Original release years. Default: a MusicBrainz client. Pass null to skip. */
  musicbrainz?: Pick<MusicBrainzClient, 'originalYear'> | null;
  /**
   * Crowd tags for the song, its album and its artists: the main genre evidence, plus moods and
   * themes (love, worship…). Needs a Last.fm key; skipped when absent.
   */
  lastfm?: Pick<LastfmClient, 'trackTopTags' | 'artistTopTags' | 'albumTopTags'> | null;
  /**
   * Max uncached lookups per step in this run. Lookups are cached, so repeated runs
   * (e.g. a daily job) finish a big library over time. MusicBrainz allows ~1 request/second.
   */
  budget?: Partial<Record<EnrichStep, number>>;
  ttlDays?: Partial<Record<EnrichStep | 'misses', number>>;
  onProgress?: (event: { step: EnrichStep; done: number; total: number }) => void;
}

export interface EnrichResult {
  tracks: TrackFacts[];
  /** Lookups still to do (over budget or failed). Run again later to fill them in. */
  pending: Record<EnrichStep, number>;
  complete: boolean;
  errors: Array<{ step: EnrichStep; message: string }>;
}

export const DEFAULT_BUDGET: Record<EnrichStep, number> = { artists: 0, audio: 4000, years: 40, tags: 250, albumTags: 150, artistTags: 150 };
const DEFAULT_TTL_DAYS = { artists: 30, audio: 90, years: 180, tags: 60, albumTags: 60, artistTags: 30, misses: 7 };

const NS = {
  artists: 'spotify:artist-genres',
  audio: 'reccobeats:audio',
  years: 'musicbrainz:year',
  tags: 'lastfm:song-tags',
  albumTags: 'lastfm:album-tags',
  artistTags: 'lastfm:artist-tags',
} as const;

const mainArtist = (t: TrackRef) => t.artists[0]?.name ?? '';
const tagKey = (t: TrackRef) => `${mainArtist(t)}\u0000${cleanTitle(t.name)}`.toLowerCase();
const albumKey = (t: TrackRef) => `${mainArtist(t)}\u0000${cleanAlbum(t.album.name)}`.toLowerCase();

/** Merge several tag lists, keeping each tag's highest count. */
function mergeTags(lists: Array<readonly Tag[]>): Tag[] {
  const best = new Map<string, Tag>();
  for (const list of lists) for (const tag of list) {
    const key = tag.name.toLowerCase();
    if ((best.get(key)?.count ?? -1) < tag.count) best.set(key, tag);
  }
  return [...best.values()].sort((a, b) => b.count - a.count);
}

/**
 * Gather genres, audio features, original years and tags for tracks, then classify them.
 * Uses the cache first and stays within `budget`, so it's safe to call from a time-limited job.
 */
export async function enrichTracks(tracks: readonly TrackRef[], opts: EnrichOptions): Promise<EnrichResult> {
  const cache = opts.cache ?? memoryCache();
  const budget = { ...DEFAULT_BUDGET, ...opts.budget };
  const ttl = { ...DEFAULT_TTL_DAYS, ...opts.ttlDays };
  const reccobeats = opts.reccobeats === undefined ? new ReccoBeatsClient() : opts.reccobeats;
  const musicbrainz = opts.musicbrainz === undefined ? new MusicBrainzClient() : opts.musicbrainz;
  const lastfm = opts.lastfm ?? null;
  const pending: Record<EnrichStep, number> = { artists: 0, audio: 0, years: 0, tags: 0, albumTags: 0, artistTags: 0 };
  const errors: EnrichResult['errors'] = [];

  /** Shared cache-then-fetch loop for each step. */
  async function lookup<T>(
    step: EnrichStep,
    keys: string[],
    fetchMany: (keys: string[]) => Promise<Map<string, T | null>>,
    batchSize: number,
  ): Promise<Map<string, T | null>> {
    const known = await cache.getMany<T>(NS[step], keys);
    const missing = keys.filter((k) => !known.has(k));
    const todo = missing.slice(0, budget[step]);
    pending[step] = missing.length - todo.length;
    let done = 0;
    for (const batch of chunk(todo, batchSize)) {
      try {
        const found = await fetchMany(batch);
        const hits: Array<[string, T | null]> = [];
        const misses: Array<[string, T | null]> = [];
        for (const key of batch) {
          const value = found.has(key) ? (found.get(key) ?? null) : null;
          known.set(key, value);
          (value === null ? misses : hits).push([key, value]);
        }
        if (hits.length) await cache.setMany(NS[step], hits, ttl[step] * DAY);
        if (misses.length) await cache.setMany(NS[step], misses, ttl.misses * DAY);
      } catch (err) {
        errors.push({ step, message: err instanceof Error ? err.message : String(err) });
        pending[step] += todo.length - done;
        break;
      }
      done += batch.length;
      opts.onProgress?.({ step, done, total: todo.length });
    }
    return known;
  }

  // 1. Artist genres (Spotify). Off by default: Spotify stopped returning them to most apps.
  const spotify = opts.spotify;
  const artistIds = uniq(tracks.flatMap((t) => t.artists.map((a) => a.id).filter((id): id is string => Boolean(id))));
  const genres =
    spotify && budget.artists > 0
      ? await lookup<string[]>(
          'artists',
          artistIds,
          async (ids) => {
            const found: Map<string, SpotifyArtist | null> = await spotify.artists(ids);
            return new Map([...found].map(([id, a]) => [id, a ? a.genres : null]));
          },
          20,
        )
      : new Map<string, string[] | null>();

  // 2. Audio features (ReccoBeats).
  const audio = reccobeats
    ? await lookup<AudioFeatures>('audio', uniq(tracks.map((t) => t.id)), (ids) => reccobeats.audioFeatures(ids) as Promise<Map<string, AudioFeatures | null>>, 200)
    : new Map<string, AudioFeatures | null>();

  // 3. Original release years (MusicBrainz, by ISRC).
  const years = musicbrainz
    ? await lookup<number>(
        'years',
        uniq(tracks.map((t) => t.isrc).filter((i): i is string => Boolean(i))),
        async (isrcs) => {
          const out = new Map<string, number | null>();
          for (const isrc of isrcs) out.set(isrc, await musicbrainz.originalYear(isrc));
          return out;
        },
        10,
      )
    : new Map<string, number | null>();

  // 4. Crowd tags (Last.fm) for the song, its album and its artists, each cached on its own.
  const none = new Map<string, Tag[] | null>();
  const byTagKey = new Map(tracks.map((t) => [tagKey(t), t]));
  const songTags = lastfm
    ? await lookup<Tag[]>(
        'tags',
        [...byTagKey.keys()],
        async (keys) => {
          const out = new Map<string, Tag[] | null>();
          for (const key of keys) {
            const t = byTagKey.get(key) as TrackRef;
            const list = mainArtist(t) ? await lastfm.trackTopTags(mainArtist(t), cleanTitle(t.name)) : [];
            out.set(key, list.length ? list.slice(0, 12) : null);
          }
          return out;
        },
        10,
      )
    : none;

  const byAlbumKey = new Map(tracks.filter((t) => t.album.name).map((t) => [albumKey(t), t]));
  const albumTags = lastfm
    ? await lookup<Tag[]>(
        'albumTags',
        [...byAlbumKey.keys()],
        async (keys) => {
          const out = new Map<string, Tag[] | null>();
          for (const key of keys) {
            const t = byAlbumKey.get(key) as TrackRef;
            const list = mainArtist(t) ? await lastfm.albumTopTags(mainArtist(t), cleanAlbum(t.album.name)) : [];
            out.set(key, list.length ? list.slice(0, 12) : null);
          }
          return out;
        },
        10,
      )
    : none;

  // Main artists first, so a tight budget still covers what matters most.
  const artistNames = uniq([...tracks.map(mainArtist), ...tracks.flatMap((t) => t.artists.slice(1).map((a) => a.name))].filter(Boolean)).map((n) => n.toLowerCase());
  const nameOf = new Map(tracks.flatMap((t) => t.artists.map((a) => [a.name.toLowerCase(), a.name] as const)));
  const artistTags = lastfm
    ? await lookup<Tag[]>(
        'artistTags',
        artistNames,
        async (keys) => {
          const out = new Map<string, Tag[] | null>();
          for (const key of keys) {
            const list = await lastfm.artistTopTags(nameOf.get(key) ?? key);
            out.set(key, list.length ? list.slice(0, 12) : null);
          }
          return out;
        },
        10,
      )
    : none;

  const facts = tracks.map((track) => {
    const [main, ...featured] = track.artists;
    return classifyTrack({
      track,
      artistGenres: main?.id ? (genres.get(main.id) ?? []) : [],
      audio: audio.get(track.id) ?? null,
      originalYear: track.isrc ? (years.get(track.isrc) ?? null) : null,
      tags: songTags.get(tagKey(track)) ?? [],
      albumTags: track.album.name ? (albumTags.get(albumKey(track)) ?? []) : [],
      artistTags: main ? (artistTags.get(main.name.toLowerCase()) ?? []) : [],
      featuredTags: mergeTags(featured.map((a) => artistTags.get(a.name.toLowerCase()) ?? [])),
    });
  });

  return { tracks: facts, pending, complete: Object.values(pending).every((n) => n === 0), errors };
}
