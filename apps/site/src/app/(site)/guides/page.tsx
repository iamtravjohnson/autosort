import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs, JsonLd } from '@/components/seo';
import { QuickAnswer } from '@/components/ui';
import { FEATURED_GUIDE, getGuide, guideList, readMinutes } from '@/content/guides';
import { pageMetadata } from '@/lib/seo';
import { absoluteUrl } from '@/lib/site';

const PATH = '/guides';
const TITLE = 'Guides to organizing your Spotify library';
const DESCRIPTION =
  'Plain-English guides to splitting a big Spotify playlist, keeping smaller playlists updated, and ordering songs by BPM, energy or Camelot key.';

export const metadata: Metadata = pageMetadata({ title: TITLE, description: DESCRIPTION, path: PATH });

/** Decorative "one tall playlist fans out into many" art for the featured card. */
function FanOutArt() {
  return (
    <span
      aria-hidden="true"
      className="flex aspect-video flex-[0_1_320px] items-center justify-center gap-1.5 rounded-card bg-[radial-gradient(400px_220px_at_70%_50%,#4C1D95_0%,#141416_75%)]"
    >
      <span className="h-[110px] w-5 rounded-sm bg-accent" />
      <span className="h-0.5 w-6 bg-disabled" />
      <span className="flex flex-col gap-1.5">
        {['#D97706', '#0284C7', '#DB2777', '#0D9488'].map((c) => (
          <span key={c} className="h-4 w-[70px] rounded-art" style={{ background: c }} />
        ))}
      </span>
    </span>
  );
}

export default function GuidesPage() {
  const featured = getGuide(FEATURED_GUIDE);
  const list = guideList();

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-7 px-4 pb-10 pt-6 sm:px-6 sm:pb-16 sm:pt-8">
      <Breadcrumbs crumbs={[{ name: 'Home', href: '/' }, { name: 'Guides' }]} path={PATH} />

      <div className="flex max-w-[760px] flex-col gap-[18px]">
        <h1 className="m-0 text-[clamp(38px,5vw,60px)] font-extrabold leading-[1.04] tracking-[-0.035em]">{TITLE}</h1>
        <QuickAnswer>
          Practical, plain-English guides on splitting a big Spotify playlist into smaller ones, keeping them updated, and ordering songs
          by BPM, energy or Camelot key. Each guide works with or without AutoSort and shows where the app saves you time. Start with the
          big-playlist guide if you&apos;re new.
        </QuickAnswer>
      </div>

      {featured ? (
        <Link
          href={`/guides/${featured.slug}`}
          className="flex flex-wrap items-center gap-7 rounded-panel bg-surface-2 p-6 text-text-1 no-underline transition-colors duration-[120ms] hover:bg-[#222226] hover:text-text-1"
        >
          <FanOutArt />
          <span className="flex flex-[1_1_320px] flex-col gap-2.5">
            <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-accent-soft">Start here</span>
            <h2 className="m-0 text-[24px] font-extrabold leading-[1.1] tracking-[-0.02em] sm:text-[30px]">{featured.title}</h2>
            <span className="tnum text-[15px] text-text-2">
              {featured.summary} · {readMinutes(featured)} min read
            </span>
          </span>
        </Link>
      ) : null}

      <section aria-labelledby="all-guides" className="flex flex-col">
        <h2 id="all-guides" className="sr-only">
          More guides
        </h2>
        <ul className="m-0 flex list-none flex-col p-0">
          {list.map((g) => (
            <li key={g.href} className="border-t border-line">
              <Link
                href={g.href}
                className="group flex flex-wrap items-baseline gap-x-4 gap-y-1 px-1 py-[18px] text-text-1 no-underline hover:text-text-1"
              >
                <span className="w-[110px] text-[12px] font-bold uppercase tracking-[0.06em] text-text-3">{g.category}</span>
                <span className="flex-[1_1_360px] text-[18px] font-bold group-hover:text-accent-soft">{g.title}</span>
                <span className="tnum text-[13px] text-text-3">{g.minutes} min</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: TITLE,
          itemListElement: [...(featured ? [{ title: featured.title, href: `/guides/${featured.slug}` }] : []), ...list].map((g, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: g.title,
            url: absoluteUrl(g.href),
          })),
        }}
      />
    </div>
  );
}
