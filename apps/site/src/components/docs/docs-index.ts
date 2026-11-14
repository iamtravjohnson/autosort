import { docsNav } from '@/lib/routes';
import { site } from '@/lib/site';

export interface DocsEntry {
  label: string;
  href: string;
  group: string;
  /** Extra words the docs search matches on (error codes, env vars, synonyms). */
  keywords: string;
}

const KEYWORDS: Record<string, string> = {
  '/docs/quick-start':
    'setup install deploy vercel self-host environment variables env SPOTIFY_CLIENT_ID SPOTIFY_CLIENT_SECRET DATABASE_URL AUTH_SECRET LASTFM_API_KEY redirect uri local run git clone premium requirements',
  '/docs/spotify-app':
    'spotify developer dashboard create app client id client secret web api redirect uri premium development mode account requirements form fields',
  '/docs/family': 'family members invite users user management email 5 users five people share household 403',
  '/docs/how-it-works':
    'smart playlists rules genre decade release year mood energy bpm tempo camelot key clean explicit last.fm tags reccobeats musicbrainz daily sync unmatched pin exclude overrides',
  '/docs/updating': 'update upgrade new version github actions update autosort workflow run redeploy vercel rollback instant rollback changelog',
  '/docs/troubleshooting':
    'errors problems 403 not registered INVALID_CLIENT invalid redirect uri 429 rate limit too many requests retry-after daily sync cron not running public playlists private',
};

/** Every docs page in sidebar order, with its group. Built from the canonical `docsNav`. */
export const docsPages: DocsEntry[] = docsNav.flatMap((g) =>
  g.links.map((l) => ({ label: l.label, href: l.href, group: g.heading, keywords: KEYWORDS[l.href] ?? '' })),
);

export function docsEntry(href: string): DocsEntry | undefined {
  return docsPages.find((p) => p.href === href);
}

/** Previous and next pages for the pagination cards. */
export function docsPager(href: string): { prev?: DocsEntry; next?: DocsEntry } {
  const i = docsPages.findIndex((p) => p.href === href);
  if (i < 0) return {};
  return { prev: docsPages[i - 1], next: docsPages[i + 1] };
}

/** Case-insensitive match on every word of the query against label, group and keywords. */
export function matchesDocsQuery(entry: DocsEntry, query: string): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = `${entry.label} ${entry.group} ${entry.keywords}`.toLowerCase();
  return words.every((w) => haystack.includes(w));
}

/** "Edit this page on GitHub" target for a docs route, e.g. /docs/family. */
export function docsEditUrl(href: string): string {
  return `${site.github}/edit/main/apps/site/src/app${href}/page.tsx`;
}

/** The redirect URI the docs use as an example. */
export const EXAMPLE_REDIRECT_URI = 'https://your-autosort.vercel.app/api/auth/callback/spotify';
export const LOCAL_REDIRECT_URI = 'http://127.0.0.1:3000/api/auth/callback/spotify';
