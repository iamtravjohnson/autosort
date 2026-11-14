import { site } from './site';

export interface NavLink {
  label: string;
  href: string;
}

/** Header links. */
export const mainNav: NavLink[] = [
  { label: 'Features', href: '/#how-it-works' },
  { label: 'Recipes', href: '/recipes' },
  { label: 'Camelot wheel', href: '/guides/camelot-wheel' },
  { label: 'Guides', href: '/guides' },
  { label: 'Docs', href: '/docs/quick-start' },
];

/** Footer columns, in design order. Every href is a real route on this site (or GitHub). */
export const footerNav: Array<{ heading: string; links: NavLink[] }> = [
  {
    heading: 'Product',
    links: [
      { label: 'Features', href: '/#how-it-works' },
      { label: 'Smart playlists', href: '/docs/how-it-works' },
      { label: 'Recipes', href: '/recipes' },
      { label: 'Changelog', href: '/changelog' },
      { label: 'Deploy your own', href: site.startPath },
    ],
  },
  {
    heading: 'Split',
    links: [
      { label: 'By genre', href: '/split/by-genre' },
      { label: 'By decade', href: '/split/by-decade' },
      { label: 'By mood', href: '/split/by-mood' },
      { label: 'Clean versions', href: '/split/clean-versions' },
      { label: 'Organize Liked Songs', href: '/split/liked-songs' },
    ],
  },
  {
    heading: 'Sort',
    links: [
      { label: 'By BPM', href: '/sort/by-bpm' },
      { label: 'By key', href: '/sort/by-key' },
      { label: 'By Camelot', href: '/sort/by-camelot' },
      { label: 'By energy', href: '/sort/by-energy' },
      { label: 'By date added', href: '/sort/by-date-added' },
      { label: 'By release date', href: '/sort/by-release-date' },
    ],
  },
  {
    heading: 'Learn',
    links: [
      { label: 'Docs', href: '/docs/quick-start' },
      { label: 'Guides', href: '/guides' },
      { label: 'Camelot wheel', href: '/guides/camelot-wheel' },
      { label: 'Camelot converter', href: '/tools/camelot-converter' },
      { label: 'BPM & key finder', href: '/tools/bpm-key-finder' },
    ],
  },
  {
    heading: 'Compare',
    links: [
      { label: 'vs Smart Reorder', href: '/compare/smart-reorder' },
      { label: 'vs Free Your Music', href: '/compare/free-your-music' },
      { label: 'vs Skiley', href: '/compare/skiley' },
      { label: 'vs PlaylistSorter', href: '/compare/playlistsorter' },
      { label: 'vs SortByTune', href: '/compare/sortbytune' },
      { label: 'Sort Your Music alternative', href: '/compare/sort-your-music-alternative' },
    ],
  },
  {
    heading: 'Project',
    links: [
      { label: 'Open source', href: '/open-source' },
      { label: 'About', href: '/about' },
      { label: 'Sponsor', href: '/open-source#support' },
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
    ],
  },
];

/** Docs sidebar. Only pages that exist are listed. */
export const docsNav: Array<{ heading: string; links: NavLink[] }> = [
  {
    heading: 'Getting started',
    links: [
      { label: 'Quick start', href: '/docs/quick-start' },
      { label: 'Create your Spotify app', href: '/docs/spotify-app' },
      { label: 'Add family members', href: '/docs/family' },
    ],
  },
  {
    heading: 'Concepts',
    links: [{ label: 'How smart playlists work', href: '/docs/how-it-works' }],
  },
  {
    heading: 'Maintain',
    links: [
      { label: 'Updating your AutoSort', href: '/docs/updating' },
      { label: 'Troubleshooting', href: '/docs/troubleshooting' },
    ],
  },
];
