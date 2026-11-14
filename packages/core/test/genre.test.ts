import { describe, expect, it, vi } from 'vitest';
import { analyzeGenres, cleanAlbum, cleanTitle, enrichTracks, memoryCache, type Tag } from '../src/index.js';
import { audio, ref } from './fixtures.js';

const tags = (...pairs: Array<[string, number]>): Tag[] => pairs.map(([name, count]) => ({ name, count }));

// Shapes taken from real Last.fm and ReccoBeats data.
const POST_MALONE = tags(['Hip-Hop', 100], ['rap', 84], ['trap', 40], ['pop', 36], ['cloud rap', 18], ['country', 12]);
const NOAH_KAHAN = tags(['singer-songwriter', 100], ['indie', 100], ['folk', 51], ['acoustic', 26]);

describe('analyzeGenres', () => {
  it("keeps a rapper's country song out of Rap", () => {
    const r = analyzeGenres({
      albumTags: tags(['2024', 100], ['country', 25]),
      artistTags: POST_MALONE,
      featuredTags: tags(['country', 100], ['pop', 20]),
      audio: audio({ speechiness: 0.0265 }),
    });
    expect(r.buckets).toEqual(['country']);
    expect(r.reasons).toContain('Album tagged country');
  });

  it('puts a rap song in Rap', () => {
    const r = analyzeGenres({ albumTags: tags(['hip-hop', 100], ['rap', 80]), artistTags: tags(['rap', 100], ['Hip-Hop', 90]), audio: audio({ speechiness: 0.257 }) });
    expect(r.buckets).toEqual(['hip-hop']);
    expect(r.confidence).toBe('high');
  });

  it("doesn't let a featured rapper decide the genre", () => {
    const r = analyzeGenres({ artistTags: NOAH_KAHAN, featuredTags: POST_MALONE, audio: audio({ speechiness: 0.029 }) });
    expect(r.buckets).not.toContain('hip-hop');
    expect(r.buckets).toEqual(expect.arrayContaining(['folk', 'indie']));
  });

  it('leaves a song out when the evidence is thin, and keeps its likely genres for review', () => {
    const r = analyzeGenres({ albumTags: tags(['vinyl', 100], ['folk', 4], ['pop', 4]) });
    expect(r.buckets).toEqual([]);
    expect(r.confidence).toBe('low');
    const mixed = analyzeGenres({ artistTags: tags(['rap', 100], ['Hip-Hop', 77], ['country rap', 26], ['country', 16]), audio: audio({ speechiness: 0.027 }) });
    expect(mixed.buckets).toEqual([]);
    expect(mixed.near).toContain('country');
  });

  it('puts a song in several genres when its own tags back each one', () => {
    const r = analyzeGenres({ songTags: tags(['country', 100], ['christian', 80], ['gospel', 30]), artistTags: tags(['country', 100], ['pop', 40]) });
    expect(r.buckets).toEqual(expect.arrayContaining(['country', 'worship']));
    const worshipBand = analyzeGenres({ artistTags: tags(['american', 100], ['soul', 100], ['praise and worship', 66], ['christian', 66], ['worship', 33]) });
    expect(worshipBand.buckets).toEqual(['worship']);
  });

  it("trusts the song's own tags over the artist's", () => {
    const r = analyzeGenres({ songTags: tags(['country', 100]), artistTags: POST_MALONE, audio: audio({ speechiness: 0.03 }) });
    expect(r.buckets).toEqual(['country']);
  });
});

describe('cleanTitle / cleanAlbum', () => {
  it('strips featuring credits, remaster and edit notes', () => {
    expect(cleanTitle('I Had Some Help (Feat. Morgan Wallen)')).toBe('I Had Some Help');
    expect(cleanTitle('Dial Drunk (with Post Malone)')).toBe('Dial Drunk');
    expect(cleanTitle('Let It Be - Remastered 2009')).toBe('Let It Be');
    expect(cleanTitle('rockstar (feat. 21 Savage)')).toBe('rockstar');
    expect(cleanTitle('Hey Jude')).toBe('Hey Jude');
    expect(cleanTitle('Smells Like Teen Spirit (Nevermind 30th)')).toBe('Smells Like Teen Spirit (Nevermind 30th)');
    expect(cleanAlbum('Curtain Call: The Hits (Deluxe Edition)')).toBe('Curtain Call: The Hits');
    expect(cleanAlbum('1989 (Taylor’s Version) [Deluxe]')).toBe('1989 (Taylor’s Version)');
  });
});

describe('enrichTracks tag lookups', () => {
  it('looks up the song, album and every artist on Last.fm, with cleaned names', async () => {
    const track = ref({
      id: 'h',
      name: 'I Had Some Help (Feat. Morgan Wallen)',
      artists: [
        { id: 'pm', name: 'Post Malone' },
        { id: 'mw', name: 'Morgan Wallen' },
      ],
      album: { name: 'F-1 Trillion', releaseDate: '2024-08-16', releaseDatePrecision: 'day', imageUrl: null },
    });
    const lastfm = {
      trackTopTags: vi.fn(async () => []),
      albumTopTags: vi.fn(async () => tags(['2024', 100], ['country', 25])),
      artistTopTags: vi.fn(async (name: string) => (name === 'Post Malone' ? POST_MALONE : tags(['country', 100]))),
    };
    const reccobeats = { audioFeatures: vi.fn(async (ids: readonly string[]) => new Map(ids.map((id) => [id, audio({ speechiness: 0.0265 })]))) };
    const { tracks } = await enrichTracks([track], { lastfm, reccobeats, musicbrainz: null, cache: memoryCache() });
    expect(lastfm.trackTopTags).toHaveBeenCalledWith('Post Malone', 'I Had Some Help');
    expect(lastfm.albumTopTags).toHaveBeenCalledWith('Post Malone', 'F-1 Trillion');
    expect(lastfm.artistTopTags).toHaveBeenCalledWith('Morgan Wallen');
    expect(tracks[0]?.genreBuckets).toEqual(['country']);
  });
});
