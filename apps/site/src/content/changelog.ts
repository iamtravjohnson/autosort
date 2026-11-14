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
      { kind: 'New', text: 'An Update AutoSort action in your repository to pull in new versions with one click.' },
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
    latest: true,
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
