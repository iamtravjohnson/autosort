import type { NextRequest } from 'next/server';
import { camelotToKeyName, camelotToOpenKey, DEFAULT_USER_AGENT, toCamelot } from '@autosort/core';
import { parseTrackInput, type TrackLookup, type TrackLookupError } from '@/components/camelot/track';

/**
 * GET /api/track?id=<Spotify track id or open.spotify.com/track/… link>
 *
 * Looks up one track's tempo, key and energy from ReccoBeats (free, keyless), adds the Camelot
 * and Open Key codes with the same helpers the AutoSort engine uses, and returns it as JSON.
 * The query is never logged. Reading the request makes this handler run at request time
 * under Cache Components; successful responses are cached at the edge for a day.
 */

const RECCOBEATS = 'https://api.reccobeats.com/v1';
const TIMEOUT_MS = 8000;

interface RawTrack {
  trackTitle?: string;
  artists?: Array<{ name?: string }>;
  durationMs?: number;
}

interface RawFeatures {
  tempo?: number;
  key?: number;
  mode?: number;
  energy?: number;
  valence?: number;
  danceability?: number;
}

class UpstreamError extends Error {
  constructor(readonly status: number) {
    super(`ReccoBeats responded ${status}`);
  }
}

function reply(body: TrackLookup | TrackLookupError, status: number, cacheControl: string) {
  return Response.json(body, { status, headers: { 'Cache-Control': cacheControl } });
}

async function firstContent<T>(path: string): Promise<T | null> {
  const res = await fetch(`${RECCOBEATS}${path}`, {
    headers: { Accept: 'application/json', 'User-Agent': DEFAULT_USER_AGENT },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new UpstreamError(res.status);
  const data = (await res.json()) as { content?: T[] } | null;
  return data?.content?.[0] ?? null;
}

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

export async function GET(request: NextRequest) {
  const parsed = parseTrackInput(request.nextUrl.searchParams.get('id') ?? '');
  if (!parsed.ok) return reply({ error: parsed.message }, 400, 'public, s-maxage=86400');
  const { id } = parsed;

  let track: RawTrack | null;
  let features: RawFeatures | null;
  try {
    [track, features] = await Promise.all([
      firstContent<RawTrack>(`/track?ids=${id}`),
      firstContent<RawFeatures>(`/audio-features?ids=${id}`),
    ]);
  } catch (err) {
    const busy = err instanceof UpstreamError && err.status === 429;
    return reply(
      {
        error: busy
          ? 'The audio data service is busy right now. Try again in a minute.'
          : 'We couldn’t reach the audio data service. Try again in a minute.',
      },
      busy ? 503 : 502,
      'no-store',
    );
  }

  const tempo = num(features?.tempo);
  if (!features || tempo === null) {
    return reply(
      {
        error: track
          ? 'ReccoBeats knows this song but doesn’t have its tempo and key yet. Try another song.'
          : 'ReccoBeats doesn’t have this song yet. Check the link, or try another song.',
      },
      404,
      'public, s-maxage=3600',
    );
  }

  const key = num(features.key) ?? -1;
  const mode = num(features.mode);
  const camelot = key >= 0 && mode !== null ? toCamelot(key, mode) : null;

  const body: TrackLookup = {
    id,
    title: track?.trackTitle?.trim() || null,
    artists: (track?.artists ?? []).map((a) => a.name?.trim() ?? '').filter(Boolean),
    durationMs: num(track?.durationMs),
    tempo,
    key,
    mode,
    camelot,
    keyName: camelot ? camelotToKeyName(camelot) : null,
    openKey: camelot ? camelotToOpenKey(camelot) : null,
    energy: num(features.energy),
    valence: num(features.valence),
    danceability: num(features.danceability),
    spotifyUrl: `https://open.spotify.com/track/${id}`,
  };
  return reply(body, 200, 'public, s-maxage=86400');
}
