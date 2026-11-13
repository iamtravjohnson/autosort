import { camelotIndex, transition, TRANSITION_SCORE } from './camelot.js';
import type { TrackFacts } from './types.js';
import { seededRandom } from './util.js';

export type SortField =
  | 'addedAt'
  | 'bpm'
  | 'energy'
  | 'valence'
  | 'danceability'
  | 'acousticness'
  | 'year'
  | 'releaseDate'
  | 'artist'
  | 'title'
  | 'album'
  | 'duration'
  | 'camelot';

export type Direction = 'asc' | 'desc';

export type OrderSpec =
  | { by: SortField; direction?: Direction; then?: { by: SortField; direction?: Direction } }
  /** DJ-style flow around the Camelot wheel, keeping BPM changes small. */
  | { by: 'harmonic'; startKey?: string; bpmTolerance?: number }
  /** mountain = warm-up → peak → cool-down; build = rising energy; windDown = falling energy. */
  | { by: 'energyArc'; shape: 'mountain' | 'build' | 'windDown' }
  | { by: 'shuffle'; seed?: number };

export interface SortOptions {
  /** Lock tracks to positions: track id → zero-based index. */
  pinned?: Record<string, number>;
}

type Value = number | string | null;

function valueOf(t: TrackFacts, field: SortField): Value {
  switch (field) {
    case 'addedAt':
      return t.addedAt;
    case 'bpm':
      return t.audio?.tempo ?? null;
    case 'energy':
    case 'valence':
    case 'danceability':
    case 'acousticness':
      return t.audio?.[field] ?? null;
    case 'year':
      return t.year;
    case 'releaseDate':
      return t.album.releaseDate;
    case 'artist':
      return t.artists[0]?.name.toLowerCase() ?? null;
    case 'title':
      return t.name.toLowerCase();
    case 'album':
      return t.album.name.toLowerCase();
    case 'duration':
      return t.durationMs;
    case 'camelot':
      return t.camelot ? camelotIndex(t.camelot) : null;
  }
}

function compareValues(a: Value, b: Value, direction: Direction): number {
  // Missing values always sort last, whatever the direction.
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  const cmp = typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b));
  return direction === 'asc' ? cmp : -cmp;
}

function byFields(tracks: TrackFacts[], spec: Extract<OrderSpec, { by: SortField }>): TrackFacts[] {
  const primaryDir = spec.direction ?? (spec.by === 'addedAt' ? 'desc' : 'asc');
  return tracks
    .map((t, i) => ({ t, i }))
    .sort((x, y) => {
      let c = compareValues(valueOf(x.t, spec.by), valueOf(y.t, spec.by), primaryDir);
      if (c === 0 && spec.then) c = compareValues(valueOf(x.t, spec.then.by), valueOf(y.t, spec.then.by), spec.then.direction ?? 'asc');
      return c || x.i - y.i;
    })
    .map(({ t }) => t);
}

/** BPM distance, treating double/half time as close (e.g. 70 ≈ 140). */
export function bpmDistance(a: number, b: number): number {
  return Math.min(Math.abs(a - b), Math.abs(a * 2 - b), Math.abs(a - b * 2));
}

/** 0–1 score for playing `b` right after `a`. */
export function transitionScore(a: TrackFacts, b: TrackFacts, bpmTolerance = 8): number {
  if (!a.camelot || !b.camelot || !a.audio || !b.audio) return 0;
  const key = TRANSITION_SCORE[transition(a.camelot, b.camelot)];
  const d = bpmDistance(a.audio.tempo, b.audio.tempo);
  const bpmPenalty = d <= bpmTolerance ? (d / bpmTolerance) * 0.3 : 0.3 + ((d - bpmTolerance) / bpmTolerance) * 0.5;
  const energyPenalty = Math.abs(a.audio.energy - b.audio.energy) * 0.1;
  return key - bpmPenalty - energyPenalty;
}

function harmonic(tracks: TrackFacts[], startKey: string | undefined, tolerance: number): TrackFacts[] {
  const mixable = tracks.filter((t) => t.camelot && t.audio);
  const rest = tracks.filter((t) => !(t.camelot && t.audio));
  if (mixable.length === 0) return tracks;

  const lowestEnergy = (list: TrackFacts[]) =>
    list.reduce((best, t) => ((t.audio?.energy ?? 1) < (best.audio?.energy ?? 1) ? t : best));
  const start = startKey?.toUpperCase();
  const fromKey = start ? mixable.filter((t) => t.camelot === start) : [];
  let current = lowestEnergy(fromKey.length ? fromKey : mixable);

  const remaining = new Set(mixable);
  remaining.delete(current);
  const ordered = [current];
  while (remaining.size) {
    let best: TrackFacts | null = null;
    let bestScore = -Infinity;
    for (const candidate of remaining) {
      const score = transitionScore(current, candidate, tolerance);
      if (score > bestScore) {
        best = candidate;
        bestScore = score;
      }
    }
    current = best as TrackFacts;
    remaining.delete(current);
    ordered.push(current);
  }
  return [...ordered, ...rest];
}

function energyArc(tracks: TrackFacts[], shape: 'mountain' | 'build' | 'windDown'): TrackFacts[] {
  const rising = byFields(tracks, { by: 'energy', direction: 'asc' });
  const known = rising.filter((t) => t.audio);
  const unknown = rising.filter((t) => !t.audio);
  if (shape === 'build') return rising;
  if (shape === 'windDown') return [...known.reverse(), ...unknown];
  const up = known.filter((_, i) => i % 2 === 0);
  const down = known.filter((_, i) => i % 2 === 1).reverse();
  return [...up, ...down, ...unknown];
}

function shuffle(tracks: TrackFacts[], seed: number): TrackFacts[] {
  const rand = seededRandom(seed);
  const out = [...tracks];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j] as TrackFacts, out[i] as TrackFacts];
  }
  return out;
}

function applyPins(sorted: TrackFacts[], pinned: Record<string, number> | undefined): TrackFacts[] {
  if (!pinned || Object.keys(pinned).length === 0) return sorted;
  const pins = sorted.filter((t) => pinned[t.id] !== undefined).sort((a, b) => (pinned[a.id] as number) - (pinned[b.id] as number));
  const out = sorted.filter((t) => pinned[t.id] === undefined);
  for (const t of pins) out.splice(Math.min(Math.max(0, pinned[t.id] as number), out.length), 0, t);
  return out;
}

/** Return a new array in the requested order. Never mutates the input. */
export function sortTracks(tracks: readonly TrackFacts[], spec: OrderSpec, options: SortOptions = {}): TrackFacts[] {
  const list = [...tracks];
  let sorted: TrackFacts[];
  switch (spec.by) {
    case 'harmonic':
      sorted = harmonic(list, spec.startKey, spec.bpmTolerance ?? 8);
      break;
    case 'energyArc':
      sorted = energyArc(list, spec.shape);
      break;
    case 'shuffle':
      sorted = shuffle(list, spec.seed ?? Date.now());
      break;
    default:
      sorted = byFields(list, spec);
  }
  return applyPins(sorted, options.pinned);
}
