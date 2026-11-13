import { yearFromDate } from '../classify.js';
import { fetchWithRetry, HttpError, readJson } from '../http.js';
import { sleep as realSleep, type FetchLike } from '../util.js';
import { DEFAULT_USER_AGENT } from '../version.js';

export interface MusicBrainzOptions {
  /** MusicBrainz asks for "AppName/version ( contact-url-or-email )". */
  userAgent?: string;
  fetch?: FetchLike;
  baseUrl?: string;
  /** MusicBrainz allows one request per second. Default 1100 ms. */
  minIntervalMs?: number;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
}

interface RawRecording {
  score?: number;
  'first-release-date'?: string;
}

/**
 * Original release year by ISRC. Fixes songs whose Spotify album is a later compilation
 * or remaster (a 1994 song on a 2015 "Greatest Hits" album).
 */
export class MusicBrainzClient {
  private readonly fetchFn: FetchLike;
  private readonly baseUrl: string;
  private queue: Promise<unknown> = Promise.resolve();
  private nextAt = 0;

  constructor(private readonly opts: MusicBrainzOptions = {}) {
    this.fetchFn = opts.fetch ?? ((input, init) => fetch(input, init));
    this.baseUrl = opts.baseUrl ?? 'https://musicbrainz.org/ws/2';
  }

  /** Calls are serialized and spaced to respect the rate limit. */
  private throttled<T>(fn: () => Promise<T>): Promise<T> {
    const run = async () => {
      const now = (this.opts.now ?? Date.now)();
      const wait = this.nextAt - now;
      if (wait > 0) await (this.opts.sleep ?? realSleep)(wait);
      this.nextAt = (this.opts.now ?? Date.now)() + (this.opts.minIntervalMs ?? 1100);
      return fn();
    };
    const result = this.queue.then(run, run);
    this.queue = result.catch(() => undefined);
    return result;
  }

  async originalYear(isrc: string): Promise<number | null> {
    return this.throttled(async () => {
      const url = `${this.baseUrl}/recording?query=${encodeURIComponent(`isrc:${isrc}`)}&fmt=json&limit=10`;
      const res = await fetchWithRetry(
        this.fetchFn,
        url,
        { headers: { Accept: 'application/json', 'User-Agent': this.opts.userAgent ?? DEFAULT_USER_AGENT } },
        { maxRetries: 2, baseDelayMs: 1500, ...(this.opts.sleep ? { sleep: this.opts.sleep } : {}) },
      );
      const data = (await readJson(res)) as { recordings?: RawRecording[] } | null;
      if (!res.ok) throw new HttpError(`MusicBrainz lookup failed (${res.status})`, res.status, data);
      const years = (data?.recordings ?? [])
        .filter((r) => (r.score ?? 0) >= 90)
        .map((r) => yearFromDate(r['first-release-date']))
        .filter((y): y is number => y !== null);
      return years.length ? Math.min(...years) : null;
    });
  }
}
