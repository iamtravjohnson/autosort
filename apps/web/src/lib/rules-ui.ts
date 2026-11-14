/**
 * Helpers shared by the smart playlist editor, the suggestions picker and the sort view.
 * Safe to import from client components (no server-only imports).
 */
import {
  DEFAULT_SYNC,
  GENRE_BUCKETS,
  GENRE_LABELS,
  MOOD_LABELS,
  THEME_LABELS,
  type Condition,
  type GenreBucket,
  type Mood,
  type OrderSpec,
  type Rule,
  type SyncSettings,
  type Theme,
  type TrackFacts,
} from '@autosort/core';
import { z } from 'zod';
import type { TrackSnapshot } from '@/db/schema';

/* ---------- Tracks sent to the browser ---------- */

/** A source snapshot row minus the fields the editor never reads (keeps the page payload small). */
export type CompactTrack = Omit<TrackSnapshot, 'uri' | 'album' | 'durationMs'>;

export function compactTrack(s: TrackSnapshot): CompactTrack {
  return {
    id: s.id,
    name: s.name,
    artists: s.artists,
    imageUrl: s.imageUrl,
    addedAt: s.addedAt,
    explicit: s.explicit,
    year: s.year,
    decade: s.decade,
    genres: s.genres,
    genreBuckets: s.genreBuckets,
    genreNear: s.genreNear,
    genreReasons: s.genreReasons,
    tags: s.tags,
    moods: s.moods,
    themes: s.themes,
    camelot: s.camelot,
    tempo: s.tempo,
    energy: s.energy,
    valence: s.valence,
    danceability: s.danceability,
  };
}

/** Engine facts from a compact track (mirrors `fromSnapshot` in lib/sync.ts, which is server-only). */
export function factsFromCompact(s: CompactTrack): TrackFacts {
  return {
    id: s.id,
    uri: `spotify:track:${s.id}`,
    name: s.name,
    artists: s.artists.map((name) => ({ id: null, name })),
    album: { name: '', releaseDate: s.year ? String(s.year) : null, releaseDatePrecision: s.year ? 'year' : null, imageUrl: s.imageUrl },
    durationMs: 0,
    explicit: s.explicit,
    isrc: null,
    addedAt: s.addedAt,
    genres: s.genres,
    tags: s.tags,
    genreBuckets: s.genreBuckets as TrackFacts['genreBuckets'],
    genreNear: (s.genreNear ?? []) as TrackFacts['genreNear'],
    genreScores: {},
    genreConfidence: s.genreConfidence ?? 'low',
    genreReasons: s.genreReasons ?? [],
    year: s.year,
    yearSource: s.year ? 'album' : null,
    decade: s.decade,
    audio:
      s.tempo !== null
        ? {
            tempo: s.tempo,
            key: -1,
            mode: 1,
            energy: s.energy ?? 0,
            valence: s.valence ?? 0,
            danceability: s.danceability ?? 0,
            acousticness: 0,
            instrumentalness: 0,
            speechiness: 0,
            liveness: 0,
            loudness: 0,
          }
        : null,
    camelot: s.camelot,
    moods: s.moods as TrackFacts['moods'],
    themes: s.themes as TrackFacts['themes'],
  };
}

/** Merge several sources; a song in more than one keeps its newest "date added" (same as sync). */
export function mergeTracks<T extends { id: string; addedAt: string | null }>(lists: T[][]): T[] {
  const out = new Map<string, T>();
  for (const list of lists) {
    for (const t of list) {
      const prev = out.get(t.id);
      if (!prev || (t.addedAt ?? '') > (prev.addedAt ?? '')) out.set(t.id, t);
    }
  }
  return [...out.values()];
}

/* ---------- Validation ---------- */

export const trackIdSchema = z.string().regex(/^[A-Za-z0-9]{1,64}$/);
export const trackUriSchema = z.string().regex(/^spotify:track:[A-Za-z0-9]{1,64}$/);
export const playlistIdSchema = z.string().regex(/^[A-Za-z0-9]{1,64}$/);

const sortField = z.enum(['addedAt', 'bpm', 'energy', 'valence', 'danceability', 'acousticness', 'year', 'releaseDate', 'artist', 'title', 'album', 'duration', 'camelot']);
const direction = z.enum(['asc', 'desc']).optional();

