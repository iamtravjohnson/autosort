import { site } from '@/lib/site';

/** Real release history. Newest first. */

export type ChangeKind = 'New' | 'Improved' | 'Fixed';

export interface Release {
  /** Anchor id on /changelog and RSS guid. */
  id: string;
  product: 'App' | 'Engine' | 'Website';
  /** e.g. "v0.2.1"; the website entry uses its domain instead. */
  version: string;
  /** ISO date (YYYY-MM-DD). */
  date: string;
  title: string;
  latest?: boolean;
  items: Array<{ kind: ChangeKind; text: string }>;
  /** "Release notes on GitHub ↗" target. */
  notesUrl: string;
  npmUrl?: string;
}

export const releases: Release[] = [
  {
    id: 'app-v0-4-0',
    product: 'App',
    version: 'v0.4.0',
    date: '2026-11-14',
    title: 'Album mosaic covers and cleaning up your source',
    latest: true,
    items: [
      { kind: 'New', text: 'Choose a cover style in Settings: Spotify’s own album mosaic (the new default), a photo, or a designed cover. Switching existing playlists to mosaics rebuilds them as fresh copies with the same songs.' },
      { kind: 'New', text: 'Remove songs from your source playlist right from Unmatched, handy for versions Spotify no longer offers.' },
      { kind: 'Improved', text: 'A redesigned Add to menu: search, playlists grouped by genre, decade, mood and theme, covers and song counts, keyboard support and a bottom sheet on phones.' },
      { kind: 'Improved', text: 'Autopilot creates more of the playlists you’d expect (90s Country, Worship, Love Songs, Clean Rap) by scaling sizes to your library.' },
      { kind: 'New', text: 'Optional photo covers with your own OpenRouter key, and New covers for all to redo every cover at once.' },
    ],
    notesUrl: `${site.github}/tree/main/apps/web`,
  },
  {
    id: 'engine-v0-3-2',
    product: 'Engine',
    version: 'v0.3.2',
    date: '2026-11-14',
    title: 'Suggestions sized to your library',
    items: [
      { kind: 'Improved', text: 'suggestionSizes scales the minimum songs per suggestion with the library (for about 360 songs: genres 11, decades and clean versions 9, themes 6, moods 18) instead of a fixed 25.' },
      { kind: 'Improved', text: 'Near-duplicate genres are skipped, decade splits only come from big genres, and over the 30-suggestion cap the smallest decade and clean playlists go first.' },
    ],
    notesUrl: `${site.github}/commits/main/packages/core`,
    npmUrl: `${site.npm}/v/0.3.2`,
  },
  {
    id: 'engine-v0-3-1',
    product: 'Engine',
    version: 'v0.3.1',
    date: '2026-11-14',
    title: 'Genre fixes from the chart test',
    items: [
      { kind: 'Fixed', text: 'Negated tags like “not country” are ignored, and “Christian rock” or “gospel rap” count as Worship only.' },
      { kind: 'Fixed', text: 'Worship artists stay in Worship even when an album is tagged pop; metal needs energetic audio; second genres from the artist alone must be close to the top score.' },
      { kind: 'Improved', text: 'On 602 Billboard chart number ones, Rock wrong placements fell from 20 to 10 and Worship found went from 67% to 76%, with Country and Worship still at 0 wrong.' },
    ],
    notesUrl: `${site.github}/blob/main/packages/core/eval/RESULTS.md`,
    npmUrl: `${site.npm}/v/0.3.1`,
  },
  {
    id: 'app-v0-3-0',
    product: 'App',
    version: 'v0.3.0',
    date: '2026-11-14',
    title: 'Autopilot and Ask for a playlist',
    items: [
      { kind: 'New', text: 'Autopilot (on by default) creates every smart playlist AutoSort recommends and adds new ones as your library grows. Delete one and it won’t come back.' },
      { kind: 'New', text: 'Ask for a playlist in your own words, like “90s country love songs”. AutoSort turns it into rules and shows how many songs match.' },
      { kind: 'Improved', text: 'Live analysis progress that only moves forward, and the first analysis finishes every genre lookup.' },
      { kind: 'New', text: 'Serve AutoSort under a path on another site (BASE_PATH), with an optional Back link to it.' },
    ],
    notesUrl: `${site.github}/tree/main/apps/web`,
  },
  {
    id: 'app-v0-2-0',
    product: 'App',
    version: 'v0.2.0',
    date: '2026-11-14',
    title: 'Accurate genres, and removed songs stay removed',
    items: [
      { kind: 'Improved', text: 'Genre playlists use the new engine analyzer, so a rapper’s country song no longer lands in Rap.' },
      { kind: 'New', text: 'Delete a song from a smart playlist in Spotify and AutoSort won’t add it back. Songs you add by hand stay.' },
      { kind: 'New', text: 'The playlist editor shows why each song matched, plus an optional “Maybe these too?” list of songs AutoSort wasn’t sure about.' },
      { kind: 'Improved', text: 'Deploy to Vercel now asks for a free Last.fm key, which genre playlists need.' },
    ],
    notesUrl: `${site.github}/tree/main/apps/web`,
  },
  {
    id: 'engine-v0-3-0',
    product: 'Engine',
    version: 'v0.3.0',
    date: '2026-11-14',
    title: 'A new genre analyzer',
    items: [
      { kind: 'New', text: 'analyzeGenres scores each genre from the song’s own tags, then its album’s, then its main artist’s, and checks rap against how much rapping is in the audio.' },
      { kind: 'Improved', text: 'Featured artists barely count, a second genre needs the song’s own tags to back it, and thin evidence leaves a song out instead of misfiling it.' },
      { kind: 'New', text: 'Every track gets plain-English genreReasons and a genreNear list for optional review.' },
      { kind: 'Fixed', text: 'Spotify no longer returns artist genres to most apps, so that lookup is now off by default; Last.fm lookups use cleaned titles (no “feat.” or “Remastered”).' },
      { kind: 'New', text: 'planSmartPlaylist reports songs the user deleted (userRemovedTrackIds) so apps can keep them out.' },
    ],
    notesUrl: `${site.github}/commits/main/packages/core`,
    npmUrl: `${site.npm}/v/0.3.0`,
  },
  {
    id: 'app-v0-1-0',
    product: 'App',
    version: 'v0.1.0',
    date: '2026-11-14',
    title: 'Deploy your own AutoSort (early release)',
    items: [
      { kind: 'New', text: 'The self-hosted app, with one-click Deploy to Vercel. Vercel creates the database and the daily sync schedule for you.' },
      { kind: 'New', text: 'Smart playlists with a rule editor, suggestions, unmatched songs, undo for every sync, and family invites (up to 5 people).' },
      { kind: 'New', text: 'Sort any playlist by BPM, Camelot key, energy or date, then save the order back to Spotify.' },
      { kind: 'New', text: 'Optional photo covers for new smart playlists with your own OpenRouter key. Only the playlist name and rule are sent.' },
      { kind: 'New', text: 'One-click updates from Settings, after adding the Update AutoSort action to your repository once.' },
      { kind: 'New', text: 'Optional BASE_PATH, to show AutoSort under a path on another site you run.' },
    ],
    notesUrl: `${site.github}/tree/main/apps/web`,
  },
  {
    id: 'website-launch',
    product: 'Website',
    version: 'autosort.app',
    date: '2026-11-14',
    title: 'autosort.app launched',
    items: [{ kind: 'New', text: 'autosort.app is live, with guides, recipes, comparisons, docs and free tools.' }],
    notesUrl: `${site.github}/commits/main`,
  },
  {
    id: 'engine-v0-2-1',
    product: 'Engine',
    version: 'v0.2.1',
    date: '2026-11-13',
    title: 'Loads in more bundlers',
    items: [
      {
        kind: 'Improved',
        text: 'The package now has a "default" export condition, so bundlers that don’t match "import" (such as Next.js server builds) can load it.',
      },
      {
        kind: 'Fixed',
        text: 'Dropped the follow-up call that tried to force new playlists private. Spotify ignores the private flag for Development Mode apps, so it never worked.',
      },
    ],
    notesUrl: `${site.github}/commits/main/packages/core`,
    npmUrl: `${site.npm}/v/0.2.1`,
  },
  {
    id: 'engine-v0-2-0',
    product: 'Engine',
    version: 'v0.2.0',
    date: '2026-11-13',
    title: 'Full playlist editing',
    items: [
      { kind: 'New', text: 'Full-access Spotify scopes, so AutoSort can manage your library, not just read it.' },
      { kind: 'New', text: 'Save and remove Liked Songs, including saving songs with their original “date added”.' },
      { kind: 'New', text: 'Move songs up, down or to the top of a playlist.' },
      { kind: 'New', text: 'Rename playlists.' },
      { kind: 'New', text: 'Upload playlist cover images.' },
    ],
    notesUrl: `${site.github}/commits/main/packages/core`,
    npmUrl: `${site.npm}/v/0.2.0`,
  },
  {
    id: 'engine-v0-1-0',
    product: 'Engine',
    version: 'v0.1.0',
    date: '2026-11-13',
    title: 'First release',
    items: [
      { kind: 'New', text: 'A Spotify Web API client for playlists, songs and artist genres.' },
      { kind: 'New', text: 'Data lookups: BPM, key and energy from ReccoBeats, original release years from MusicBrainz, crowd tags from Last.fm.' },
      { kind: 'New', text: 'Rules for building smart playlists.' },
      { kind: 'New', text: 'Smart-playlist suggestions for a source playlist.' },
      { kind: 'New', text: 'Sorting by Camelot key (harmonic mix) and BPM.' },
      { kind: 'New', text: 'A daily sync planner that files new songs into matching playlists.' },
    ],
    notesUrl: `${site.github}/commits/main/packages/core`,
    npmUrl: `${site.npm}/v/0.1.0`,
  },
];

export const CHANGE_TAG_STYLE: Record<ChangeKind, { bg: string; fg: string }> = {
  New: { bg: '#241A3D', fg: '#C4B5FD' },
  Improved: { bg: 'rgba(56,189,248,0.14)', fg: '#7DD3FC' },
  Fixed: { bg: 'rgba(45,212,191,0.14)', fg: '#5EEAD4' },
};
