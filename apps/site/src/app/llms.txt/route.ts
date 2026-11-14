import { docsPages } from '@/components/docs/docs-index';
import { comparisons } from '@/content/compare';
import { featurePages, featurePath } from '@/content/features';
import { guides } from '@/content/guides';
import { recipes } from '@/content/recipes';
import { absoluteUrl, site } from '@/lib/site';

/** llms.txt (https://llmstxt.org): a plain-text map of the site for AI assistants and answer engines. */
export function GET() {
  const link = (title: string, path: string, note?: string) => `- [${title}](${absoluteUrl(path)})${note ? `: ${note}` : ''}`;
  const body = [
    `# ${site.name}`,
    '',
    `> ${site.description}`,
    '',
    'AutoSort is free and open source (MIT). Each family runs its own copy with its own free Spotify developer app; Spotify allows up to 5 users per developer app in Development Mode, and the app owner needs Spotify Premium.',
    'It reads one source playlist (the one you keep adding to) or Liked Songs, and keeps smart playlists such as Country, 90s Country, Clean Rap, Worship, Workout and Love Songs up to date every day. It also sorts playlists by BPM, key (Camelot wheel), energy, date added and release date.',
    'Data sources: Spotify Web API (playlists, explicit flag, release dates), ReccoBeats (tempo, key, energy, valence, speechiness), MusicBrainz (original release years) and Last.fm (crowd tags for each song, album and artist, which decide genres). AutoSort does not send Spotify data to AI models; smart playlists are built from editable rules.',
    `Status: the engine, @autosort/core, is published on npm and runs the founder's family setup. The one-click self-hosted app is in development. Source: ${site.github}`,
    '',
    '## Start here',
    link('Home', '/', 'what AutoSort does'),
    link('Get started', '/start', 'what you need to run your own copy'),
    link('Quick start (docs)', '/docs/quick-start'),
    '',
    '## Split a playlist',
    ...featurePages.filter((p) => p.kind === 'split').map((p) => link(p.h1, featurePath(p))),
    '',
    '## Sort a playlist',
    ...featurePages.filter((p) => p.kind === 'sort').map((p) => link(p.h1, featurePath(p))),
    '',
    '## Guides',
    link('The Camelot wheel: harmonic mixing, explained', '/guides/camelot-wheel'),
    ...guides.map((g) => link(g.title, `/guides/${g.slug}`)),
    '',
    '## Free tools',
    link('Camelot key converter', '/tools/camelot-converter'),
    link('Spotify BPM and key finder', '/tools/bpm-key-finder'),
    '',
    '## Smart playlist recipes',
    ...recipes.map((r) => link(r.name, `/recipes/${r.slug}`, r.description)),
    '',
    '## Comparisons',
    ...comparisons.map((c) => link(c.h1, `/compare/${c.slug}`)),
    '',
    '## Docs',
    ...docsPages.map((d) => link(d.label, d.href)),
    '',
    '## Project',
    link('Open source', '/open-source'),
    link('About', '/about'),
    link('Changelog', '/changelog'),
    '',
    site.disclaimer,
    '',
  ].join('\n');

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, s-maxage=86400' } });
}
