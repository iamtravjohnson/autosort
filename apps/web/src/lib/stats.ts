import 'server-only';
import { GENRE_LABELS, MOOD_LABELS, SpotifyApiError, matchesRule, type GenreBucket, type Mood } from '@autosort/core';
import type { SmartPlaylist, Source, TrackSnapshot } from '@/db/schema';
import { ReconnectNeeded } from './spotify';
import { fromSnapshot } from './sync';

/* ---------- Action results ---------- */

/** What a server action hands back to its form: a message, and whether to offer "Reconnect Spotify". */
export interface ActionState {
  ok?: boolean;
  message?: string;
  reconnect?: boolean;
  /** A link to show with the message, e.g. a source that was added but not read yet. */
  href?: string;
  hrefLabel?: string;
  /** A source that was just added; the page analyzes it next (with live progress). */
  sourceId?: string;
}

/** Turn a Spotify (or any) error into short, friendly copy. */
export function friendlyError(err: unknown): ActionState {
  if (err instanceof ReconnectNeeded) return { message: 'Spotify signed you out.', reconnect: true };
  if (err instanceof SpotifyApiError) {
    if (err.status === 401) return { message: 'Spotify signed you out.', reconnect: true };
    if (err.status === 403) return { message: "Spotify says you're not on this AutoSort's Spotify user list. Ask the owner to add you." };
    if (err.status === 429) return { message: 'Spotify asked us to slow down, try again in a minute.' };
    if (err.status === 404) return { message: "Spotify couldn't find that playlist. It may have been deleted." };
    return { message: `Spotify had a problem (error ${err.status}). Try again in a minute.` };
  }
  const text = err instanceof Error ? err.message : String(err);
  if (/\(403\)/.test(text)) return { message: "Spotify says you're not on this AutoSort's Spotify user list. Ask the owner to add you." };
  if (/\(429\)/.test(text)) return { message: 'Spotify asked us to slow down, try again in a minute.' };
  return { message: `Something went wrong: ${text.slice(0, 160)}` };
}

/** Friendly copy for an error message string saved on a run or playlist. */
export function friendlyErrorText(text: string): string {
  if (/reconnect/i.test(text) || /\(401\)/.test(text)) return 'Spotify signed you out. Reconnect to keep syncing.';
  if (/\(403\)/.test(text)) return "Spotify said no (403): you may not be on this AutoSort's Spotify user list.";
  if (/\(429\)/.test(text)) return 'Spotify asked us to slow down. It will try again on the next sync.';
  if (/\(404\)/.test(text)) return 'Spotify couldn’t find this playlist. It may have been deleted.';
  return text.length > 180 ? `${text.slice(0, 177)}…` : text;
}

/* ---------- Time helpers (kept out of components so render stays pure) ---------- */

const DAY_MS = 86_400_000;

export function isWithinDay(date: Date | null | undefined): boolean {
  return Boolean(date && Date.now() - date.getTime() < DAY_MS);
}

export function olderThanDays(date: Date, days: number): boolean {
  return Date.now() - date.getTime() > days * DAY_MS;
}

/* ---------- Matching ---------- */

/** Smart playlists that read from this source. */
export function playlistsFeeding(sourceId: string, playlists: readonly SmartPlaylist[]): SmartPlaylist[] {
  return playlists.filter((p) => p.sourceIds.includes(sourceId));
}

/** Snapshot tracks that land in none of the smart playlists fed by this source. */
export function unmatchedTracks(source: Source, playlists: readonly SmartPlaylist[]): TrackSnapshot[] {
  const feeding = playlistsFeeding(source.id, playlists);
  return (source.snapshot ?? []).filter((s) => {
    const facts = fromSnapshot(s);
    return !feeding.some((p) => !p.exclude.includes(s.id) && (p.include.includes(s.id) || matchesRule(facts, p.rule)));
  });
}

/** Songs added to a source in the last 7 days. */
export function addedThisWeek(snapshot: readonly TrackSnapshot[] | null | undefined): number {
  const weekAgo = Date.now() - 7 * DAY_MS;
  return (snapshot ?? []).filter((t) => t.addedAt && Date.parse(t.addedAt) >= weekAgo).length;
}

/** Songs filed today across these playlists (from their last sync). */
export function filedToday(playlists: readonly SmartPlaylist[]): number {
  return playlists.reduce((n, p) => n + (isWithinDay(p.lastSyncedAt) ? (p.lastAddedCount ?? 0) : 0), 0);
}

/* ---------- Palettes (INVENTORY §1.3) ---------- */