/** Mirrors the engine's `OrderSpec`. */
export const orderSchema: z.ZodType<OrderSpec> = z.union([
  z.object({ by: sortField, direction, then: z.object({ by: sortField, direction }).optional() }),
  z.object({ by: z.literal('harmonic'), startKey: z.string().max(3).optional(), bpmTolerance: z.number().min(1).max(40).optional() }),
  z.object({ by: z.literal('energyArc'), shape: z.enum(['mountain', 'build', 'windDown']) }),
  z.object({ by: z.literal('shuffle'), seed: z.number().optional() }),
]);

export const syncSchema = z.object({ addNew: z.boolean(), removeMissing: z.boolean(), keepManualAdds: z.boolean() }).partial();

export function fullSync(sync: Partial<SyncSettings> | null | undefined): SyncSettings {
  return { ...DEFAULT_SYNC, ...sync };
}

/* ---------- Action results and Spotify errors ---------- */

export type ActionResult = { ok: true; message?: string; href?: string } | { ok: false; error: string; reconnect?: boolean };
export type ActionError = Extract<ActionResult, { ok: false }>;

/** Turn an error from Spotify (or the token store) into a friendly message. Duck-typed so it's client-safe. */
export function spotifyErrorResult(err: unknown, opts: { forbidden?: string; prefix?: string } = {}): ActionError {
  const e = (err ?? {}) as { name?: string; status?: number; message?: string };
  const prefix = opts.prefix ? `${opts.prefix} ` : '';
  if (e.name === 'ReconnectNeeded') return { ok: false, reconnect: true, error: `${prefix}Spotify signed you out of AutoSort.` };
  if (e.status === 403)
    return { ok: false, error: `${prefix}${opts.forbidden ?? "Spotify says you're not on this AutoSort's Spotify user list yet. Ask the owner to add you."}` };
  if (e.status === 429) return { ok: false, error: `${prefix}Spotify asked us to slow down. Try again in a minute.` };
  if (e.status === 404) return { ok: false, error: `${prefix}Spotify couldn't find that playlist. It may have been deleted.` };
  return { ok: false, error: `${prefix}Something went wrong talking to Spotify. Try again in a minute.` };
}

/** Friendly text for a stored `lastError` string (e.g. "Spotify POST /me/playlists failed (403): …"). */
export function friendlyLastError(message: string | null | undefined): string | null {
  if (!message) return null;
  if (/\(403\)/.test(message)) return "Spotify said you're not on this AutoSort's Spotify user list.";
  if (/\(429\)/.test(message)) return 'Spotify asked us to slow down. It will try again at the next sync.';
  if (/\(404\)/.test(message)) return 'Spotify couldn\'t find the playlist. It may have been deleted in Spotify.';
  if (/reconnect/i.test(message)) return 'Spotify signed you out. Reconnect to keep syncing.';
  return 'The last sync hit a problem. It will try again at the next sync.';
}

/* ---------- Rules builder vocabulary ---------- */

export type FieldKey = Condition['field'];

export const FIELD_LABELS: Record<FieldKey, string> = {
  genre: 'Genre',
  decade: 'Decade',
  year: 'Release year',
  explicit: 'Clean or explicit',
  mood: 'Mood',
  theme: 'Theme',
  tag: 'Tag',
  bpm: 'BPM',
  energy: 'Energy',
  valence: 'Positivity',
  danceability: 'Danceability',
  acousticness: 'Acoustic',
  camelot: 'Camelot key',
  artist: 'Artist',
  addedAt: 'Added to source',
};

/** Order of the "Add rule" buttons. */
export const ADDABLE_FIELDS: FieldKey[] = ['genre', 'decade', 'year', 'explicit', 'mood', 'theme', 'bpm', 'energy', 'valence', 'danceability', 'camelot', 'artist', 'addedAt', 'tag', 'acousticness'];

/** Fields stored on the engine's 0–1 scale and shown as percentages. */
export const PERCENT_FIELDS = new Set<FieldKey>(['energy', 'valence', 'danceability', 'acousticness']);

export const DECADES = [1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020];

export function decadeName(d: number): string {
  return d >= 2000 ? `${d}s` : `${String(d).slice(2)}s`;
}

export const CAMELOT_KEYS: string[] = Array.from({ length: 12 }, (_, i) => [`${i + 1}A`, `${i + 1}B`]).flat();

export function genreLabel(value: string): string {
  return (GENRE_BUCKETS as readonly string[]).includes(value) ? GENRE_LABELS[value as GenreBucket] : value;
}

