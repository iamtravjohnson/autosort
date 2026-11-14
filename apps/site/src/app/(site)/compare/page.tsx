import Link from 'next/link';
import { Breadcrumbs } from '@/components/seo';
import { QuickAnswer } from '@/components/ui';
import { ArrowRightIcon } from '@/components/icons';
import { AUTOSORT, NOT_STATED, comparisons } from '@/content/compare';
import { pageMetadata } from '@/lib/seo';
import { formatDate, site } from '@/lib/site';

export const metadata = pageMetadata({
  title: 'Compare AutoSort with other Spotify playlist sorters',
  description:
    'How AutoSort compares with Spotify Smart Reorder, Free Your Music, Skiley, PlaylistSorter, Sort by Tune and Sort Your Music, including where each one wins.',
  path: '/compare',
});

const glance = [
  { key: 'price', label: 'Price' },
  { key: 'recurring', label: 'Updates automatically' },
  { key: 'key', label: 'Sort by key (Camelot)' },
] as const;

export default function ComparePage() {
  return (
    <div className="mx-auto flex max-w-[1000px] flex-col gap-8 px-4 pb-10 pt-6 sm:px-6 sm:pb-16 sm:pt-8">
      <Breadcrumbs crumbs={[{ name: 'Home', href: '/' }, { name: 'Compare' }]} path="/compare" />

      <div className="flex flex-col gap-3.5">
        <h1 className="m-0 text-[clamp(36px,4.6vw,56px)] font-extrabold leading-[1.04] tracking-[-0.035em]">
          Compare AutoSort with other Spotify playlist sorters
        </h1>
        <p className="m-0 text-[13px] text-text-3">
          Updated <time dateTime={site.updated}>{formatDate(site.updated)}</time> · We make AutoSort, so weigh that.
        </p>
      </div>

      <QuickAnswer>
        AutoSort is free, open source and self-hosted. It splits one big Spotify playlist into many smart playlists, keeps them updated
        daily, and sorts by BPM, Camelot key and energy. Other tools win on convenience: Spotify&apos;s Smart Reorder is built in, and
        sorters like Skiley and Sort by Tune need no self-hosting.
      </QuickAnswer>

      <section aria-labelledby="h-list" className="flex flex-col gap-3.5">
        <h2 id="h-list" className="m-0 text-[24px] font-extrabold tracking-[-0.02em] sm:text-[30px]">
          Side-by-side comparisons
        </h2>
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4 p-0">
          {comparisons.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/compare/${c.slug}`}
                className="flex h-full flex-col gap-2 rounded-card bg-surface-1 p-[22px] text-text-1 no-underline hover:bg-surface-2 hover:text-text-1"
              >
                <span className="text-[18px] font-bold">{c.h1}</span>
                <span className="text-[14px] leading-[1.55] text-text-2">{c.description}</span>
                <span className="mt-auto inline-flex items-center gap-1.5 pt-1 text-[14px] font-bold text-accent-hover">
                  Read the comparison <ArrowRightIcon size={16} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="h-glance" className="flex flex-col gap-3.5">
        <h2 id="h-glance" className="m-0 text-[24px] font-extrabold tracking-[-0.02em] sm:text-[30px]">
          At a glance
        </h2>
        <div className="overflow-x-auto rounded-card border border-line">
          <table className="w-full min-w-[640px] border-collapse text-[15px]">
            <thead>
              <tr className="bg-surface-2 text-left">
                <th scope="col" className="px-[18px] py-3.5">
                  Tool
                </th>
                {glance.map((g) => (
                  <th key={g.key} scope="col" className="px-[18px] py-3.5">
                    {g.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-line align-top">
                <th scope="row" className="px-[18px] py-3.5 text-left font-semibold text-accent-soft">
                  AutoSort
                </th>
                {glance.map((g) => (
                  <td key={g.key} className={`px-[18px] py-3.5 font-bold ${AUTOSORT[g.key].tone === 'yes' ? 'text-success-text' : 'text-text-1'}`}>
                    {AUTOSORT[g.key].value}
                  </td>
                ))}
              </tr>
              {comparisons.map((c) => (
                <tr key={c.slug} className="border-t border-line align-top">
                  <th scope="row" className="px-[18px] py-3.5 text-left font-semibold">
                    <Link href={`/compare/${c.slug}`} className="text-text-1 hover:text-accent-soft">
                      {c.name}
                    </Link>
                  </th>
                  {glance.map((g) => {
                    const v = c.them[g.key] ?? NOT_STATED;
                    return (
                      <td key={g.key} className={`px-[18px] py-3.5 ${v === NOT_STATED ? 'text-text-3' : 'text-text-2'}`}>
                        {v}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="m-0 text-[13px] text-text-3">
          Competitor details are as of November 2026. AutoSort&apos;s one-click self-hosted app is still being finished; the engine is{' '}
          <Link href="/open-source">open source on GitHub and npm</Link>.
        </p>
      </section>
    </div>
  );
}
