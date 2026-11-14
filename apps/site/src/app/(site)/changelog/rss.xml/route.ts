import { releases } from '@/content/changelog';
import { absoluteUrl, site } from '@/lib/site';

/** RSS 2.0 feed of the changelog. Static: built from src/content/changelog.ts. */

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const rfc822 = (iso: string) => new Date(`${iso}T12:00:00Z`).toUTCString();

export function GET() {
  const link = absoluteUrl('/changelog');
  const items = releases
    .map((r) => {
      const url = `${link}#${r.id}`;
      const body = r.items.map((it) => `${it.kind}: ${it.text}`).join('\n');
      return [
        '<item>',
        `<title>${esc(`${r.product} ${r.version}: ${r.title}`)}</title>`,
        `<link>${esc(url)}</link>`,
        `<guid isPermaLink="true">${esc(url)}</guid>`,
        `<pubDate>${rfc822(r.date)}</pubDate>`,
        `<description>${esc(body)}</description>`,
        '</item>',
      ].join('');
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${esc(`${site.name} changelog`)}</title>
<link>${esc(link)}</link>
<description>${esc('Releases of the AutoSort engine and website.')}</description>
<language>en-us</language>
<atom:link href="${esc(absoluteUrl('/changelog/rss.xml'))}" rel="self" type="application/rss+xml"/>
<lastBuildDate>${rfc822(releases[0]?.date ?? site.updated)}</lastBuildDate>
${items}
</channel>
</rss>
`;

  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
