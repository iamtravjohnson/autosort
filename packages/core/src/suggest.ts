import { decadeLabel, GENRE_LABELS, MOOD_LABELS, THEME_LABELS } from './classify.js';
import { matchesRule, ruleKey, type Rule } from './rules.js';
import type { OrderSpec } from './sort.js';
import { GENRE_BUCKETS, MOODS, THEMES, type TrackFacts } from './types.js';

export type SuggestionKind = 'genre' | 'genre-decade' | 'clean' | 'mood' | 'theme';

export interface Suggestion {
  /** Stable id for the rule (same rule → same key). */
  key: string;
  kind: SuggestionKind;
  name: string;
  rule: Rule;
  order: OrderSpec;
  count: number;
  /** Up to 3 of the most recently added matching tracks. */
  sampleTrackIds: string[];
}

export interface SuggestOptions {
  /** Smallest group worth its own playlist. Default 25. */
  minSize?: number;
  /** Rules that already have playlists; matching suggestions are skipped. */
  existingRules?: readonly Rule[];
  /** Max suggestions returned. Default 24. */
  limit?: number;
  /** Skip a decade sub-playlist when it holds more than this share of its genre. Default 0.85. */
  maxDecadeShare?: number;
  /** Suggest a clean version when at least this share of a genre is explicit. Default 0.25. */
  minExplicitShare?: number;
}

/** Newest-added first: what someone who keeps adding to one playlist listens to most. */
export const DEFAULT_ORDER: OrderSpec = { by: 'addedAt', direction: 'desc' };

const KIND_ORDER: SuggestionKind[] = ['genre', 'genre-decade', 'clean', 'theme', 'mood'];

const newest = (tracks: TrackFacts[], n: number) =>
  [...tracks].sort((a, b) => (b.addedAt ?? '').localeCompare(a.addedAt ?? '')).slice(0, n).map((t) => t.id);

/**
 * Propose smart playlists for a source: genres, genre + decade ("90s Country"),
 * clean versions ("Clean Rap"), themes ("Love Songs") and moods ("Workout").
 */
export function suggestPlaylists(tracks: readonly TrackFacts[], opts: SuggestOptions = {}): Suggestion[] {
  const min = opts.minSize ?? 25;
  const maxDecadeShare = opts.maxDecadeShare ?? 0.85;
  const minExplicitShare = opts.minExplicitShare ?? 0.25;
  const taken = new Set((opts.existingRules ?? []).map(ruleKey));
  const out: Suggestion[] = [];
  const list = [...tracks];

  const add = (kind: SuggestionKind, name: string, rule: Rule) => {
    const key = ruleKey(rule);
    if (taken.has(key) || out.some((s) => s.name === name)) return;
    const matched = list.filter((t) => matchesRule(t, rule));
    if (matched.length < min) return;
    taken.add(key);
    out.push({ key, kind, name, rule, order: DEFAULT_ORDER, count: matched.length, sampleTrackIds: newest(matched, 3) });
  };

  for (const bucket of GENRE_BUCKETS) {
    const genre = { field: 'genre' as const, in: [bucket] };
    const inGenre = list.filter((t) => t.genreBuckets.includes(bucket));
    if (inGenre.length < min) continue;
    const label = GENRE_LABELS[bucket];
    add('genre', label, { match: 'all', conditions: [genre] });

    const decades = new Map<number, number>();
    for (const t of inGenre) if (t.decade !== null) decades.set(t.decade, (decades.get(t.decade) ?? 0) + 1);
    for (const [decade, count] of [...decades].sort((a, b) => a[0] - b[0])) {
      if (count >= min && count / inGenre.length <= maxDecadeShare) {
        add('genre-decade', `${decadeLabel(decade)} ${label}`, { match: 'all', conditions: [genre, { field: 'decade', in: [decade] }] });
      }
    }

    const explicit = inGenre.filter((t) => t.explicit).length;
    if (explicit / inGenre.length >= minExplicitShare) {
      add('clean', `Clean ${label}`, { match: 'all', conditions: [genre, { field: 'explicit', is: false }] });
    }
  }

  for (const theme of THEMES) add('theme', THEME_LABELS[theme], { match: 'all', conditions: [{ field: 'theme', in: [theme] }] });
  for (const mood of MOODS) add('mood', MOOD_LABELS[mood], { match: 'all', conditions: [{ field: 'mood', in: [mood] }] });

  return out
    .sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) || b.count - a.count)
    .slice(0, opts.limit ?? 24);
}

/** Tracks that no rule claims. Show these as "Unmatched", or feed them back into `suggestPlaylists`. */
export function unmatchedTracks(tracks: readonly TrackFacts[], rules: readonly Rule[]): TrackFacts[] {
  return tracks.filter((t) => !rules.some((r) => matchesRule(t, r)));
}
