import Link from 'next/link';
import { AUTOSORT, FEATURES, NOT_STATED, comparisons, type Comparison } from '@/content/compare';
import { Breadcrumbs, Faq } from '@/components/seo';
import { Note, QuickAnswer } from '@/components/ui';
import { formatDate, site } from '@/lib/site';

const H2 = 'm-0 text-[24px] font-extrabold tracking-[-0.02em] sm:text-[30px]';

/** One comparison page (board WebVs / MWebVs). */
export function ComparisonView({ c }: { c: Comparison }) {
  const path = `/compare/${c.slug}`;
  const rows = FEATURES.flatMap(({ key, label }) => {
    const them = c.them[key];
    if (them === null) return [];
    return [{ key, label, autosort: AUTOSORT[key], them: them ?? NOT_STATED }];
  });

  return (
    <div className="mx-auto flex max-w-[1000px] flex-col gap-8 px-4 pb-10 pt-6 sm:px-6 sm:pb-16 sm:pt-8">
      <Breadcrumbs crumbs={[{ name: 'Home', href: '/' }, { name: 'Compare', href: '/compare' }, { name: c.label }]} path={path} />

      <div className="flex flex-col gap-3.5">
        <h1 className="m-0 text-[clamp(36px,4.6vw,56px)] font-extrabold leading-[1.04] tracking-[-0.035em]">{c.h1}</h1>
        <p className="m-0 text-[13px] text-text-3">
          Updated <time dateTime={site.updated}>{formatDate(site.updated)}</time> · We make AutoSort, so weigh that. We&apos;ve tried to be
          fair;{' '}
          <a href={`${site.github}/issues/new`} target="_blank" rel="noopener noreferrer">
            tell us on GitHub
          </a>{' '}
          if something&apos;s wrong.
        </p>
      </div>

      <QuickAnswer>{c.quickAnswer}</QuickAnswer>

      <section aria-labelledby="h-table" className="flex flex-col gap-3.5">
        <h2 id="h-table" className={H2}>
          Feature by feature
        </h2>
        <div className="overflow-x-auto rounded-card border border-line">
          <table className="w-full min-w-[600px] border-collapse text-[15px]">
            <caption className="sr-only">
              AutoSort compared with {c.name}, feature by feature
            </caption>
            <thead>
              <tr className="bg-surface-2 text-left">
                <th scope="col" className="px-[18px] py-3.5">
                  Feature
                </th>
                <th scope="col" className="px-[18px] py-3.5 text-accent-soft">
                  AutoSort
                </th>
                <th scope="col" className="px-[18px] py-3.5">
                  {c.name}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className="border-t border-line align-top">
                  <th scope="row" className="px-[18px] py-3.5 text-left font-semibold">
                    {r.label}
                  </th>
                  <td className={`px-[18px] py-3.5 font-bold ${r.autosort.tone === 'yes' ? 'text-success-text' : 'text-text-1'}`}>{r.autosort.value}</td>
                  <td className={`px-[18px] py-3.5 ${r.them === NOT_STATED ? 'text-text-3' : 'text-text-2'}`}>{r.them}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="m-0 text-[13px] text-text-3">
          Details about {c.name} are as of November 2026. &ldquo;{NOT_STATED}&rdquo; means we couldn&apos;t confirm it.
        </p>
      </section>

      <section aria-label="Which to choose" className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
        <div className="flex flex-col gap-3 rounded-card bg-surface-1 p-6">
          <h2 className="m-0 text-[20px] font-extrabold">When to choose {c.shortName}</h2>
          <ul className="m-0 flex list-disc flex-col gap-2 pl-5 text-[15px] leading-[1.55] text-prose">
            {c.chooseThem.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-3 rounded-card border border-accent/50 bg-accent-tint p-6">
          <h2 className="m-0 text-[20px] font-extrabold">When to choose AutoSort</h2>
          <ul className="m-0 flex list-disc flex-col gap-2 pl-5 text-[15px] leading-[1.55] text-[#EDE9FE]">
            {c.chooseAutoSort.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      </section>

      <Note tone="violet" title="Where AutoSort stands today">
        The engine, <Link href="/open-source">@autosort/core</Link>, is open source and already runs the founder&apos;s family setup. The
        one-click self-hosted app is being finished now; see the <Link href="/changelog">changelog</Link> for what has shipped.
      </Note>

      <section aria-labelledby="faq">
        <Faq items={c.faq} />
      </section>

      <OtherComparisons current={c.slug} />
    </div>
  );
}

/** "Other comparisons" pill nav. */
export function OtherComparisons({ current }: { current?: string }) {
  return (
    <nav aria-labelledby="h-other" className="flex flex-col gap-3">
      <h2 id="h-other" className="m-0 text-[20px] font-extrabold">
        Other comparisons
      </h2>
      <div className="flex flex-wrap gap-2">
        {comparisons
          .filter((o) => o.slug !== current)
          .map((o) => (
            <Link
              key={o.slug}
              href={`/compare/${o.slug}`}
              className="rounded-pill bg-surface-2 px-3.5 py-2 text-[14px] font-semibold text-text-1 no-underline hover:bg-surface-3 hover:text-text-1"
            >
              {o.label}
            </Link>
          ))}
      </div>
    </nav>
  );
}
