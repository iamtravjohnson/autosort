import { describe, expect, it } from 'vitest';
import { diffPlaylist, planSmartPlaylist, suggestPlaylists, unmatchedTracks, type SmartPlaylistDefinition } from '../src/index.js';
import { facts, ref } from './fixtures.js';

const day = (d: number) => new Date(Date.UTC(2024, 0, 1) + d * 86_400_000).toISOString();

function favs() {
  const list = [];
  let i = 0;
  for (let k = 0; k < 30; k++) list.push(facts({ genres: ['country'], releaseDate: `199${k % 10}`, addedAt: day(i++) }));
  for (let k = 0; k < 10; k++) list.push(facts({ genres: ['country'], releaseDate: '2012', addedAt: day(i++) }));
  for (let k = 0; k < 60; k++) list.push(facts({ genres: ['hip hop'], explicit: k < 20, addedAt: day(i++) }));
  for (let k = 0; k < 30; k++) list.push(facts({ genres: ['worship'], addedAt: day(i++) }));
  for (let k = 0; k < 10; k++) list.push(facts({ genres: ['pop'], addedAt: day(i++) }));
  return list;
}

describe('suggestPlaylists', () => {
  it('suggests genres, decades and clean versions from a Favs-style playlist', () => {
    const names = suggestPlaylists(favs()).map((s) => s.name);
    expect(names).toEqual(expect.arrayContaining(['Country', '90s Country', 'Rap', 'Clean Rap', 'Worship']));
    expect(names).not.toContain('Pop'); // only 10 songs
    expect(names.filter((n) => n === 'Worship')).toHaveLength(1); // genre and theme not duplicated
  });

  it('skips rules that already have playlists and reports counts and samples', () => {
    const all = suggestPlaylists(favs());
    const country = all.find((s) => s.name === 'Country');
    expect(country?.count).toBe(40);
    expect(country?.sampleTrackIds).toHaveLength(3);
    const rest = suggestPlaylists(favs(), { existingRules: [country!.rule] }).map((s) => s.name);
    expect(rest).not.toContain('Country');
    expect(rest).toContain('90s Country');
  });

  it('finds unmatched songs', () => {
    const list = favs();
    const rules = suggestPlaylists(list).map((s) => s.rule);
    expect(unmatchedTracks(list, rules)).toHaveLength(10); // the pop songs
  });
});

describe('diffPlaylist', () => {
  it.each([
    [['a', 'b'], ['a', 'b'], 'noop'],
    [['a', 'b'], ['x', 'a', 'b'], 'prepend'],
    [['a', 'b'], ['a', 'b', 'x'], 'append'],
    [['a', 'b', 'c'], ['a', 'c'], 'remove'],
    [['a', 'b'], ['b', 'a'], 'replace'],
    [['a', 'a'], ['a'], 'replace'],
    [[], ['a', 'b'], 'prepend'],
  ])('%j → %j is %s', (current, desired, kind) => {
    expect(diffPlaylist(current, desired).kind).toBe(kind);
  });
});

describe('planSmartPlaylist', () => {
  const def: SmartPlaylistDefinition = {
    id: 'country',
    name: 'Country',
    rule: { match: 'all', conditions: [{ field: 'genre', in: ['country'] }] },
    order: { by: 'addedAt', direction: 'desc' },
  };
  const c1 = facts({ id: 'c1', genres: ['country'], addedAt: day(1) });
  const c2 = facts({ id: 'c2', genres: ['country'], addedAt: day(2) });
  const r1 = facts({ id: 'r1', genres: ['rap'], addedAt: day(3) });

  it('fills a new playlist, then is a no-op on the next run', () => {
    const first = planSmartPlaylist({ definition: def, sourceTracks: [c1, c2, r1], currentTracks: [] });
    expect(first.desiredUris).toEqual([c2.uri, c1.uri]);
    expect(first.nextState.managedTrackIds).toEqual(['c2', 'c1']);
    const second = planSmartPlaylist({ definition: def, sourceTracks: [c1, c2, r1], currentTracks: [c2, c1], state: first.nextState });
    expect(second.change.kind).toBe('noop');
  });

  it('prepends a newly added song and removes one that left the source', () => {
    const c3 = facts({ id: 'c3', genres: ['country'], addedAt: day(9) });
    const state = { managedTrackIds: ['c2', 'c1'] };
    const added = planSmartPlaylist({ definition: def, sourceTracks: [c1, c2, c3], currentTracks: [c2, c1], state });
    expect(added.change).toEqual({ kind: 'prepend', uris: [c3.uri] });
    const removed = planSmartPlaylist({ definition: def, sourceTracks: [c2], currentTracks: [c2, c1], state });
    expect(removed.change).toEqual({ kind: 'remove', uris: [c1.uri] });
  });

  it('keeps songs added by hand and respects sync settings and overrides', () => {
    const manual = ref({ id: 'm1', addedAt: day(5) });
    const state = { managedTrackIds: ['c2', 'c1'] };
    const plan = planSmartPlaylist({ definition: def, sourceTracks: [c1, c2], currentTracks: [c2, c1, manual], state });
    expect(plan.desiredUris).toContain(manual.uri);
    expect(plan.nextState.managedTrackIds).not.toContain('m1');

    const keepGone = planSmartPlaylist({ definition: { ...def, sync: { removeMissing: false } }, sourceTracks: [c2], currentTracks: [c2, c1], state });
    expect(keepGone.change.kind).toBe('noop');

    const excluded = planSmartPlaylist({ definition: { ...def, exclude: ['c1'] }, sourceTracks: [c1, c2], currentTracks: [] });
    expect(excluded.desiredUris).toEqual([c2.uri]);

    const included = planSmartPlaylist({ definition: { ...def, include: ['r1'] }, sourceTracks: [c1, r1], currentTracks: [] });
    expect(included.desiredUris).toEqual([r1.uri, c1.uri]);

    const frozen = planSmartPlaylist({ definition: { ...def, sync: { addNew: false } }, sourceTracks: [c1, c2], currentTracks: [c1], state: { managedTrackIds: ['c1'] } });
    expect(frozen.desiredUris).toEqual([c1.uri]);
  });
});
