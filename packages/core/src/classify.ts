import { toCamelot } from './camelot.js';
import type { AudioFeatures, GenreBucket, Mood, Tag, Theme, TrackFacts, TrackRef } from './types.js';
import { uniq } from './util.js';

/**
 * Genre buckets are matched against Spotify artist genres and crowd tags.
 * A track can land in more than one bucket ("country rap" → country + hip-hop).
 */
const BUCKET_PATTERNS: Array<[GenreBucket, RegExp]> = [
  ['worship', /\b(worship|ccm|christian|gospel|praise)\b/],
  ['country', /\b(country|americana|bluegrass|honky[- ]tonk|red dirt|outlaw)\b/],
  ['hip-hop', /\b(hip[- ]?hop|rap|trap|drill|grime|crunk|boom bap)\b/],
  ['r&b', /(\br&b\b|\brnb\b|\bsoul\b|\bneo[- ]soul\b|\bfunk\b|\bmotown\b|new jack swing|rhythm and blues)/],
  ['metal', /\b(metal|metalcore|deathcore|thrash|djent)\b/],
  ['rock', /\b(rock|grunge|punk|emo|britpop|shoegaze)\b/],
  [
    'electronic',
    /\b(edm|house|techno|trance|dubstep|electro|electronic|electronica|drum and bass|dnb|garage|big room|future bass|hardstyle)\b/,
  ],
  ['latin', /\b(latin|reggaeton|bachata|salsa|cumbia|corrido|corridos|banda|regional mexican|urbano latino)\b/],
  ['jazz', /\b(jazz|bebop|big band)\b/],
  ['classical', /\b(classical|orchestra|orchestral|baroque|opera|symphony)\b/],
  ['folk', /\b(folk|singer-songwriter)\b/],
  ['reggae', /\b(reggae|dancehall|ska|dub)\b/],
  ['blues', /(?<!rhythm and )\bblues\b/],
  ['pop', /\bpop\b/],
  ['indie', /\bindie\b/],
  ['soundtrack', /\b(soundtrack|show tunes|musicals?|disney)\b/],
];

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

export function genreBucketsFor(strings: readonly string[]): GenreBucket[] {
  const found = new Set<GenreBucket>();
  for (const raw of strings) {
    const s = raw.toLowerCase();
    for (const [bucket, pattern] of BUCKET_PATTERNS) if (pattern.test(s)) found.add(bucket);
  }
  return [...found];
}

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
  /** Union of the track's artists' Spotify genres. */
  artistGenres?: readonly string[];
  audio?: AudioFeatures | null;
  /** First release year of the recording (e.g. from MusicBrainz). */
  originalYear?: number | null;
  /** Crowd tags, strongest first (e.g. from Last.fm). */
  tags?: readonly Tag[];
  /** Tags weaker than this (0–100) are ignored. Default 20. */
  minTagCount?: number;
}

/** Turn raw facts into the derived fields that rules and sorting use. No network calls. */
export function classifyTrack(input: ClassifyInput): TrackFacts {
  const { track } = input;
  const minTag = input.minTagCount ?? 20;
  const genres = uniq((input.artistGenres ?? []).map((g) => g.toLowerCase()));
  const tags = (input.tags ?? []).filter((t) => t.count >= minTag).map((t) => t.name.toLowerCase().trim());
  const audio = input.audio ?? null;

  // Spotify genres are the primary signal; the strongest few tags fill gaps.
  const genreBuckets = uniq([...genreBucketsFor(genres), ...genreBucketsFor(tags.slice(0, 3))]);

  const albumYear = yearFromDate(track.album.releaseDate);
  const original = input.originalYear ?? null;
  const year = original && (!albumYear || original <= albumYear) ? original : albumYear;
  const yearSource: TrackFacts['yearSource'] = year === null ? null : year === original ? 'original' : 'album';

  const moods = new Set<Mood>();
  if (audio) for (const [mood, test] of Object.entries(MOOD_RULES) as Array<[Mood, (a: AudioFeatures) => boolean]>) if (test(audio)) moods.add(mood);
  for (const [mood, pattern] of Object.entries(MOOD_TAGS) as Array<[Mood, RegExp]>) if (tags.some((t) => pattern.test(t))) moods.add(mood);

  const themes = new Set<Theme>();
  for (const [theme, pattern] of Object.entries(THEME_TAGS) as Array<[Theme, RegExp]>) if (tags.some((t) => pattern.test(t))) themes.add(theme);
  for (const [theme, pattern] of Object.entries(THEME_TITLES) as Array<[Theme, RegExp]>) if (pattern.test(track.name)) themes.add(theme);
  if (genreBuckets.includes('worship')) themes.add('worship');

  return {
    ...track,
    genres,
    tags,
    genreBuckets,
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