/** Genre palette: fixed order, never cycled. */
export const GENRE_PALETTE: Array<{ bucket: GenreBucket; label: string; color: string }> = [
  { bucket: 'country', label: 'Country', color: '#D97706' },
  { bucket: 'hip-hop', label: 'Hip-hop', color: '#0284C7' },
  { bucket: 'pop', label: 'Pop', color: '#DB2777' },
  { bucket: 'r&b', label: 'R&B', color: '#7C3AED' },
  { bucket: 'worship', label: 'Worship', color: '#0D9488' },
  { bucket: 'rock', label: 'Rock', color: '#DC2626' },
];
export const OTHER_GENRE_COLOR = '#52525B';
export const EXPLICIT_COLOR = '#71717A';

export type Quadrant = 'happy' | 'intense' | 'chill' | 'sad';
export const QUADRANTS: Record<Quadrant, { label: string; color: string; where: string }> = {
  happy: { label: 'Happy', color: '#D97706', where: 'happier, higher energy' },
  intense: { label: 'Intense', color: '#DB2777', where: 'darker, higher energy' },
  chill: { label: 'Chill', color: '#0284C7', where: 'happier, lower energy' },
  sad: { label: 'Sad', color: '#7C3AED', where: 'darker, lower energy' },
};

export function quadrantOf(energy: number, valence: number): Quadrant {
  if (energy >= 0.5) return valence >= 0.5 ? 'happy' : 'intense';
  return valence >= 0.5 ? 'chill' : 'sad';
}

export function moodLabel(t: TrackSnapshot): string {
  const m = t.moods[0] as Mood | undefined;
  if (m) return MOOD_LABELS[m] ?? m;
  if (t.energy !== null && t.valence !== null) return QUADRANTS[quadrantOf(t.energy, t.valence)].label;
  return '—';
}

/** Short genre text for a track: its strongest raw genres or tags. */
export function genreText(t: TrackSnapshot): string | null {
  const list = t.genres.length ? t.genres : t.tags;
  if (list.length) return list.slice(0, 3).join(', ');
  if (t.genreBuckets.length) return t.genreBuckets.map((b) => GENRE_LABELS[b as GenreBucket] ?? b).join(', ');
  return null;
}

export function decadeShort(decade: number, full: boolean): string {
  return full ? `${decade}s` : `${String(decade).slice(2)}s`;
}

/* ---------- Source stats ---------- */

export interface GenreSlice {
  key: string;
  label: string;
  color: string;
  count: number;
}

export interface SourceStats {
  songs: number;
  totalMs: number;
  addedThisWeek: number;
  genresFound: number;
  yearMin: number | null;
  yearMax: number | null;
  withAudio: number;
  withKey: number;
  withYear: number;
  genres: GenreSlice[];
  /** Every bucket, for the table (a song can be in more than one). */
  genreTable: Array<{ label: string; count: number }>;
  noGenre: number;
  decades: Array<{ decade: number; label: string; count: number }>;
  mood: {
    points: Array<{ energy: number; valence: number; q: Quadrant; name: string }>;
    counts: Record<Quadrant, number>;
    total: number;
    /** Each dot stands for about this many songs. */
    every: number;
  };
  keys: Record<string, number>;
  topKey: { code: string; count: number } | null;
  addedPerYear: Array<{ year: number; count: number }>;
  clean: number;
  explicit: number;
}

const MAX_DOTS = 240;

