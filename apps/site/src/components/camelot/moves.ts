import { camelotToKeyName, compatibleKeys, parseCamelot, type Transition } from '@autosort/core';

/**
 * The moves around the Camelot wheel, in the order the site shows them.
 * The first five (same, down, up, relative, boost) are the design's "four moves".
 * Diagonal and semitone are extra moves the @autosort/core engine also accepts.
 */
export type MoveKind = 'same' | 'down' | 'up' | 'relative' | 'boost' | 'diagonal' | 'semitone';

export interface CamelotMove {
  code: string;
  name: string;
  kind: MoveKind;
  /** The engine's classification, from `transition()`. */
  transition: Transition;
  label: string;
  /** One of the design's four moves (shown prominently). */
  primary: boolean;
}

const ORDER: MoveKind[] = ['same', 'down', 'up', 'relative', 'boost', 'diagonal', 'semitone'];

/** Every key that mixes from `code`, labeled for people, using the engine's own compatibility rules. */
export function camelotMoves(code: string): CamelotMove[] {
  const from = parseCamelot(code);
  if (!from) return [];
  const moves = compatibleKeys(code).map(({ code: to, transition }): CamelotMove => {
    const target = parseCamelot(to);
    const step = target ? (((target.number - from.number) % 12) + 12) % 12 : 0;
    let kind: MoveKind;
    switch (transition) {
      case 'perfect':
        kind = 'same';
        break;
      case 'adjacent':
        kind = step === 11 ? 'down' : 'up';
        break;
      case 'relative':
        kind = 'relative';
        break;
      case 'diagonal':
        kind = 'diagonal';
        break;
      default:
        kind = step === 2 ? 'boost' : 'semitone';
    }
    return {
      code: to,
      name: camelotToKeyName(to) ?? to,
      kind,
      transition,
      label: moveLabel(kind, from.letter),
      primary: kind !== 'diagonal' && kind !== 'semitone',
    };
  });
  return moves.sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind));
}

function moveLabel(kind: MoveKind, letter: 'A' | 'B'): string {
  switch (kind) {
    case 'same':
      return 'Same key';
    case 'down':
      return 'One step down';
    case 'up':
      return 'One step up';
    case 'relative':
      return letter === 'A' ? 'Relative major' : 'Relative minor';
    case 'boost':
      return 'Energy boost (+2)';
    case 'diagonal':
      return letter === 'A' ? 'Diagonal: one up, to major' : 'Diagonal: one down, to minor';
    case 'semitone':
      return 'Semitone lift (+7)';
  }
}
