import { z } from 'zod';
import { decadeLabel, GENRE_LABELS, MOOD_LABELS, THEME_LABELS } from './classify.js';
import { GENRE_BUCKETS, MOODS, THEMES, type GenreBucket, type Mood, type Theme, type TrackFacts } from './types.js';
import { stableStringify } from './util.js';

const range = { min: z.number().optional(), max: z.number().optional() };
const inOut = <T extends z.ZodType>(values: T) => ({ in: z.array(values).optional(), notIn: z.array(values).optional() });

export const conditionSchema = z.discriminatedUnion('field', [
  /** Genre bucket ("country") or any substring of a raw genre/tag ("90s country", "outlaw"). */
  z.object({ field: z.literal('genre'), ...inOut(z.string()) }),
  z.object({ field: z.literal('decade'), in: z.array(z.number().int()) }),
  z.object({ field: z.literal('year'), ...range }),
  z.object({ field: z.literal('explicit'), is: z.boolean() }),
  z.object({ field: z.literal('mood'), ...inOut(z.enum(MOODS)) }),
  z.object({ field: z.literal('theme'), ...inOut(z.enum(THEMES)) }),
  z.object({ field: z.literal('tag'), ...inOut(z.string()) }),
  z.object({ field: z.enum(['bpm', 'energy', 'valence', 'danceability', 'acousticness']), ...range }),
  z.object({ field: z.literal('camelot'), in: z.array(z.string()) }),
  /** Artist ids or case-insensitive names. */
  z.object({ field: z.literal('artist'), ...inOut(z.string()) }),
  z.object({ field: z.literal('addedAt'), after: z.string().optional(), before: z.string().optional() }),
]);

export type Condition = z.infer<typeof conditionSchema>;

export interface Rule {
  match: 'all' | 'any';
  conditions: Array<Condition | Rule>;
}

export const ruleSchema: z.ZodType<Rule> = z.lazy(() =>
  z.object({
    match: z.enum(['all', 'any']),
    conditions: z.array(z.union([conditionSchema, ruleSchema])),
  }),
);

export function parseRule(input: unknown): Rule {
  return ruleSchema.parse(input);
}

const isRule = (c: Condition | Rule): c is Rule => 'match' in c;

function inRange(value: number | null | undefined, min?: number, max?: number): boolean {
  if (value === null || value === undefined || Number.isNaN(value)) return false;
  return (min === undefined || value >= min) && (max === undefined || value <= max);
}

function genreMatches(track: TrackFacts, value: string): boolean {
  const v = value.toLowerCase();
  if ((GENRE_BUCKETS as readonly string[]).includes(v)) return track.genreBuckets.includes(v as GenreBucket);
  return track.genres.some((g) => g.includes(v)) || track.tags.some((t) => t.includes(v));
}

function artistMatches(track: TrackFacts, value: string): boolean {
  const v = value.toLowerCase();
  return track.artists.some((a) => a.id === value || a.name.toLowerCase() === v);
}

function inOutMatch<T>(list: readonly T[] | undefined, notList: readonly T[] | undefined, test: (v: T) => boolean): boolean {
  if (list && list.length && !list.some(test)) return false;
  if (notList && notList.some(test)) return false;
  return true;
}

export function matchesCondition(track: TrackFacts, c: Condition): boolean {
  switch (c.field) {
    case 'genre':
      return inOutMatch(c.in, c.notIn, (v) => genreMatches(track, v));
    case 'decade':
      return track.decade !== null && c.in.includes(track.decade);
    case 'year':
      return inRange(track.year, c.min, c.max);
    case 'explicit':
      return track.explicit === c.is;
    case 'mood':
      return inOutMatch(c.in, c.notIn, (m: Mood) => track.moods.includes(m));
    case 'theme':
      return inOutMatch(c.in, c.notIn, (t: Theme) => track.themes.includes(t));
    case 'tag':
      return inOutMatch(c.in, c.notIn, (v) => track.tags.some((t) => t.includes(v.toLowerCase())));
    case 'bpm':
      return inRange(track.audio?.tempo, c.min, c.max);
    case 'energy':
    case 'valence':
    case 'danceability':
    case 'acousticness':
      return inRange(track.audio?.[c.field], c.min, c.max);
    case 'camelot':
      return track.camelot !== null && c.in.map((k) => k.toUpperCase()).includes(track.camelot);
    case 'artist':
      return inOutMatch(c.in, c.notIn, (v) => artistMatches(track, v));
    case 'addedAt': {
      if (!track.addedAt) return false;
      const t = Date.parse(track.addedAt);
      return (!c.after || t > Date.parse(c.after)) && (!c.before || t < Date.parse(c.before));
    }
  }
}

/** Does the track satisfy the rule? Tracks missing the data a condition needs don't match it. */
export function matchesRule(track: TrackFacts, rule: Rule): boolean {
  const test = (c: Condition | Rule) => (isRule(c) ? matchesRule(track, c) : matchesCondition(track, c));
  if (rule.conditions.length === 0) return true;
  return rule.match === 'all' ? rule.conditions.every(test) : rule.conditions.some(test);
}

/** Stable identity for a rule, for de-duplicating suggestions. */
export function ruleKey(rule: Rule): string {
  return stableStringify(rule);
}

const label = (v: string) =>
  GENRE_LABELS[v as GenreBucket] ?? MOOD_LABELS[v as Mood] ?? THEME_LABELS[v as Theme] ?? v;
const list = (values: readonly (string | number)[]) => values.map((v) => label(String(v))).join(', ');
const rangeText = (unit: string, min?: number, max?: number) =>
  min !== undefined && max !== undefined ? `${min}–${max}${unit}` : min !== undefined ? `≥ ${min}${unit}` : `≤ ${max}${unit}`;

/** Human-readable chips for a rule, e.g. ["Genre: Country", "Decade: 90s", "Clean only"]. */
export function ruleChips(rule: Rule): string[] {
  const chips: string[] = [];
  for (const c of rule.conditions) {
    if (isRule(c)) {
      chips.push(`(${ruleChips(c).join(c.match === 'all' ? ' and ' : ' or ')})`);
      continue;
    }
    switch (c.field) {
      case 'genre':
      case 'mood':
      case 'theme':
      case 'tag':
      case 'artist': {
        const name = c.field[0]!.toUpperCase() + c.field.slice(1);
        if (c.in?.length) chips.push(`${name}: ${list(c.in)}`);
        if (c.notIn?.length) chips.push(`Not ${name.toLowerCase()}: ${list(c.notIn)}`);
        break;
      }
      case 'decade':
        chips.push(`Decade: ${c.in.map(decadeLabel).join(', ')}`);
        break;
      case 'year':
        chips.push(`Year: ${rangeText('', c.min, c.max)}`);
        break;
      case 'explicit':
        chips.push(c.is ? 'Explicit only' : 'Clean only');
        break;
      case 'bpm':
        chips.push(`BPM: ${rangeText('', c.min, c.max)}`);
        break;
      case 'energy':
      case 'valence':
      case 'danceability':
      case 'acousticness':
        chips.push(`${c.field[0]!.toUpperCase() + c.field.slice(1)}: ${rangeText('', c.min, c.max)}`);
        break;
      case 'camelot':
        chips.push(`Key: ${c.in.join(', ')}`);
        break;
      case 'addedAt':
        chips.push(c.after ? `Added after ${c.after.slice(0, 10)}` : `Added before ${c.before?.slice(0, 10)}`);
        break;
    }
  }
  return chips;
}
