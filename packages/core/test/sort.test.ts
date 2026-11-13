import { describe, expect, it } from 'vitest';
import { sortTracks, transition } from '../src/index.js';
import { facts } from './fixtures.js';

const ids = (list: Array<{ id: string }>) => list.map((t) => t.id);

describe('sortTracks', () => {
  const a = facts({ id: 'a', audio: { tempo: 128, energy: 0.6 }, addedAt: '2024-01-03T00:00:00Z' });
  const b = facts({ id: 'b', audio: { tempo: 90, energy: 0.3 }, addedAt: '2024-01-01T00:00:00Z' });
  const c = facts({ id: 'c', audio: null, addedAt: '2024-01-02T00:00:00Z' });
  const d = facts({ id: 'd', audio: { tempo: 174, energy: 0.9 }, addedAt: '2024-01-04T00:00:00Z' });

  it('sorts by BPM with missing data last in both directions', () => {
    expect(ids(sortTracks([a, b, c, d], { by: 'bpm' }))).toEqual(['b', 'a', 'd', 'c']);
    expect(ids(sortTracks([a, b, c, d], { by: 'bpm', direction: 'desc' }))).toEqual(['d', 'a', 'b', 'c']);
  });

  it('defaults date added to newest first', () => {
    expect(ids(sortTracks([a, b, c, d], { by: 'addedAt' }))).toEqual(['d', 'a', 'c', 'b']);
  });

  it('keeps pinned tracks in place', () => {
    expect(ids(sortTracks([a, b, c, d], { by: 'bpm' }, { pinned: { d: 0 } }))).toEqual(['d', 'b', 'a', 'c']);
  });

  it('does not mutate the input', () => {
    const input = [a, b, c, d];
    sortTracks(input, { by: 'bpm' });
    expect(ids(input)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('builds a mountain-shaped energy arc', () => {
    const list = [0.1, 0.9, 0.3, 0.7, 0.5, 0.2, 0.8].map((energy, i) => facts({ id: `e${i}`, audio: { energy } }));
    const energies = sortTracks(list, { by: 'energyArc', shape: 'mountain' }).map((t) => t.audio?.energy as number);
    const peak = energies.indexOf(Math.max(...energies));
    expect(peak).toBeGreaterThan(0);
    expect(peak).toBeLessThan(energies.length - 1);
    expect(energies[0]).toBeLessThan(energies[peak] as number);
    expect(energies.at(-1)).toBeLessThan(energies[peak] as number);
  });

  it('shuffles deterministically with a seed', () => {
    const list = Array.from({ length: 20 }, (_, i) => facts({ id: `s${i}` }));
    const one = ids(sortTracks(list, { by: 'shuffle', seed: 42 }));
    expect(one).toEqual(ids(sortTracks(list, { by: 'shuffle', seed: 42 })));
    expect([...one].sort()).toEqual(ids(list).sort());
    expect(one).not.toEqual(ids(list));
  });

  it('mixes harmonically with no key clashes when a path exists', () => {
    // Keys: C major 8B, G major 9B, D major 10B, A minor 8A, E minor 9A, B minor 10A
    const keys: Array<[number, number]> = [[2, 1], [9, 0], [7, 1], [4, 0], [0, 1], [11, 0]];
    const list = keys.map(([key, mode], i) => facts({ id: `h${i}`, audio: { key, mode, tempo: 120 + i, energy: 0.4 + i * 0.05 } }));
    const sorted = sortTracks(list, { by: 'harmonic', startKey: '8A' });
    expect(sorted[0]?.camelot).toBe('8A');
    for (let i = 1; i < sorted.length; i++) {
      expect(transition(sorted[i - 1]?.camelot as string, sorted[i]?.camelot as string)).not.toBe('clash');
    }
  });
});
