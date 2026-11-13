import { fetchWithRetry, HttpError, readJson } from '../http.js';
import type { Tag } from '../types.js';
import type { FetchLike } from '../util.js';

export interface LastfmOptions {
  /** Free key from https://www.last.fm/api/account/create */
  apiKey: string;
  fetch?: FetchLike;
  baseUrl?: string;
  maxRetries?: number;
  sleep?: (ms: number) => Promise<void>;
}

/** Last.fm error 6 = "track/artist not found". */
const NOT_FOUND = 6;

interface RawTag {
  name?: string;
  count?: number | string;
}

/** Crowd tags ("love songs", "worship", "sad", "90s country") from Last.fm. */
export class LastfmClient {
  private readonly fetchFn: FetchLike;
  private readonly baseUrl: string;

  constructor(private readonly opts: LastfmOptions) {
    this.fetchFn = opts.fetch ?? ((input, init) => fetch(input, init));
    this.baseUrl = opts.baseUrl ?? 'https://ws.audioscrobbler.com/2.0/';
  }

  private async topTags(params: Record<string, string>): Promise<Tag[]> {
    const query = new URLSearchParams({ ...params, api_key: this.opts.apiKey, format: 'json', autocorrect: '1' });
    const res = await fetchWithRetry(this.fetchFn, `${this.baseUrl}?${query}`, undefined, {
      maxRetries: this.opts.maxRetries ?? 3,
      ...(this.opts.sleep ? { sleep: this.opts.sleep } : {}),
    });
    const data = (await readJson(res)) as { error?: number; message?: string; toptags?: { tag?: RawTag | RawTag[] } } | null;
    if (data?.error === NOT_FOUND) return [];
    if (!res.ok || data?.error) throw new HttpError(`Last.fm ${params.method} failed: ${data?.message ?? res.status}`, res.status, data);
    const raw = data?.toptags?.tag;
    const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
    return list
      .map((t) => ({ name: String(t.name ?? '').trim(), count: Number(t.count ?? 0) }))
      .filter((t) => t.name && Number.isFinite(t.count));
  }

  trackTopTags(artist: string, track: string): Promise<Tag[]> {
    return this.topTags({ method: 'track.gettoptags', artist, track });
  }

  artistTopTags(artist: string): Promise<Tag[]> {
    return this.topTags({ method: 'artist.gettoptags', artist });
  }
}
