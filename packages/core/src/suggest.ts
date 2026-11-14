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
  /** One minimum size for every kind. Leave unset for sizes scaled to the library (`suggestionSizes`). */
  minSize?: number;
  /** Rules that already have playlists; matching suggestions are skipped. */
  existingRules?: readonly Rule[];
  /** Max suggestions returned. Default 30. */
  limit?: number;
  /** Skip a decade sub-playlist when it holds more than this share of its genre. Default 0.85. */
  maxDecadeShare?: number;
  /** Suggest a clean version when at least this share of a genre is explicit. Default 0.25. */
  minExplicitShare?: number;
  /** Skip a genre when this share of its songs is already in a bigger suggested genre. Default 0.85. */
  maxOverlap?: number;
}

/**
 * Smallest group worth its own playlist, per kind, scaled to the library: big enough not to
 * flood Spotify with tiny playlists, small enough to catch real groups like 90s Country or
 * Christmas. For 360 songs: genres 11, decades and clean versions 9, themes 6, moods 18.
 */
export function suggestionSizes(songs: number): Record<SuggestionKind, number> {
  const genre = Math.min(25, Math.max(8, Math.round(songs * 0.03)));
  const sub = Math.max(8, Math.round(genre * 0.8));
  return {
    genre,
    'genre-decade': sub,
    clean: sub,
    theme: Math.max(6, Math.min(15, Math.round(songs * 0.015))),
    mood: Math.max(15, Math.min(40, Math.round(songs * 0.05))),
  };
}

/** Newest-added first: what someone who keeps adding to one playlist listens to most. */
export const DEFAULT_ORDER: OrderSpec = { by: 'addedAt', direction: 'desc' };

const KIND_ORDER: SuggestionKind[] = ['genre', 'theme', 'genre-decade', 'clean', 'mood'];

const newest = (tracks: TrackFacts[], n: number) =>
  [...tracks].sort((a, b) => (b.addedAt ?? '').localeCompare(a.addedAt ?? '')).slice(0, n).map((t) => t.id);

/**
 * Propose smart playlists for a source: genres, themes ("Love Songs", "Christmas"),
 * genre + decade ("90s Country"), clean versions ("Clean Rap") and moods ("Workout").
 * Sizes scale with the library, near-duplicate genres are skipped, and the list is capped.
 */
export function suggestPlaylists(tracks: readonly TrackFacts[], opts: SuggestOptions = {}): Suggestion[] {
  const sizes = opts.minSize !== undefined ? suggestionSizes(0) : suggestionSizes(tracks.length);
  if (opts.minSize !== undefined) for (const k of Object.keys(sizes) as SuggestionKind[]) sizes[k] = opts.minSize;
  const maxDecadeShare = opts.maxDecadeShare ?? 0.85;
  const minExplicitShare = opts.minExplicitShare ?? 0.25;
  const maxOverlap = opts.maxOverlap ?? 0.85;
  const taken = new Set((opts.existingRules ?? []).map(ruleKey));
  const out: Suggestion[] = [];
  const list = [...tracks];
  const chosenGenres: Array<Set<string>> = [];

  const add = (kind: SuggestionKind, name: string, rule: Rule, matched = list.filter((t) => matchesRule(t, rule))) => {
    const key = ruleKey(rule);
    if (taken.has(key) || out.some((s) => s.name === name)) return false;
    if (matched.length < sizes[kind]) return false;
    taken.add(key);
    out.push({ key, kind, name, rule, order: DEFAULT_ORDER, count: matched.length, sampleTrackIds: newest(matched, 3) });
    return true;
  };

  // Biggest genres first, so a near-duplicate (Indie that's almost all Folk) is the one skipped.
  const byGenre = GENRE_BUCKETS.map((bucket) => ({ bucket, songs: list.filter((t) => t.genreBuckets.includes(bucket)) })).sort((a, b) => b.songs.length - a.songs.length);
  for (const { bucket, songs: inGenre } of byGenre) {
    if (inGenre.length < sizes.genre) continue;
    const ids = new Set(inGenre.map((t) => t.id));
    const duplicate = chosenGenres.some((other) => [...ids].filter((id) => other.has(id)).length / ids.size >= maxOverlap);
    const genre = { field: 'genre' as const, in: [bucket] };
    const label = GENRE_LABELS[bucket];
    if (duplicate) continue;
    add('genre', label, { match: 'all', conditions: [genre] }, inGenre);
    chosenGenres.push(ids);

    // Decade playlists only for genres big enough to split.
    if (inGenre.length >= sizes.genre * 2) {
      const decades = new Map<number, number>();
      for (const t of inGenre) if (t.decade !== null) decades.set(t.decade, (decades.get(t.decade) ?? 0) + 1);
      for (const [decade, count] of [...decades].sort((a, b) => a[0] - b[0])) {
        if (count / inGenre.length <= maxDecadeShare) {
          add('genre-decade', `${decadeLabel(decade)} ${label}`, { match: 'all', conditions: [genre, { field: 'decade', in: [decade] }] });
        }
      }
    }

    const explicit = inGenre.filter((t) => t.explicit).length;
    if (explicit / inGenre.length >= minExplicitShare) {
      add('clean', `Clean ${label}`, { match: 'all', conditions: [genre, { field: 'explicit', is: false }] });
    }
  }

  for (const theme of THEMES) add('theme', THEME_LABELS[theme], { match: 'all', conditions: [{ field: 'theme', in: [theme] }] });
  for (const mood of MOODS) add('mood', MOOD_LABELS[mood], { match: 'all', conditions: [{ field: 'mood', in: [mood] }] });

  // Over the cap, drop the smallest decade and clean playlists first: genres, themes and moods stay.
  const limit = opts.limit ?? 30;
  const extras = out.filter((s) => s.kind === 'genre-decade' || s.kind === 'clean').sort((a, b) => a.count - b.count);
  const drop = new Set(extras.slice(0, Math.max(0, out.length - limit)).map((s) => s.key));
  return out
    .filter((s) => !drop.has(s.key))
    .sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) || b.count - a.count)
    .slice(0, limit);
}

/** Tracks that no rule claims. Show these as "Unmatched", or feed them back into `suggestPlaylists`. */
export function unmatchedTracks(tracks: readonly TrackFacts[], rules: readonly Rule[]): TrackFacts[] {
  return tracks.filter((t) => !rules.some((r) => matchesRule(t, r)));
}
