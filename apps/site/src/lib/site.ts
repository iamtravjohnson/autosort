export const site = {
  name: 'AutoSort',
  url: 'https://autosort.app',
  tagline: 'Spotify playlist organizer',
  description:
    'Turn one giant Spotify playlist into smart playlists that stay organized by genre, decade, mood, BPM and Camelot key. Free, open source and self-hosted.',
  github: 'https://github.com/iamtravjohnson/autosort',
  githubRepo: 'iamtravjohnson/autosort',
  npm: 'https://www.npmjs.com/package/@autosort/core',
  license: 'MIT',
  founder: { name: 'Travis Johnson', url: 'https://travisjohnson.com' },
  disclaimer: 'AutoSort is an independent open-source project, not affiliated with or endorsed by Spotify.',
  /** Where "Deploy your own" goes. */
  startPath: '/start',
  /** When the content was last reviewed (shown as "Updated …"). */
  updated: '2026-11-14',
} as const;

export function absoluteUrl(path: string): string {
  return new URL(path, site.url).toString();
}

export function formatDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}
