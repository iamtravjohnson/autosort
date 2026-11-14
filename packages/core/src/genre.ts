import type { AudioFeatures, GenreBucket, Tag } from './types.js';

/**
 * The genre analyzer. Spotify no longer returns artist genres to most apps, so a song's genre is
 * worked out from crowd tags at three levels (the song, its album, its main artist), weighted by
 * how specific they are, then checked against how the song sounds. It prefers leaving a song out
 * over putting it in the wrong playlist: when the evidence is thin, the song gets no genre and its
 * likely genres are kept in `near` for an optional review.
 */

/** Tag patterns per genre. A tag can map to several ("country rap" → country + hip-hop). */
export const BUCKET_PATTERNS: Array<[GenreBucket, RegExp]> = [
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

/** Tags that deny a genre ("not country", "non-rap") say nothing useful about it. */
const NEGATED = /\b(not|non|no|never|anti)[ -]/;

export function genreBucketsFor(strings: readonly string[]): GenreBucket[] {
  const found = new Set<GenreBucket>();
  for (const raw of strings) {
    const s = raw.toLowerCase();
    if (NEGATED.test(s)) continue;
    const hits = BUCKET_PATTERNS.filter(([, pattern]) => pattern.test(s)).map(([bucket]) => bucket);
    // "Christian rock", "gospel rap": worship music in that style, so it counts as worship only.
    for (const b of hits.includes('worship') ? (['worship'] as GenreBucket[]) : hits) found.add(b);
  }
  return [...found];
}

/** Weights and thresholds. Exported so the test harness can tune them and apps can show them. */
export const GENRE_TUNING = {
  /** How much each source counts. The song itself beats its album, which beats the artist. */
  weights: { song: 3, album: 2, artist: 1.5, featured: 0.3, spotifyGenres: 1.5 },
  /** Only the strongest few tags of each source are used, and only above this count (0–100). */
  topTags: 6,
  minTagCount: 10,
  /**
   * Album and song tag lists often lead with non-genre tags ("2024", "vinyl"). Genre tags are
   * re-scaled against the strongest genre tag, but trusted less when that tag is weak.
   * The source counts fully once its strongest genre tag reaches this count.
   */
  fullTrustCount: 20,
  /** A song needs at least this score to get any genre. */
  minScore: 0.9,
  /** Other genres count too when they reach this share of the top score. */
  secondaryShare: 0.6,
  /** Genres at or above this score that didn't make the cut are kept as "near" (for review). */
  nearScore: 0.3,
  /** Extra tags for the same genre in one source add this share of their strength. */
  reinforce: 0.3,
  /** A second genre needs this share of the main genre's song-and-album evidence. */
  secondaryOwnShare: 0.5,
  /** With only artist tags to go on, a second genre needs this share of the top score. */
  artistOnlySecondaryShare: 0.8,
  /** Metal needs at least this much energy in the audio (troll tags put pop songs in metal). */
  metalMinEnergy: 0.55,
  /** Rap only counts as a second genre with at least this much rapping in the audio. */
  secondaryRapSpeechiness: 0.06,
  /** Worship wins unless another genre scores at least this many times higher. */
  worshipDominance: 1.25,
  /** Worship counts at this score even when another genre leads (a worship artist's "pop" album). */
  worshipStickyScore: 1.4,
} as const;

export interface GenreEvidence {
  /** Tags for this exact song (e.g. Last.fm track tags), strongest first. */
  songTags?: readonly Tag[];
  /** Tags for the album the song is on. */
  albumTags?: readonly Tag[];
  /** Tags for the song's main (first) artist. */
  artistTags?: readonly Tag[];
  /** Tags for featured artists, merged. Counted only lightly. */
  featuredTags?: readonly Tag[];
  /** Spotify genres for the main artist, if Spotify still provides them to this app. */
  spotifyGenres?: readonly string[];
  audio?: AudioFeatures | null;
}

export interface GenreResult {
  /** The genres the song belongs to: its main genre plus any close second. Empty when unsure. */
  buckets: GenreBucket[];
  /** Likely genres that didn't make the cut, for an optional "check these" review. */
  near: GenreBucket[];
  /** Score per genre, rounded. */
  scores: Partial<Record<GenreBucket, number>>;
  confidence: 'high' | 'medium' | 'low';
  /** Short, plain-English reasons, e.g. "Album tagged country". */
  reasons: string[];
}

type SourceKey = keyof typeof GENRE_TUNING.weights;
const SOURCE_LABEL: Record<SourceKey, string> = {
  song: 'Song tagged',
  album: 'Album tagged',
  artist: 'Artist tagged',
  featured: 'Featured artist tagged',
  spotifyGenres: 'Artist genres',
};

/** Per-genre strength (0–1) from one list of tags. */
function sourceStrengths(tags: readonly Tag[]): { strengths: Map<GenreBucket, number>; labels: Map<GenreBucket, string> } {
  const t = GENRE_TUNING;
  const genreTags = tags
    .filter((tag) => tag.count >= t.minTagCount || tags.indexOf(tag) === 0)
    .slice(0, t.topTags + 4)
    .map((tag) => ({ name: tag.name.toLowerCase().trim(), count: tag.count, buckets: genreBucketsFor([tag.name]) }))
    .filter((tag) => tag.buckets.length > 0)
    .slice(0, t.topTags);
  const strengths = new Map<GenreBucket, number>();
  const labels = new Map<GenreBucket, string>();
  if (genreTags.length === 0) return { strengths, labels };
  const top = Math.max(...genreTags.map((g) => g.count), 1);
  const trust = Math.min(1, top / t.fullTrustCount);
  const perBucket = new Map<GenreBucket, number[]>();
  for (const g of genreTags) {
    // A tag naming two genres ("country rap") is a weaker vote for each.
    const share = g.buckets.length > 1 ? 0.75 : 1;
    for (const b of g.buckets) {
      const list = perBucket.get(b) ?? [];
      list.push((g.count / top) * share);
      perBucket.set(b, list);
      if (!labels.has(b)) labels.set(b, g.name);
    }
  }
  for (const [b, values] of perBucket) {
    const sorted = values.sort((x, y) => y - x);
    const extra = sorted.slice(1).reduce((sum, v) => sum + v, 0) * GENRE_TUNING.reinforce;
    strengths.set(b, Math.min(1, (sorted[0] ?? 0) + extra) * trust);
  }
  return { strengths, labels };
}

/** How much rapping is in the audio scales the hip-hop score; sung songs by rappers drop out. */
function rapAudioFactor(audio: AudioFeatures | null | undefined): { factor: number; reason: string | null } {
  if (!audio || !Number.isFinite(audio.speechiness)) return { factor: 1, reason: null };
  const s = audio.speechiness;
  const pct = s.toFixed(2);
  if (s < 0.035) return { factor: 0.25, reason: `Little rapping in the audio (speechiness ${pct})` };
  if (s < 0.05) return { factor: 0.5, reason: `Not much rapping in the audio (speechiness ${pct})` };
  if (s < 0.08) return { factor: 0.85, reason: null };
  if (s >= 0.15) return { factor: 1.2, reason: `Lots of rapping in the audio (speechiness ${pct})` };
  return { factor: 1, reason: null };
}

const round = (n: number) => Math.round(n * 100) / 100;

export function analyzeGenres(e: GenreEvidence): GenreResult {
  const t = GENRE_TUNING;
  const scores = new Map<GenreBucket, number>();
  /** Evidence about this song specifically (its own and its album's tags). */
  const own = new Map<GenreBucket, number>();
  const why = new Map<GenreBucket, string[]>();
  const add = (source: SourceKey, tags: readonly Tag[] | undefined) => {
    if (!tags?.length) return;
    const { strengths, labels } = sourceStrengths(tags);
    for (const [b, strength] of strengths) {
      const points = strength * t.weights[source];
      if (points <= 0) continue;
      scores.set(b, (scores.get(b) ?? 0) + points);
      if (source === 'song' || source === 'album') own.set(b, (own.get(b) ?? 0) + points);
      if (source !== 'featured' && strength >= 0.5) {
        const list = why.get(b) ?? [];
        list.push(`${SOURCE_LABEL[source]} ${labels.get(b)}`);
        why.set(b, list);
      }
    }
  };

  add('song', e.songTags);
  add('album', e.albumTags);
  add('artist', e.artistTags);
  add('featured', e.featuredTags);
  if (e.spotifyGenres?.length) add('spotifyGenres', e.spotifyGenres.map((name, i) => ({ name, count: 100 - i * 5 })));

  if (e.audio && Number.isFinite(e.audio.energy) && e.audio.energy < t.metalMinEnergy && scores.has('metal')) scores.set('metal', (scores.get('metal') ?? 0) * 0.3);

  const rap = rapAudioFactor(e.audio);
  if (scores.has('hip-hop')) {
    scores.set('hip-hop', (scores.get('hip-hop') ?? 0) * rap.factor);
    if (rap.reason) why.set('hip-hop', [...(why.get('hip-hop') ?? []), rap.reason]);
  }

  const ranked = [...scores].sort((a, b) => b[1] - a[1]);
  const top = ranked[0]?.[1] ?? 0;
  const cut = Math.max(t.minScore, top * t.secondaryShare);
  // A genre counts when it's close to the top score, or when the song's own and album tags back it
  // nearly as strongly as the top genre (artist tags inflate the main genre's total).
  const ownMax = Math.max(0, ...own.values());
  const ownCut = Math.max(t.minScore, ownMax * t.secondaryShare);
  let buckets = top >= t.minScore ? ranked.filter(([b, s]) => s >= cut || (own.get(b) ?? 0) >= ownCut).map(([b]) => b) : [];
  const score = (b: GenreBucket) => scores.get(b) ?? 0;
  // A second genre must show up in the song's or album's own tags, not only the artist's:
  // a pop song by an artist who also raps isn't rap.
  const ownTop = buckets[0] ? (own.get(buckets[0]) ?? 0) : 0;
  if (ownTop > 0) buckets = buckets.filter((b, i) => i === 0 || (own.get(b) ?? 0) >= ownTop * t.secondaryOwnShare);
  // With no song or album tags at all, a second genre from artist tags alone must be close to the top.
  else buckets = buckets.filter((b, i) => i === 0 || score(b) >= top * t.artistOnlySecondaryShare);
  // Rap as a *second* genre needs actual rapping; a rapper's sung pop song isn't rap.
  const speech = e.audio?.speechiness;
  if (buckets[0] !== 'hip-hop' && speech !== undefined && Number.isFinite(speech) && speech < t.secondaryRapSpeechiness) buckets = buckets.filter((b) => b !== 'hip-hop');
  if (!buckets.includes('worship') && score('worship') >= t.worshipStickyScore && buckets.length > 0) buckets = [...buckets, 'worship'];
  // A worship song is worship first. Style tags that only come from the artist (rock, soul) need to
  // be much stronger to count; a genre the song's own or album tags back (Christian country) stays,
  // so the song lands in both playlists.
  if (buckets.includes('worship'))
    buckets = buckets.filter((b) => b === 'worship' || (own.get(b) ?? 0) > 0 || score(b) >= score('worship') * t.worshipDominance);
  const near = ranked.filter(([b, s]) => !buckets.includes(b) && s >= t.nearScore).map(([b]) => b);
  const second = ranked.find(([b]) => !buckets.includes(b))?.[1] ?? 0;
  const confidence: GenreResult['confidence'] =
    buckets.length === 0 ? 'low' : top >= 2 && second < top * 0.4 ? 'high' : top >= 1.4 ? 'medium' : 'low';

  const reasons: string[] = [];
  for (const b of buckets.length ? buckets : near.slice(0, 2)) reasons.push(...(why.get(b) ?? []));
  if (buckets.length === 0) reasons.push(top > 0 ? 'Not enough evidence for one genre' : 'No genre information found');
  if (!buckets.includes('hip-hop') && rap.reason && (scores.get('hip-hop') ?? 0) > 0 && !reasons.includes(rap.reason)) reasons.push(rap.reason);

  return {
    buckets,
    near,
    scores: Object.fromEntries(ranked.map(([b, s]) => [b, round(s)])),
    confidence,
    reasons: [...new Set(reasons)].slice(0, 5),
  };
}

/**
 * Strip the parts of a title that stop crowd-tag lookups from finding a song:
 * "I Had Some Help (Feat. Morgan Wallen)" → "I Had Some Help",
 * "Let It Be - Remastered 2009" → "Let It Be".
 */
export function cleanTitle(name: string): string {
  const noise = /\b(feat\.?|ft\.?|featuring|with|remaster(ed)?|live|version|edit|mono|stereo|radio|single|explicit|clean|bonus|anniversary|deluxe|from .+|re-?recorded|taylor'?s version)\b/i;
  let out = name.replace(/\s*[([][^)\]]*[)\]]/g, (part) => (noise.test(part) ? '' : part));
  out = out.replace(/\s+-\s+[^-]*$/, (part) => (noise.test(part) ? '' : part));
  return out.replace(/\s{2,}/g, ' ').trim() || name.trim();
}

/** Album titles without edition notes: "Curtain Call: The Hits (Deluxe Edition)" → "Curtain Call: The Hits". */
export function cleanAlbum(name: string): string {
  const noise = /\b(deluxe|expanded|edition|remaster(ed)?|anniversary|bonus|version|explicit|clean|special|collector'?s|super|platinum|complete|feat\.?|ft\.?|featuring|with)\b/i;
  // "(Taylor's Version)" is part of the album's real name.
  const strip = (part: string) => (noise.test(part) && !/taylor/i.test(part) ? '' : part);
  let out = name.replace(/\s*[([][^)\]]*[)\]]/g, strip);
  out = out.replace(/\s+-\s+[^-]*$/, strip);
  return out.replace(/\s{2,}/g, ' ').trim() || name.trim();
}
