import { describe, expect, it } from 'vitest';
import { camelotTable, camelotToKeyName, camelotToOpenKey, compatibleKeys, toCamelot, transition } from '../src/index.js';

describe('toCamelot', () => {
  it('maps keys to the wheel', () => {
    expect(toCamelot(9, 0)).toBe('8A'); // A minor
    expect(toCamelot(0, 1)).toBe('8B'); // C major
    expect(toCamelot(4, 0)).toBe('9A'); // E minor
    expect(toCamelot(7, 1)).toBe('9B'); // G major
    expect(toCamelot(1, 1)).toBe('3B'); // D♭ major
    expect(toCamelot(8, 0)).toBe('1A'); // A♭ minor
    expect(toCamelot(-1, 1)).toBeNull();
  });

  it('covers all 24 codes exactly once', () => {
    const codes = new Set<string>();
    for (let key = 0; key < 12; key++) for (const mode of [0, 1]) codes.add(toCamelot(key, mode) as string);
    expect(codes.size).toBe(24);
  });

  it('round-trips names and Open Key', () => {
    expect(camelotToKeyName('8A')).toBe('A minor');
    expect(camelotToKeyName('8B')).toBe('C major');
    expect(camelotToOpenKey('8B')).toBe('1d');
    expect(camelotToOpenKey('8A')).toBe('1m');
    expect(camelotToOpenKey('7B')).toBe('12d');
    expect(camelotTable()).toHaveLength(24);
  });
});

describe('transition', () => {
  it.each([
    ['8A', '8A', 'perfect'],
    ['8A', '9A', 'adjacent'],
    ['8A', '7A', 'adjacent'],
    ['12A', '1A', 'adjacent'],
    ['8A', '8B', 'relative'],
    ['8A', '9B', 'diagonal'],
    ['8B', '7A', 'diagonal'],
    ['8A', '10A', 'boost'],
    ['8A', '3A', 'boost'],
    ['8A', '5B', 'clash'],
  ])('%s → %s is %s', (from, to, expected) => {
    expect(transition(from, to)).toBe(expected);
  });

  it('lists compatible keys best-first', () => {
    const keys = compatibleKeys('8A').map((k) => k.code);
    expect(keys[0]).toBe('8A');
    expect(keys).toEqual(expect.arrayContaining(['7A', '9A', '8B', '9B', '10A', '3A']));
    expect(keys).not.toContain('5B');
  });
});
