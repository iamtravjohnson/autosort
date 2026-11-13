import { describe, expect, it } from 'vitest';
import { genreBucketsFor, matchesRule, parseRule, ruleChips, ruleKey, type Rule } from '../src/index.js';
import { facts } from './fixtures.js';

describe('genre buckets', () => {
  it('maps Spotify genres to buckets', () => {
    expect(genreBucketsFor(['contemporary country', 'southern hip hop', 'christian music']).sort()).toEqual(
      ['country', 'hip-hop', 'worship'].sort(),
    );
  });
  it('avoids common false matches', () => {
    expect(genreBucketsFor(['rhythm and blues'])).toEqual(['r&b']);
    expect(genreBucketsFor(['dubstep'])).toEqual(['electronic']);
  });
});

describe('classifyTrack', () => {
  it('prefers the original release year over a later compilation', () => {
    const t = facts({ releaseDate: '2015-03-01', originalYear: 1994 });
    expect(t).toMatchObject({ year: 1994, decade: 1990, yearSource: 'original' });
  });
  it('ignores an "original" year later than the album', () => {
    expect(facts({ releaseDate: '1996', originalYear: 2004 })).toMatchObject({ year: 1996, yearSource: 'album' });
  });
  it('derives moods from audio and tags', () => {
    expect(facts({ audio: { valence: 0.8, energy: 0.7 } }).moods).toContain('happy');
    expect(facts({ audio: { tempo: 70, energy: 0.85 } }).moods).toContain('workout'); // half-time 140
    expect(facts({ tags: ['sad'] }).moods).toContain('sad');
  });
  it('derives themes from tags, titles and genres', () => {
    expect(facts({ tags: ['love songs'] }).themes).toContain('love');
    expect(facts({ name: 'I Will Always Love You' }).themes).toContain('love');
    expect(facts({ genres: ['worship'] }).themes).toContain('worship');
    expect(facts({ tags: [{ name: 'love', count: 5 }] }).themes).not.toContain('love'); // weak tag ignored
  });
  it('computes the Camelot key', () => {
    expect(facts({ audio: { key: 9, mode: 0 } }).camelot).toBe('8A');
  });
});

describe('rules', () => {
  const country90s = facts({ genres: ['country'], releaseDate: '1995-01-01' });
  const outlaw = facts({ genres: ['outlaw country'], releaseDate: '1978' });
  const rapExplicit = facts({ genres: ['rap'], explicit: true, audio: { tempo: 95 } });
  const rapClean = facts({ genres: ['rap'], explicit: false });

  const cleanRap: Rule = { match: 'all', conditions: [{ field: 'genre', in: ['hip-hop'] }, { field: 'explicit', is: false }] };

  it('matches buckets, raw genres and decades', () => {
    expect(matchesRule(country90s, { match: 'all', conditions: [{ field: 'genre', in: ['country'] }, { field: 'decade', in: [1990] }] })).toBe(true);
    expect(matchesRule(outlaw, { match: 'all', conditions: [{ field: 'genre', in: ['outlaw'] }] })).toBe(true);
    expect(matchesRule(country90s, { match: 'all', conditions: [{ field: 'genre', in: ['outlaw'] }] })).toBe(false);
  });

  it('handles clean versions, exclusions and nesting', () => {
    expect(matchesRule(rapClean, cleanRap)).toBe(true);
    expect(matchesRule(rapExplicit, cleanRap)).toBe(false);
    const notRap: Rule = { match: 'all', conditions: [{ field: 'genre', notIn: ['hip-hop'] }] };
    expect(matchesRule(country90s, notRap)).toBe(true);
    const nested: Rule = { match: 'any', conditions: [cleanRap, { match: 'all', conditions: [{ field: 'decade', in: [1970] }] }] };
    expect(matchesRule(outlaw, nested)).toBe(true);
    expect(matchesRule(rapExplicit, nested)).toBe(false);
  });

  it('does not match numeric conditions without audio data', () => {
    expect(matchesRule(rapClean, { match: 'all', conditions: [{ field: 'bpm', min: 80 }] })).toBe(false);
    expect(matchesRule(rapExplicit, { match: 'all', conditions: [{ field: 'bpm', min: 80, max: 100 }] })).toBe(true);
  });

  it('validates rules and gives stable keys and chips', () => {
    expect(() => parseRule({ match: 'all', conditions: [{ field: 'nope' }] })).toThrow();
    expect(parseRule(cleanRap)).toEqual(cleanRap);
    const reordered = JSON.parse('{"conditions":[{"in":["hip-hop"],"field":"genre"},{"is":false,"field":"explicit"}],"match":"all"}');
    expect(ruleKey(reordered)).toBe(ruleKey(cleanRap));
    expect(ruleChips(cleanRap)).toEqual(['Genre: Rap', 'Clean only']);
    expect(ruleChips({ match: 'all', conditions: [{ field: 'decade', in: [1990] }] })).toEqual(['Decade: 90s']);
  });
});
