/**
 * Camelot wheel helpers. Keys use Spotify's convention: pitch class 0 = C … 11 = B,
 * mode 1 = major ("B" on the wheel), 0 = minor ("A").
 */

const MAJOR_TO_CAMELOT = [8, 3, 10, 5, 12, 7, 2, 9, 4, 11, 6, 1] as const;
const MINOR_TO_CAMELOT = [5, 12, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10] as const;
const PITCH_NAMES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'] as const;

export interface CamelotParts {
  number: number;
  letter: 'A' | 'B';
}

/** Camelot code ("8A") for a pitch class + mode, or null if the key is unknown. */
export function toCamelot(key: number, mode: number): string | null {
  if (!Number.isInteger(key) || key < 0 || key > 11) return null;
  return mode === 1 ? `${MAJOR_TO_CAMELOT[key]}B` : `${MINOR_TO_CAMELOT[key]}A`;
}

export function parseCamelot(code: string): CamelotParts | null {
  const m = /^(1[0-2]|[1-9])([AB])$/i.exec(code.trim());
  if (!m) return null;
  return { number: Number(m[1]), letter: (m[2] as string).toUpperCase() as 'A' | 'B' };
}

/** Musical key name for a Camelot code, e.g. "8A" → "A minor". */
export function camelotToKeyName(code: string): string | null {
  const parts = parseCamelot(code);
  if (!parts) return null;
  const table = parts.letter === 'B' ? MAJOR_TO_CAMELOT : MINOR_TO_CAMELOT;
  const pitch = table.indexOf(parts.number as never);
  return `${PITCH_NAMES[pitch]} ${parts.letter === 'B' ? 'major' : 'minor'}`;
}

/** Open Key notation, e.g. "8B" (C major) → "1d", "8A" (A minor) → "1m". */
export function camelotToOpenKey(code: string): string | null {
  const parts = parseCamelot(code);
  if (!parts) return null;
  return `${((parts.number - 8 + 12) % 12) + 1}${parts.letter === 'B' ? 'd' : 'm'}`;
}

/** Sort position on the wheel: 1A, 1B, 2A, 2B … 12B. */
export function camelotIndex(code: string): number | null {
  const parts = parseCamelot(code);
  return parts ? (parts.number - 1) * 2 + (parts.letter === 'B' ? 1 : 0) : null;
}

export type Transition = 'perfect' | 'adjacent' | 'relative' | 'diagonal' | 'boost' | 'clash';

/** How well one key mixes into the next. Higher is smoother. */
export const TRANSITION_SCORE: Record<Transition, number> = {
  perfect: 1,
  adjacent: 0.9,
  relative: 0.85,
  diagonal: 0.6,
  boost: 0.5,
  clash: 0,
};

/**
 * Classify the move from one Camelot key to another:
 * - perfect: same key
 * - adjacent: one step around the wheel (8A → 7A / 9A)
 * - relative: same number, other letter (8A ↔ 8B)
 * - diagonal: one step + letter switch (8A → 9B, 8B → 7A)
 * - boost: +2 or +7 steps on the same letter (energy lift)
 */
export function transition(from: string, to: string): Transition {
  const a = parseCamelot(from);
  const b = parseCamelot(to);
  if (!a || !b) return 'clash';
  const step = (((b.number - a.number) % 12) + 12) % 12;
  if (a.letter === b.letter) {
    if (step === 0) return 'perfect';
    if (step === 1 || step === 11) return 'adjacent';
    if (step === 2 || step === 7) return 'boost';
    return 'clash';
  }
  if (step === 0) return 'relative';
  if ((a.letter === 'A' && step === 1) || (a.letter === 'B' && step === 11)) return 'diagonal';
  return 'clash';
}

/** Every key that mixes from `code`, best matches first. */
export function compatibleKeys(code: string): Array<{ code: string; transition: Transition }> {
  const out: Array<{ code: string; transition: Transition }> = [];
  for (let n = 1; n <= 12; n++) {
    for (const letter of ['A', 'B'] as const) {
      const target = `${n}${letter}`;
      const t = transition(code, target);
      if (t !== 'clash') out.push({ code: target, transition: t });
    }
  }
  return out.sort((x, y) => TRANSITION_SCORE[y.transition] - TRANSITION_SCORE[x.transition]);
}

/** All 24 keys with their names, for reference tables. */
export function camelotTable(): Array<{ camelot: string; key: string; openKey: string }> {
  const rows: Array<{ camelot: string; key: string; openKey: string }> = [];
  for (let n = 1; n <= 12; n++) {
    for (const letter of ['A', 'B'] as const) {
      const code = `${n}${letter}`;
      rows.push({ camelot: code, key: camelotToKeyName(code) as string, openKey: camelotToOpenKey(code) as string });
    }
  }
  return rows;
}
