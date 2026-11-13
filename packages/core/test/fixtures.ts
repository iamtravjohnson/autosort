import { classifyTrack, type AudioFeatures, type Tag, type TrackFacts, type TrackRef } from '../src/index.js';

let n = 0;

export function ref(over: Partial<TrackRef> & { artist?: string } = {}): TrackRef {
  n++;
  const { artist, ...rest } = over;
  const id = rest.id ?? `t${n}`;
  return {
    id,
    uri: `spotify:track:${id}`,
    name: `Song ${n}`,
    artists: [{ id: `a-${artist ?? n}`, name: artist ?? `Artist ${n}` }],
    album: { name: 'Album', releaseDate: '2020-05-01', releaseDatePrecision: 'day', imageUrl: null },
    durationMs: 200_000,
    explicit: false,
    isrc: null,
    addedAt: '2024-01-01T00:00:00Z',
    ...rest,
  };
}

export const audio = (over: Partial<AudioFeatures> = {}): AudioFeatures => ({
  tempo: 120,
  key: 0,
  mode: 1,
  energy: 0.5,
  valence: 0.5,
  danceability: 0.5,
  acousticness: 0.2,
  instrumentalness: 0,
  speechiness: 0.05,
  liveness: 0.1,
  loudness: -6,
  ...over,
});

export function facts(
  opts: {
    genres?: string[];
    audio?: Partial<AudioFeatures> | null;
    releaseDate?: string;
    originalYear?: number;
    tags?: Array<string | Tag>;
    explicit?: boolean;
    name?: string;
    addedAt?: string;
    id?: string;
  } = {},
): TrackFacts {
  const track = ref({
    ...(opts.id ? { id: opts.id } : {}),
    ...(opts.name ? { name: opts.name } : {}),
    ...(opts.addedAt ? { addedAt: opts.addedAt } : {}),
    explicit: opts.explicit ?? false,
    album: { name: 'Album', releaseDate: opts.releaseDate ?? '2020-05-01', releaseDatePrecision: 'day', imageUrl: null },
  });
  return classifyTrack({
    track,
    artistGenres: opts.genres ?? [],
    audio: opts.audio === null ? null : opts.audio ? audio(opts.audio) : null,
    originalYear: opts.originalYear ?? null,
    tags: (opts.tags ?? []).map((t) => (typeof t === 'string' ? { name: t, count: 100 } : t)),
  });
}

/** A fake fetch that answers from a list of handlers and records calls. */
export function fakeFetch(handler: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fn = async (url: string, init?: RequestInit) => {
    calls.push({ url, ...(init ? { init } : {}) });
    return handler(url, init);
  };
  return { fetch: fn, calls };
}

export const json = (body: unknown, status = 200, headers: Record<string, string> = {}): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });

export const noSleep = async () => {};
