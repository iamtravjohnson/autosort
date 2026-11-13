import { retryAfterMs, sleep as realSleep, type FetchLike } from './util.js';

export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  /** Waits longer than this aren't done in-process; the response is returned so the caller can decide. */
  maxDelayMs?: number;
  /** Retry 5xx and network errors too. Turn off for non-idempotent writes. */
  retryServerErrors?: boolean;
  /** Return true to stop retrying a 429 (e.g. a daily quota, not a short rate limit). */
  isFatal429?: (res: Response) => Promise<boolean>;
  sleep?: (ms: number) => Promise<void>;
}

/** fetch with retries for 429 (honoring Retry-After) and, optionally, 5xx/network errors. */
export async function fetchWithRetry(
  fetchFn: FetchLike,
  url: string,
  init: RequestInit | undefined,
  opts: RetryOptions = {},
): Promise<Response> {
  const max = opts.maxRetries ?? 4;
  const base = opts.baseDelayMs ?? 500;
  const cap = opts.maxDelayMs ?? 30_000;
  const retryServer = opts.retryServerErrors ?? true;
  const wait = opts.sleep ?? realSleep;

  for (let attempt = 0; ; attempt++) {
    let res: Response;
    try {
      res = await fetchFn(url, init);
    } catch (err) {
      if (!retryServer || attempt >= max) throw err;
      await wait(Math.min(cap, base * 2 ** attempt));
      continue;
    }
    const retryable = res.status === 429 || (retryServer && res.status >= 500);
    if (!retryable || attempt >= max) return res;
    if (res.status === 429 && opts.isFatal429 && (await opts.isFatal429(res.clone()))) return res;
    const delay = res.status === 429 ? retryAfterMs(res.headers.get('retry-after'), base * 2 ** attempt) : base * 2 ** attempt;
    if (delay > cap) return res;
    await wait(delay);
  }
}

export class HttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export async function readJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