export function sourceStats(snapshot: readonly TrackSnapshot[]): SourceStats {
  const now = Date.now();
  const weekAgo = now - 7 * DAY_MS;
  const named = new Set<string>(GENRE_PALETTE.map((g) => g.bucket));
  const primary = new Map<string, number>();
  const bucketCounts = new Map<string, number>();
  const decades = new Map<number, number>();
  const keys: Record<string, number> = {};
  const added = new Map<number, number>();
  const counts: Record<Quadrant, number> = { happy: 0, intense: 0, chill: 0, sad: 0 };
  const withMood: TrackSnapshot[] = [];
  let totalMs = 0;
  let weekCount = 0;
  let withAudio = 0;
  let withKey = 0;
  let withYear = 0;
  let noGenre = 0;
  let explicit = 0;
  let yearMin: number | null = null;
  let yearMax: number | null = null;

  for (const t of snapshot) {
    totalMs += t.durationMs;
    if (t.explicit) explicit++;
    const addedMs = t.addedAt ? Date.parse(t.addedAt) : NaN;
    if (!Number.isNaN(addedMs)) {
      if (addedMs >= weekAgo) weekCount++;
      const y = new Date(addedMs).getUTCFullYear();
      added.set(y, (added.get(y) ?? 0) + 1);
    }
    if (t.tempo !== null) withAudio++;
    if (t.camelot) {
      withKey++;
      keys[t.camelot] = (keys[t.camelot] ?? 0) + 1;
    }
    if (t.year !== null) {
      withYear++;
      yearMin = yearMin === null ? t.year : Math.min(yearMin, t.year);
      yearMax = yearMax === null ? t.year : Math.max(yearMax, t.year);
    }
    if (t.decade !== null) decades.set(t.decade, (decades.get(t.decade) ?? 0) + 1);
    if (t.genreBuckets.length === 0) noGenre++;
    else {
      for (const b of t.genreBuckets) bucketCounts.set(b, (bucketCounts.get(b) ?? 0) + 1);
      const p = t.genreBuckets.find((b) => named.has(b)) ?? 'other';
      primary.set(p, (primary.get(p) ?? 0) + 1);
    }
    if (t.energy !== null && t.valence !== null) {
      counts[quadrantOf(t.energy, t.valence)]++;
      withMood.push(t);
    }
  }

  const genres: GenreSlice[] = GENRE_PALETTE.filter((g) => primary.get(g.bucket)).map((g) => ({
    key: g.bucket,
    label: g.label,
    color: g.color,
    count: primary.get(g.bucket) ?? 0,
  }));
  if (primary.get('other')) genres.push({ key: 'other', label: 'Other', color: OTHER_GENRE_COLOR, count: primary.get('other') ?? 0 });

  const genreTable = [...bucketCounts]
    .map(([b, count]) => ({ label: GENRE_LABELS[b as GenreBucket] ?? b, count }))
    .sort((a, b) => b.count - a.count);

  const decadeKeys = [...decades.keys()].sort((a, b) => a - b);
  const full = decadeKeys.some((d) => d < 1950);
  const decadeRows: SourceStats['decades'] = [];
  if (decadeKeys.length) {
    for (let d = decadeKeys[0]!; d <= decadeKeys[decadeKeys.length - 1]!; d += 10) {
      decadeRows.push({ decade: d, label: decadeShort(d, full), count: decades.get(d) ?? 0 });
    }
  }

  const every = Math.max(1, Math.ceil(withMood.length / MAX_DOTS));
  const points = withMood
    .filter((_, i) => i % every === 0)
    .map((t) => ({ energy: t.energy ?? 0, valence: t.valence ?? 0, q: quadrantOf(t.energy ?? 0, t.valence ?? 0), name: `${t.name} · ${t.artists[0] ?? ''}` }));

  const topKeyEntry = Object.entries(keys).sort((a, b) => b[1] - a[1])[0];

  const years = [...added.keys()].sort((a, b) => a - b);
  const addedPerYear: SourceStats['addedPerYear'] = [];
  if (years.length) for (let y = years[0]!; y <= years[years.length - 1]!; y++) addedPerYear.push({ year: y, count: added.get(y) ?? 0 });

  return {
    songs: snapshot.length,
    totalMs,
    addedThisWeek: weekCount,
    genresFound: bucketCounts.size,
    yearMin,
    yearMax,
    withAudio,
    withKey,
    withYear,
    genres,
    genreTable,
    noGenre,
    decades: decadeRows,
    mood: { points, counts, total: withMood.length, every },
    keys,
    topKey: topKeyEntry ? { code: topKeyEntry[0], count: topKeyEntry[1] } : null,
    addedPerYear,
    clean: snapshot.length - explicit,
    explicit,
  };
}

/** "still looking up tempo and key for 1,200 songs and release years for 300" (or null). */
export function pendingText(pending: Record<string, number> | null | undefined): string | null {
  if (!pending) return null;
  const n = (k: string) => pending[k] ?? 0;
  const parts: string[] = [];
  if (n('audio')) parts.push(`tempo and key for ${n('audio').toLocaleString('en-US')} songs`);
  if (n('years')) parts.push(`release years for ${n('years').toLocaleString('en-US')} songs`);
  if (n('artists')) parts.push(`genres for ${n('artists').toLocaleString('en-US')} artists`);
  if (n('tags')) parts.push(`tags for ${n('tags').toLocaleString('en-US')} songs`);
  if (!parts.length) return null;
  const list = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
  return `Still looking up ${list}. Refresh the analysis later to fill them in.`;
}

/** Up to 4 distinct album images from a snapshot, for a source mosaic. */
export function mosaicImages(source: Source): string[] {
  if (source.imageUrl) return [source.imageUrl];
  const out: string[] = [];
  for (const t of source.snapshot ?? []) {
    if (t.imageUrl && !out.includes(t.imageUrl)) out.push(t.imageUrl);
    if (out.length === 4) break;
  }
  return out;
}

export function spotifySourceUrl(source: Source): string {
  return source.kind === 'liked' || !source.playlistId ? 'https://open.spotify.com/collection/tracks' : `https://open.spotify.com/playlist/${source.playlistId}`;
}
