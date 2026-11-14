import { toCamelot } from './camelot.js';
import { analyzeGenres } from './genre.js';
import type { AudioFeatures, GenreBucket, Mood, Tag, Theme, TrackFacts, TrackRef } from './types.js';
import { uniq } from './util.js';

/** Display names, used for suggested playlist names. */
export const GENRE_LABELS: Record<GenreBucket, string> = {
  country: 'Country',
  'hip-hop': 'Rap',
  worship: 'Worship',
  pop: 'Pop',
  rock: 'Rock',
  metal: 'Metal',
  'r&b': 'R&B',
  electronic: 'Electronic',
  latin: 'Latin',
  jazz: 'Jazz',
  classical: 'Classical',
  folk: 'Folk',
  reggae: 'Reggae',
  blues: 'Blues',
  indie: 'Indie',
  soundtrack: 'Soundtracks',
};

export const MOOD_LABELS: Record<Mood, string> = {
  happy: 'Happy',
  sad: 'Sad',
  chill: 'Chill',
  energetic: 'High Energy',
  party: 'Party',
  workout: 'Workout',
  focus: 'Focus',
};

export const THEME_LABELS: Record<Theme, string> = {
  love: 'Love Songs',
  breakup: 'Breakup Songs',
  worship: 'Worship',
  christmas: 'Christmas',
};

/** Thresholds on the 0–1 audio scales. Exported so apps can show or tune them. */
export const MOOD_RULES: Record<Mood, (a: AudioFeatures) => boolean> = {
  happy: (a) => a.valence >= 0.6 && a.energy >= 0.4,
  sad: (a) => a.valence <= 0.35 && a.energy <= 0.6,
  chill: (a) => a.energy <= 0.45 && a.valence > 0.3,
  energetic: (a) => a.energy >= 0.8,
  party: (a) => a.danceability >= 0.7 && a.energy >= 0.65,
  workout: (a) => a.energy >= 0.7 && inTempoRange(a.tempo, 115, 165),
  focus: (a) => a.instrumentalness >= 0.5 && a.energy <= 0.6,
};

const MOOD_TAGS: Record<Mood, RegExp> = {
  happy: /\b(happy|feel good|feelgood|upbeat|cheerful|fun)\b/,
  sad: /\b(sad|melancholy|melancholic|depressing|heartbreaking)\b/,
  chill: /\b(chill|chillout|mellow|relax|relaxing|calm|soft)\b/,
  energetic: /\b(energetic|high energy|hype)\b/,
  party: /\b(party|club)\b/,
  workout: /\b(workout|gym|running|training)\b/,
  focus: /\b(study|focus|concentration)\b/,
};

const THEME_TAGS: Record<Theme, RegExp> = {
  love: /\b(love|love songs?|romantic|romance|wedding)\b/,
  breakup: /\b(breakup|break up|heartbreak|heartbroken)\b/,
  worship: /\b(worship|praise|christian|gospel|ccm)\b/,
  christmas: /\b(christmas|xmas|holiday)\b/,
};

const THEME_TITLES: Partial<Record<Theme, RegExp>> = {
  love: /\b(love|lover|loving)\b/i,
  christmas: /\b(christmas|xmas|santa|jingle|noel|mistletoe)\b/i,
};

/** True if the tempo (or its double/half time) falls in [min, max]. */
export function inTempoRange(tempo: number, min: number, max: number): boolean {
  return [tempo, tempo * 2, tempo / 2].some((t) => t >= min && t <= max);
}

export function yearFromDate(date: string | null | undefined): number | null {
  const m = date ? /^(\d{4})/.exec(date) : null;
  const year = m ? Number(m[1]) : NaN;
  return year > 1000 ? year : null;
}

export interface ClassifyInput {
  track: TrackRef;
  /** Spotify genres of the track's artists, main artist first (most apps no longer receive these). */
  artistGenres?: readonly string[];
  audio?: AudioFeatures | null;
  /** First release year of the recording (e.g. from MusicBrainz). */
  originalYear?: number | null;
  /** Crowd tags for the song itself, strongest first (e.g. Last.fm track tags). */
  tags?: readonly Tag[];
  /** Crowd tags for the song's album. */
  albumTags?: readonly Tag[];
  /** Crowd tags for the main artist. */
  artistTags?: readonly Tag[];
  /** Crowd tags for featured artists, merged. */
  featuredTags?: readonly Tag[];
  /** Tags weaker than this (0–100) are ignored for tag rules, moods and themes. Default 20. */
  minTagCount?: number;
}

/** Turn raw facts into the derived fields that rules and sorting use. No network calls. */
export function classifyTrack(input: ClassifyInput): TrackFacts {
  const { track } = input;
  const minTag = input.minTagCount ?? 20;
  const genres = uniq((input.artistGenres ?? []).map((g) => g.toLowerCase()));
  const names = (list: readonly Tag[] | undefined) => (list ?? []).filter((t) => t.count >= minTag).map((t) => t.name.toLowerCase().trim());
  // Song and album tags describe this song; artist tags only describe the artist in general.
  const songTags = uniq([...names(input.tags), ...names(input.albumTags)]);
  const tags = uniq([...songTags, ...names(input.artistTags)]);
  const audio = input.audio ?? null;

  const genre = analyzeGenres({
    songTags: input.tags,
    albumTags: input.albumTags,
    artistTags: input.artistTags,
    featuredTags: input.featuredTags,
    spotifyGenres: genres,
    audio,
  });
  const genreBuckets = genre.buckets;

  const albumYear = yearFromDate(track.album.releaseDate);
  const original = input.originalYear ?? null;
  const year = original && (!albumYear || original <= albumYear) ? original : albumYear;
  const yearSource: TrackFacts['yearSource'] = year === null ? null : year === original ? 'original' : 'album';

  const moods = new Set<Mood>();
  if (audio) for (const [mood, test] of Object.entries(MOOD_RULES) as Array<[Mood, (a: AudioFeatures) => boolean]>) if (test(audio)) moods.add(mood);
  for (const [mood, pattern] of Object.entries(MOOD_TAGS) as Array<[Mood, RegExp]>) if (songTags.some((t) => pattern.test(t))) moods.add(mood);

  const themes = new Set<Theme>();
  for (const [theme, pattern] of Object.entries(THEME_TAGS) as Array<[Theme, RegExp]>) if (songTags.some((t) => pattern.test(t))) themes.add(theme);
  for (const [theme, pattern] of Object.entries(THEME_TITLES) as Array<[Theme, RegExp]>) if (pattern.test(track.name)) themes.add(theme);
  if (genreBuckets.includes('worship')) themes.add('worship');

  return {
    ...track,
    genres,
    tags,
    genreBuckets,
    genreNear: genre.near,
    genreScores: genre.scores,
    genreConfidence: genre.confidence,
    genreReasons: genre.reasons,
    year,
    yearSource,
    decade: year === null ? null : Math.floor(year / 10) * 10,
    audio,
    camelot: audio ? toCamelot(audio.key, audio.mode) : null,
    moods: [...moods],
    themes: [...themes],
  };
}

/** Label for a decade, e.g. 1990 → "90s", 2010 → "2010s". */
export function decadeLabel(decade: number): string {
  return decade >= 2000 ? `${decade}s` : `${String(decade).slice(2)}s`;
}
