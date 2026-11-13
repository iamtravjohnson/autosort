import { fetchWithRetry, HttpError, readJson } from '../http.js';
import type { AudioFeatures } from '../types.js';
import { chunk, mapLimit, type FetchLike } from '../util.js';

/** ReccoBeats accepts at most 40 ids per request (41 returns HTTP 400). */
const BATCH = 40;

interface RawFeatures {
  href?: string;
  tempo?: number;
  key?: number;
  mode?: number;
  energy?: number;
  valence?: number;
  danceability?: number;
  acousticness?: number;
  instrumentalness?: number;
  speechiness?: number;
  liveness?: number;
  loudness?: number;
}

export interface ReccoBeatsOptions {
  fetch?: FetchLike;
  baseUrl?: string;
  concurrency?: number;
  maxRetries?: number;
  sleep?: (ms: number) => Promise<void>;
}

/**
 * Audio features (tempo, key, mode, energy, valence…) by Spotify track id, from the free,
 * keyless ReccoBeats API. Spotify closed its own audio-features endpoint to new apps in 2024.
 */
export class ReccoBeatsClient {
  private readonly fetchFn: FetchLike;
  private readonly baseUrl: string;

  constructor(private readonly opts: ReccoBeatsOptions = {}) {
    this.fetchFn = opts.fetch ?? ((input, init) => fetch(input, init));
    this.baseUrl = opts.baseUrl ?? 'https://api.reccobeats.com/v1';
  }

  /** Map of Spotify id → features. Ids ReccoBeats doesn't know are absent from the map. */
  async audioFeatures(spotifyIds: readonly string[]): Promise<Map<string, AudioFeatures>> {
    const out = new Map<string, AudioFeatures>();
    const batches = chunk([...new Set(spotifyIds)], BATCH);
    await mapLimit(batches, this.opts.concurrency ?? 2, async (ids) => {
      const url = `${this.baseUrl}/audio-features?ids=${ids.map(encodeURIComponent).join(',')}`;
      const res = await fetchWithRetry(this.fetchFn, url, { headers: { Accept: 'application/json' } }, {
        maxRetries: this.opts.maxRetries ?? 3,
        ...(this.opts.sleep ? { sleep: this.opts.sleep } : {}),
      });
      const data = (await readJson(res)) as { content?: RawFeatures[] } | null;
      if (!res.ok) throw new HttpError(`ReccoBeats audio-features failed (${res.status})`, res.status, data);
      for (const raw of data?.content ?? []) {
        const id = /\/track\/([A-Za-z0-9]+)/.exec(raw.href ?? '')?.[1];
        if (!id || typeof raw.tempo !== 'number') continue;
        out.set(id, {
          tempo: raw.tempo,
          key: raw.key ?? -1,
          mode: raw.mode ?? 1,
          energy: raw.energy ?? 0,
          valence: raw.valence ?? 0,
          danceability: raw.danceability ?? 0,
          acousticness: raw.acousticness ?? 0,
          instrumentalness: raw.instrumentalness ?? 0,
          speechiness: raw.speechiness ?? 0,
          liveness: raw.liveness ?? 0,
          loudness: raw.loudness ?? 0,
        });
      }
    });
    return out;
  }
}
