import Link from 'next/link';
import { Suspense } from 'react';
import { ContributorList, ContributorListFallback, RepoStatsGrid, SponsorHeart, StatsGrid } from '@/components/pages/open-source';
import { Breadcrumbs, JsonLd } from '@/components/seo';
import { ButtonLink, QuickAnswer } from '@/components/ui';
import { pageMetadata, sourceCodeJsonLd } from '@/lib/seo';
import { site } from '@/lib/site';

export const metadata = pageMetadata({
  title: 'An open-source Spotify playlist organizer',
  description:
    'AutoSort is MIT-licensed and fully open source on GitHub. See live stats, the honest roadmap, how to contribute and how to support the project.',
  path: '/open-source',
});

const SPONSOR_URL = 'https://github.com/sponsors/iamtravjohnson';

const H2 = 'm-0 text-[26px] font-extrabold tracking-[-0.03em] sm:text-[32px]';

const contribute = [
  {
    title: 'Report a bug',
    body: 'Open an issue with what you ran, what you expected and what happened instead. Include your @autosort/core version.',
    link: { label: 'Open an issue ↗', href: `${site.github}/issues/new` },
  },
  {
    title: 'Share a recipe',
    body: 'Have a smart playlist that works for your family? Open an issue with its rules (for example Genre: Country, Decade: 1990s) so others can use it.',
    link: { label: 'Suggest a recipe ↗', href: `${site.github}/issues/new` },
  },
  {
    title: 'Write code',
    body: 'The engine is TypeScript with unit tests, in packages/core. Open an issue to talk through a change, then send a pull request.',
    link: { label: 'Read the code ↗', href: `${site.github}/tree/main/packages/core` },
  },
];

const roadmap = [
  {
    heading: 'Shipped',
    bg: 'rgba(45,212,191,0.14)',
    fg: '#5EEAD4',
    items: ['The engine, @autosort/core, on npm', 'The family instance in JohnsonOS, the founder’s household dashboard', 'Full playlist editing: rename, covers, move songs, Liked Songs'],
  },
  {
    heading: 'Next',
    bg: '#241A3D',
    fg: '#C4B5FD',
    items: ['The self-hosted app, with one-click Deploy to Vercel'],
  },
  {
    heading: 'After that',
    bg: '#26262A',
    fg: '#B3B3B8',
    items: ['More free tools on autosort.app'],
  },
];

export default function OpenSourcePage() {
  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-10 px-4 pb-10 pt-6 sm:px-6 sm:pb-16 sm:pt-8">
      <Breadcrumbs crumbs={[{ name: 'Home', href: '/' }, { name: 'Open source' }]} path="/open-source" />
      <JsonLd data={sourceCodeJsonLd()} />

      <div className="flex flex-wrap items-end gap-8">
        <div className="flex min-w-0 flex-[1_1_520px] flex-col gap-[18px]">
          <h1 className="m-0 text-[clamp(38px,5vw,60px)] font-extrabold leading-[1.04] tracking-[-0.035em]">An open-source Spotify playlist organizer</h1>
          <QuickAnswer>
            All of AutoSort&apos;s code is public on GitHub under the MIT license. You can read it, run it, change it and contribute back. The
            engine, @autosort/core, is published on npm, and the one-click self-hosted app is being finished now. There&apos;s no paid
            version and no central AutoSort server.
          </QuickAnswer>
        </div>
        <Suspense fallback={<StatsGrid />}>
          <RepoStatsGrid />
        </Suspense>
      </div>

      <section aria-labelledby="h-contrib" className="flex flex-col gap-4">
        <h2 id="h-contrib" className={H2}>
          How to contribute
        </h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
          {contribute.map((c) => (
            <div key={c.title} className="flex flex-col gap-2 rounded-card bg-surface-1 p-[22px]">
              <h3 className="m-0 text-[18px] font-bold">{c.title}</h3>
              <p className="m-0 text-[14px] leading-[1.55] text-text-2">{c.body}</p>
              <a href={c.link.href} target="_blank" rel="noopener noreferrer" className="mt-auto text-[14px] font-bold">
                {c.link.label}
              </a>
            </div>
          ))}
        </div>
        <div className="overflow-hidden rounded-card border border-white/12">
          <div className="bg-surface-2 px-3.5 py-2 text-[12px] font-semibold text-text-3">Run the engine&apos;s tests locally</div>
          <pre className="m-0 overflow-x-auto bg-surface-1 p-4 font-mono text-[13.5px] leading-[1.7] text-[#E4E4E7]">
            <span className="text-text-3">$</span>
            {` git clone ${site.github}\n`}
            <span className="text-text-3">$</span>
            {' cd autosort && pnpm install && pnpm test'}
          </pre>
        </div>
      </section>

      <section aria-labelledby="h-road" className="flex flex-col gap-4">
        <h2 id="h-road" className={H2}>
          Roadmap
        </h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
          {roadmap.map((col) => (
            <div key={col.heading} className="flex flex-col gap-2.5 rounded-card bg-surface-1 p-5">
              <h3 className="m-0 self-start rounded-pill px-2.5 py-1 text-[12px] font-bold" style={{ background: col.bg, color: col.fg }}>
                {col.heading}
              </h3>
              <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                {col.items.map((it) => (
                  <li key={it} className="rounded-sm bg-surface-2 p-3 text-[14px] font-semibold">
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="m-0 text-[13px] text-text-3">
          What shipped when is in the <Link href="/changelog">changelog</Link>. Follow along on{' '}
          <a href={site.github} target="_blank" rel="noopener noreferrer">
            GitHub ↗
          </a>
          .
        </p>
      </section>

      <section aria-labelledby="h-people" className="flex flex-col gap-4">
        <h2 id="h-people" className={H2}>
          Contributors
        </h2>
        <Suspense fallback={<ContributorListFallback />}>
          <ContributorList />
        </Suspense>
        <p className="m-0 text-[13px] text-text-3">
          From the GitHub contributors list, refreshed every few hours.{' '}
          <a href={`${site.github}/graphs/contributors`} target="_blank" rel="noopener noreferrer">
            See everyone on GitHub ↗
          </a>
        </p>
      </section>

      <section id="support" aria-labelledby="h-sponsor" className="flex scroll-mt-24 flex-wrap items-center gap-6 rounded-panel bg-surface-2 p-[18px] sm:p-7">
        <SponsorHeart size={44} />
        <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-1.5">
          <h2 id="h-sponsor" className="m-0 text-[24px] font-extrabold">
            Support the project
          </h2>
          <p className="m-0 text-[15px] leading-[1.55] text-text-2">
            AutoSort will always be free. If it helps your family&apos;s music, a GitHub Sponsorship helps keep it maintained.
          </p>
          <p className="m-0 text-[13px] leading-[1.55] text-text-3">
            Sponsorship may not be set up yet. If the link doesn&apos;t work, a star on GitHub or a good bug report helps just as much.
          </p>
        </div>
        <ButtonLink href={SPONSOR_URL} variant="sponsor" className="gap-2.5">
          <SponsorHeart />
          Sponsor on GitHub
        </ButtonLink>
      </section>
    </div>
  );
}
