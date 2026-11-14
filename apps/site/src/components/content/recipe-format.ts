import { ruleChips, type Condition, type OrderSpec, type Rule } from '@autosort/core';

/* ---------- Covers ---------- */

const NEAR_BLACK = '#0B0B0C';
const WHITE = '#FFFFFF';

function rgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

function luminance([r, g, b]: [number, number, number]): number {
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

const contrast = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

/**
 * Cover title color: near-black (the design default) or white, whichever reads better across the
 * lower-left of the 145° gradient where the title sits.
 */
export function coverInk([from, to]: [string, string]): string {
  const a = rgb(from);
  const b = rgb(to);
  const samples = [0.3, 0.45, 0.6].map((t) => luminance(a.map((v, i) => v + (b[i]! - v) * t) as [number, number, number]));
  const dark = Math.min(...samples.map((l) => contrast(l, luminance(rgb(NEAR_BLACK)))));
  const light = Math.min(...samples.map((l) => contrast(l, 1)));
  return dark >= light ? NEAR_BLACK : WHITE;
}

export const coverGradient = ([from, to]: [string, string]) => `linear-gradient(145deg, ${from}, ${to})`;

/* ---------- Chips ---------- */

/** Split an engine chip like "Genre: Country" into a muted label and its value. */
export function splitChip(chip: string): { label?: string; value: string } {
  const i = chip.indexOf(': ');
  return i > 0 ? { label: chip.slice(0, i), value: chip.slice(i + 2) } : { value: chip };
}

/** Engine chips for a rule, plus whether they're alternatives (match any) rather than all required. */
export function chipsFor(rule: Rule): { chips: string[]; any: boolean } {
  const chips = ruleChips(rule);
  return { chips, any: rule.match === 'any' && chips.length > 1 };
}

/* ---------- Order ---------- */

const FIELD_NAMES: Record<string, string> = {
  addedAt: 'Date added',
  bpm: 'BPM',
  energy: 'Energy',
  valence: 'Mood (valence)',
  danceability: 'Danceability',
  acousticness: 'Acousticness',
  year: 'Release year',
  releaseDate: 'Release date',
  artist: 'Artist',
  title: 'Title',
  album: 'Album',
  duration: 'Length',
  camelot: 'Camelot key',
};

/** Order label for chips, e.g. "Newest added first". */
export function orderLabel(order: OrderSpec): string {
  switch (order.by) {
    case 'harmonic':
      return order.startKey ? `Harmonic flow from ${order.startKey}` : 'Harmonic flow';
    case 'energyArc':
      return order.shape === 'build' ? 'Energy build' : order.shape === 'windDown' ? 'Energy wind-down' : 'Warm-up, peak, cool-down';
    case 'shuffle':
      return 'Shuffle';
    case 'addedAt':
      return order.direction === 'asc' ? 'Oldest added first' : 'Newest added first';
    case 'bpm':
      return order.direction === 'desc' ? 'BPM, fast to slow' : 'BPM, slow to fast';
    case 'energy':
      return order.direction === 'desc' ? 'Energy, high to low' : 'Energy, low to high';
    case 'year':
    case 'releaseDate':
      return order.direction === 'desc' ? 'Newest releases first' : 'Oldest releases first';
    default:
      return `${FIELD_NAMES[order.by] ?? order.by}${order.direction === 'desc' ? ', descending' : ''}`;
  }
}

/** Short form for the big stat tile. */
export function orderShort(order: OrderSpec): string {
  switch (order.by) {
    case 'harmonic':
      return 'Harmonic';
    case 'energyArc':
      return order.shape === 'build' ? 'Energy build' : order.shape === 'windDown' ? 'Wind-down' : 'Energy arc';
    case 'addedAt':
      return order.direction === 'asc' ? 'Oldest first' : 'Newest first';
    case 'bpm':
      return order.direction === 'desc' ? 'Fast → slow' : 'Slow → fast';
    default:
      return orderLabel(order);
  }
}

/** Plain-English description of what an order does, matching the engine's sortTracks(). */
export function orderExplain(order: OrderSpec): string {
  switch (order.by) {
    case 'harmonic':
      return `Starts from the calmest song${order.startKey ? ` in ${order.startKey}` : ''}, then picks each next song for a compatible Camelot key, a tempo within about ±${order.bpmTolerance ?? 8} BPM and a small change in energy. Songs missing key or tempo data go at the end.`;
    case 'energyArc':
      if (order.shape === 'build') return 'Lowest energy first, rising to the most intense songs at the end. Songs without audio data go last.';
      if (order.shape === 'windDown') return 'Highest energy first, settling down by the end. Songs without audio data go last.';
      return 'Energy rises to a peak in the middle, then comes back down. Songs without audio data go last.';
    case 'shuffle':
      return 'A shuffled order.';
    case 'addedAt':
      return order.direction === 'asc'
        ? 'The songs you added longest ago come first.'
        : 'The songs you added most recently sit at the top, so new finds play first.';
    case 'bpm':
      return `${order.direction === 'desc' ? 'Fastest to slowest' : 'Slowest to fastest'} by tempo. Songs with no tempo data go last.`;
    default:
      return `Sorted by ${(FIELD_NAMES[order.by] ?? order.by).toLowerCase()}${order.direction === 'desc' ? ', highest first' : ''}. Songs missing that data go last.`;
  }
}

/* ---------- Conditions ---------- */

const GENRE_EXAMPLES: Record<string, string> = {
  country: 'country, americana, bluegrass, honky tonk, red dirt or outlaw',
  'hip-hop': 'hip hop, rap, trap, drill, grime, crunk or boom bap',
  worship: 'worship, CCM, Christian, gospel or praise',
  pop: 'the word "pop", like dance pop or pop rap, so expect some crossover',
  rock: 'rock, grunge, punk, emo or shoegaze',
  'r&b': 'R&B, soul, neo soul, funk or Motown',
};

const MOOD_EXPLAIN: Record<string, string> = {
  happy: 'positive-sounding (valence 60%+) with at least moderate energy (40%+), or tagged happy, upbeat or feel good',
  sad: 'low valence (35% or less) with energy at 60% or less, or tagged sad or melancholy',
  chill: 'energy at 45% or less without sounding gloomy (valence above 30%), or tagged chill, mellow, relaxing or calm',
  workout: 'energy 70%+ with a tempo of 115–165 BPM (double- or half-time counts), or tagged workout, gym, running or training',
  party: 'danceability 70%+ with energy 65%+, or tagged party or club',
  energetic: 'energy 80%+, or tagged energetic or high energy',
  focus: 'mostly instrumental (50%+) with energy at 60% or less, or tagged study or focus',
};

const THEME_EXPLAIN: Record<string, string> = {
  love: 'Last.fm tags like love, romantic or wedding, or a title with love, lover or loving',
  breakup: 'Last.fm tags like breakup or heartbreak',
  worship: 'Last.fm tags like worship, praise, Christian, gospel or CCM, or a worship genre',
  christmas: 'Last.fm tags like Christmas or holiday, or a title like Jingle, Santa or Mistletoe',
};

const pct = (v: number) => `${Math.round(v * 100)}%`;
function range(min: number | undefined, max: number | undefined, fmt: (v: number) => string): string {
  if (min !== undefined && max !== undefined) return `between ${fmt(min)} and ${fmt(max)}`;
  if (min !== undefined) return `${fmt(min)} or more`;
  return `${fmt(max ?? 0)} or less`;
}
const join = (list: string[]) =>
  list.length < 2 ? list.join('') : list.length === 2 ? `${list[0]} or ${list[1]}` : `${list.slice(0, -1).join('; ')}; or ${list.at(-1)}`;

/** How AutoSort checks one condition, in plain English, matching the engine's matchesCondition(). */
export function conditionExplain(c: Condition): string {
  switch (c.field) {
    case 'genre': {
      const parts: string[] = [];
      if (c.in?.length)
        parts.push(
          `Matches when the artist's Spotify genres, or the song's strongest Last.fm tags, mention ${join(c.in.map((g) => GENRE_EXAMPLES[g] ?? `"${g}"`))}.`,
        );
      if (c.notIn?.length) parts.push(`Leaves out genres that mention ${join(c.notIn.map((g) => GENRE_EXAMPLES[g] ?? `"${g}"`))}.`);
      return parts.join(' ');
    }
    case 'decade':
      return `First released ${join(c.in.map((d) => `${d}–${d + 9}`))}. AutoSort uses the original release year from MusicBrainz when it can match the recording, so greatest-hits and remaster dates don't count. Otherwise it falls back to the album's release year.`;
    case 'year':
      return `Release year ${range(c.min, c.max, String)}, using the original release year where MusicBrainz knows it.`;
    case 'explicit':
      return c.is
        ? 'Only tracks Spotify flags as explicit.'
        : "Leaves out every track Spotify flags as explicit. Songs that aren't flagged still get in, so give new matches a listen.";
    case 'mood': {
      const parts: string[] = [];
      if (c.in?.length) parts.push(`Matches songs that are ${join(c.in.map((m) => MOOD_EXPLAIN[m] ?? m))}.`);
      if (c.notIn?.length) parts.push(`Leaves out songs that are ${join(c.notIn.map((m) => MOOD_EXPLAIN[m] ?? m))}.`);
      parts.push('Audio numbers come from ReccoBeats; tags come from Last.fm.');
      return parts.join(' ');
    }
    case 'theme': {
      const parts: string[] = [];
      if (c.in?.length) parts.push(`Matches ${join(c.in.map((t) => THEME_EXPLAIN[t] ?? t))}. Tags need the optional free Last.fm key.`);
      if (c.notIn?.length) parts.push(`Leaves out ${join(c.notIn.map((t) => THEME_EXPLAIN[t] ?? t))}.`);
      return parts.join(' ');
    }
    case 'tag':
      return `Last.fm crowd tags containing ${join((c.in ?? []).map((t) => `"${t}"`))}${c.notIn?.length ? `, leaving out ${join(c.notIn.map((t) => `"${t}"`))}` : ''}.`;
    case 'bpm':
      return `Tempo from ReccoBeats: ${range(c.min, c.max, (v) => `${v} BPM`)}. The rule uses the tempo as reported, so a song detected at half or double speed may be left out.`;
    case 'energy':
    case 'valence':
    case 'danceability':
    case 'acousticness': {
      const what = { energy: 'Energy', valence: 'Valence (how positive it sounds)', danceability: 'Danceability', acousticness: 'Acousticness' }[c.field];
      return `${what} from ReccoBeats audio data: ${range(c.min, c.max, pct)}.`;
    }
    case 'camelot':
      return `Songs in ${c.in.join(', ')} on the Camelot wheel, from ReccoBeats key data.`;
    case 'artist':
      return `Songs by ${join((c.in ?? []).map((a) => `"${a}"`))}${c.notIn?.length ? `, leaving out ${join(c.notIn.map((a) => `"${a}"`))}` : ''}.`;
    case 'addedAt': {
      const fmt = (iso: string) => iso.slice(0, 10);
      const parts = [c.after ? `after ${fmt(c.after)}` : '', c.before ? `before ${fmt(c.before)}` : ''].filter(Boolean);
      return `The date you added the song to the source playlist, as Spotify records it: ${parts.join(' and ')}.`;
    }
  }
}

/** Each top-level condition of a rule with its chip text and explanation. Nested groups get one row. */
export function explainRule(rule: Rule): Array<{ chip: string; how: string }> {
  return rule.conditions.map((c) => {
    if ('match' in c) {
      const inner = explainRule(c);
      return {
        chip: ruleChips({ match: 'all', conditions: [c] })[0] ?? 'Group',
        how: `${c.match === 'all' ? 'All' : 'Any'} of: ${inner.map((i) => i.how).join(' ')}`,
      };
    }
    return { chip: ruleChips({ match: 'all', conditions: [c] })[0] ?? c.field, how: conditionExplain(c) };
  });
}
