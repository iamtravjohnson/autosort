/** Shared by the /api/track route handler and the BPM & key finder form. */

/** What GET /api/track returns on success. */
export interface TrackLookup {
  id: string;
  title: string | null;
  artists: string[];
  durationMs: number | null;
  /** Beats per minute. */
  tempo: number;
  /** Pitch class 0 = C … 11 = B; -1 when unknown. */
  key: number;
  /** 1 = major, 0 = minor; null when unknown. */
  mode: number | null;
  /** Camelot code, e.g. "8A"; null when the key is unknown. */
  camelot: string | null;
  keyName: string | null;
  openKey: string | null;
  /** 0–1 */
  energy: number | null;
  valence: number | null;
  danceability: number | null;
  spotifyUrl: string;
}

/** What GET /api/track returns on an error. */
export interface TrackLookupError {
  error: string;
}

export const EXAMPLE_TRACK_URL = 'https://open.spotify.com/track/003vvx7Niy0yvhvHt4a68B';

const TRACK_ID = /^[A-Za-z0-9]{22}$/;
const MAX_INPUT = 512;

export type TrackInput = { ok: true; id: string } | { ok: false; message: string };

/**
 * Read a Spotify track id from a pasted link, a `spotify:track:` URI or a bare 22-character id,
 * with a friendly message when the input isn't a track link.
 */
export function parseTrackInput(input: string): TrackInput {
  const s = input.trim();
  if (!s) return { ok: false, message: 'Paste a Spotify track link first.' };
  const notTrack = {
    ok: false as const,
    message: 'That doesn’t look like a Spotify track link. It should look like https://open.spotify.com/track/…',
  };
  if (s.length > MAX_INPUT) return notTrack;
  if (TRACK_ID.test(s)) return { ok: true, id: s };

  const uri = /^spotify:(track|album|playlist|artist|episode|show):([A-Za-z0-9]{22})$/i.exec(s);
  if (uri) return uri[1].toLowerCase() === 'track' ? { ok: true, id: uri[2] } : wrongKind(uri[1].toLowerCase());

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
  } catch {
    return notTrack;
  }
  const host = url.hostname.toLowerCase();
  if (host === 'spotify.link' || host.endsWith('.app.link')) {
    return {
      ok: false,
      message: 'Short share links can’t be read here. Open the song in Spotify, copy its full open.spotify.com link and paste that.',
    };
  }
  if (host !== 'open.spotify.com' && host !== 'play.spotify.com') return notTrack;

  const m = /^\/(?:intl-[\w-]+\/)?(?:embed\/)?(track|album|playlist|artist|episode|show)\/([A-Za-z0-9]{22})\/?$/i.exec(url.pathname);
  if (!m) return notTrack;
  return m[1].toLowerCase() === 'track' ? { ok: true, id: m[2] } : wrongKind(m[1].toLowerCase());
}

function wrongKind(kind: string): TrackInput {
  const noun = kind === 'show' ? 'podcast' : kind === 'episode' ? 'podcast episode' : kind;
  return { ok: false, message: `That’s a Spotify ${noun} link. Paste a link to a single song instead.` };
}
