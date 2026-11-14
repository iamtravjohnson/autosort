/**
 * One-click "Deploy to Vercel": copies apps/web into the person's own GitHub, asks for the two
 * Spotify keys and creates a Neon Postgres database through Vercel's Marketplace.
 */
const deployUrl = `https://vercel.com/new/clone?${new URLSearchParams({
  'repository-url': 'https://github.com/iamtravjohnson/autosort/tree/main/apps/web',
  'project-name': 'autosort',
  'repository-name': 'autosort',
  env: 'SPOTIFY_CLIENT_ID,SPOTIFY_CLIENT_SECRET',
  envDescription: 'The Client ID and Client Secret from your Spotify developer app',
  envLink: 'https://autosort.app/docs/spotify-app',
  stores: JSON.stringify([{ type: 'integration', integrationSlug: 'neon', productSlug: 'neon', protocol: 'storage' }]),
})}`;

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
  founder: {
    name: 'Travis Johnson',
    url: 'https://travisjohnson.com',
    twitter: '@iamtravjohnson',
    twitterUrl: 'https://x.com/iamtravjohnson',
    github: 'https://github.com/iamtravjohnson',
  },
  disclaimer: 'AutoSort is an independent open-source project, not affiliated with or endorsed by Spotify.',
  deployUrl,
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