/** "Rap" → "hip-hop", "country" → "country", "americana" → "americana" (free text stays lowercase). */
export function genreValue(input: string): string {
  const v = input.trim().toLowerCase();
  const bucket = (GENRE_BUCKETS as readonly GenreBucket[]).find((b) => b === v || GENRE_LABELS[b].toLowerCase() === v);
  return bucket ?? v;
}

export const moodLabel = (m: string) => MOOD_LABELS[m as Mood] ?? m;
export const themeLabel = (t: string) => THEME_LABELS[t as Theme] ?? t;

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
}

/** A sensible starting value for a newly added rule row. */
export function defaultCondition(field: FieldKey): Condition {
  switch (field) {
    case 'genre':
    case 'tag':
    case 'artist':
      return { field, in: [] };
    case 'mood':
      return { field, in: [] };
    case 'theme':
      return { field, in: [] };
    case 'decade':
      return { field, in: [] };
    case 'year':
      return { field, min: 1990, max: 1999 };
    case 'explicit':
      return { field, is: false };
    case 'bpm':
      return { field, min: 120, max: 150 };
    case 'energy':
      return { field, min: 0.7 };
    case 'valence':
      return { field, min: 0.6 };
    case 'danceability':
      return { field, min: 0.7 };
    case 'acousticness':
      return { field, min: 0.5 };
    case 'camelot':
      return { field, in: [] };
    case 'addedAt':
      return { field, after: isoDaysAgo(30) };
  }
}

export const isGroup = (c: Condition | Rule): c is Rule => 'match' in c;

/* ---------- Order presets for the editor ---------- */

export type OrderChoice = 'newest' | 'bpm' | 'energyArc' | 'harmonic' | 'year' | 'custom';

export function orderChoice(o: OrderSpec): OrderChoice {
  if (o.by === 'addedAt' && (o.direction ?? 'desc') === 'desc' && !o.then) return 'newest';
  if (o.by === 'bpm' && !o.then) return 'bpm';
  if (o.by === 'energyArc') return 'energyArc';
  if (o.by === 'harmonic') return 'harmonic';
  if (o.by === 'year' && !o.then) return 'year';
  return 'custom';
}

export const ORDER_DEFAULTS: Record<Exclude<OrderChoice, 'custom'>, OrderSpec> = {
  newest: { by: 'addedAt', direction: 'desc' },
  bpm: { by: 'bpm', direction: 'asc' },
  energyArc: { by: 'energyArc', shape: 'mountain' },
  harmonic: { by: 'harmonic', bpmTolerance: 8 },
  year: { by: 'year', direction: 'asc' },
};

/** Short label for an order, e.g. "Newest added first". */
export function orderLabel(o: OrderSpec): string {
  switch (o.by) {
    case 'addedAt':
      return (o.direction ?? 'desc') === 'desc' ? 'Newest added first' : 'Oldest added first';
    case 'bpm':
      return (o.direction ?? 'asc') === 'asc' ? 'BPM, slowest first' : 'BPM, fastest first';
    case 'energyArc':
      return o.shape === 'mountain' ? 'Energy arc: warm-up, peak, cool-down' : o.shape === 'build' ? 'Energy arc: build-up' : 'Energy arc: wind down';
    case 'harmonic':
      return 'Harmonic flow';
    case 'year':
      return (o.direction ?? 'asc') === 'asc' ? 'Release year, oldest first' : 'Release year, newest first';
    case 'shuffle':
      return 'Shuffled';
    default:
      return `By ${o.by}`;
  }
}

/* ---------- Small utilities ---------- */

/** JSON with sorted keys, for comparing drafts. */
export function stableJson(value: unknown): string {
  if (value === undefined) return 'null';
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableJson(v)}`).join(',')}}`;
}

/** Pull the two hex stops out of `coverGradient()` so headers can tint to match the cover. */
export function coverStops(gradient: string): [string, string] {
  const hex = gradient.match(/#[0-9a-fA-F]{6}/g) ?? [];
  return [hex[0] ?? '#8B5CF6', hex[1] ?? '#1E1B4B'];
}

export function spotifyPlaylistUrl(id: string): string {
  return `https://open.spotify.com/playlist/${encodeURIComponent(id)}`;
}

export function spotifyTrackUrl(id: string): string {
  return `https://open.spotify.com/track/${encodeURIComponent(id)}`;
}

/** "Mar 2, 2024" style date for track tables. */
export function shortDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

/** Does the rule (or any group inside it) filter by genre? */
export function ruleUsesGenre(rule: Rule): boolean {
  return rule.conditions.some((c) => ('match' in c ? ruleUsesGenre(c) : c.field === 'genre'));
}
