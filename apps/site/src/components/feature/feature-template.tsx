import type { ReactNode } from 'react';
import { transition } from '@autosort/core';
import Link from 'next/link';
import { ArrowRightIcon } from '@/components/icons';
import { Breadcrumbs, Faq, JsonLd } from '@/components/seo';
import { CtaBand } from '@/components/site-chrome';
import { ButtonLink, QuickAnswer, StepNumber, TransitionChip } from '@/components/ui';
import { featurePath, transitionGuide, type FeaturePage } from '@/content/features';
import { howToJsonLd, softwareJsonLd } from '@/lib/seo';
import { formatDate, site } from '@/lib/site';
import { HeroVisual } from './hero-visual';
import { BeforeAfterTables, ReferenceTable, WhereTable } from './tables';

/** A full-width band with the feature template's rhythm: 64px desktop, 40px mobile. */
function Band({
  id,
  labelledBy,
  raised,
  divider,
  className = '',
  children,
}: {
  id?: string;
  labelledBy: string;
  raised?: boolean;
  divider?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={`${raised ? 'bg-surface-1' : ''} ${divider ? 'border-t border-line' : ''}`}>
      <div className={`mx-auto flex max-w-[1200px] flex-col px-4 py-10 sm:px-6 sm:py-16 ${className}`}>{children}</div>
    </section>
  );
}

function H2({ id, small, children }: { id: string; small?: boolean; children: ReactNode }) {
  return (
    <h2
      id={id}
      className={
        small
          ? 'm-0 text-[28px] font-extrabold leading-[1.15] tracking-[-0.02em]'
          : 'm-0 text-[28px] font-extrabold leading-[1.15] tracking-[-0.03em] sm:text-[36px]'
      }
    >
      {children}
    </h2>
  );
}

/** Key-sort variant: the four transition labels, each chip computed from an example move. */
function TransitionGuide() {
  return (
    <section aria-labelledby="h-labels" className="border-t border-line">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-3.5 px-4 pb-9 pt-7 sm:px-6 sm:pb-14 sm:pt-10">
        <H2 id="h-labels" small>
          What the transition labels mean
        </H2>
        <dl className="m-0 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3">
          {transitionGuide.map((item) => (
            <div key={item.example.join('-')} className="rounded-card bg-surface-1 p-4">
              <dt>
                <TransitionChip kind={transition(item.example[0], item.example[1])} />
              </dt>
              <dd className="m-0 mt-2.5 text-[14px] leading-[1.5] text-text-2">{item.text}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/** The shared template behind every /split/[slug] and /sort/[slug] page. */
export function FeatureTemplate({ page }: { page: FeaturePage }) {
  const path = featurePath(page);
  const section = page.kind === 'split' ? 'Split' : 'Sort';
  const { example } = page;

  return (
    <>
      <div className="mx-auto max-w-[1200px] px-4 pt-8 sm:px-6">
        <Breadcrumbs crumbs={[{ name: 'Home', href: '/' }, { name: section }, { name: page.label }]} path={path} />
      </div>

      <header className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-7 px-4 pb-9 pt-4 sm:gap-12 sm:px-6 sm:pb-14">
        <div className={`flex min-w-0 flex-col gap-5 ${page.kind === 'split' ? 'flex-[1_1_520px]' : 'flex-[1_1_500px]'}`}>
          <h1 className="m-0 text-[clamp(38px,5vw,64px)] font-extrabold leading-[1.03] tracking-[-0.035em]">{page.h1}</h1>
          <QuickAnswer>{page.quickAnswer}</QuickAnswer>
          <div className="flex flex-wrap items-center gap-3">
            <ButtonLink href={site.startPath} size="lg">
              Deploy your own · free
            </ButtonLink>
            <ButtonLink href="#how" variant="secondary" size="lg">
              See how it works
            </ButtonLink>
            {page.heroLink ? (
              <ButtonLink href={page.heroLink.href} variant="ghost" size="lg" className="!px-3">
                {page.heroLink.label}
                <ArrowRightIcon size={16} />
              </ButtonLink>
            ) : null}
          </div>
          <span className="text-[13px] text-text-3">
            Updated <time dateTime={site.updated}>{formatDate(site.updated)}</time>
          </span>
        </div>
        <HeroVisual hero={page.hero} />
      </header>

      {page.transitionGuide ? <TransitionGuide /> : null}

      <Band id="how" labelledBy="h-how" divider className="gap-7">
        <H2 id="h-how">{page.how.title}</H2>
        <ol className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-5 p-0">
          {page.how.steps.map((s, i) => (
            <li key={s.title} className="flex flex-col gap-2.5 rounded-card bg-surface-1 p-6">
              <StepNumber n={i + 1} />
              <h3 className="m-0 text-[18px] font-bold leading-[1.3]">{s.title}</h3>
              <p className="m-0 text-[15px] leading-[1.55] text-text-2">{s.text}</p>
            </li>
          ))}
        </ol>
      </Band>

      <Band labelledBy="h-uses" raised className="gap-7">
        <H2 id="h-uses">{page.uses.title}</H2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-5">
          {page.uses.cards.map((u) => (
            <div key={u.title} className="flex flex-col gap-2.5 rounded-card bg-surface-2 p-6">
              <h3 className="m-0 text-[19px] font-bold leading-[1.3]">{u.title}</h3>
              <p className="m-0 text-[15px] leading-[1.55] text-text-2">{u.text}</p>
              <span className="flex flex-wrap gap-1.5">
                {u.chips.map((c) => (
                  <span key={c} className="rounded-pill bg-surface-3 px-[9px] py-[3px] text-[12px] font-semibold">
                    {c}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </div>
      </Band>

      {page.reference ? (
        <Band labelledBy="h-ref" className="gap-6">
          <H2 id="h-ref">{page.reference.title}</H2>
          <p className="m-0 text-[16px] leading-[1.6] text-text-2">{page.reference.lead}</p>
          <ReferenceTable table={page.reference} />
          {page.reference.note ? <p className="m-0 max-w-[860px] text-[14px] leading-[1.6] text-text-2">{page.reference.note}</p> : null}
        </Band>
      ) : null}

      <Band id="example" labelledBy="h-ex" divider={Boolean(page.reference)} className="gap-5">
        <H2 id="h-ex">{example.title}</H2>
        <p className="m-0 text-[16px] leading-[1.6] text-text-2">{example.lead}</p>
        {example.type === 'where' ? <WhereTable example={example} /> : <BeforeAfterTables example={example} />}
      </Band>

      <Band labelledBy="h-rel" raised className="gap-6">
        <H2 id="h-rel" small>
          Related
        </H2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(260px,100%),1fr))] gap-3">
          {page.related.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              className="flex flex-col gap-1 rounded-card bg-surface-2 px-[18px] py-4 text-text-1 no-underline transition-colors duration-[120ms] hover:bg-surface-3 hover:text-text-1"
            >
              <span className="text-[12px] font-bold uppercase tracking-[0.06em] text-text-3">{r.kind}</span>
              <span className="text-[16px] font-bold">{r.label}</span>
            </Link>
          ))}
        </div>
      </Band>

      <section aria-labelledby="faq" className="mx-auto max-w-[860px] px-4 py-10 sm:px-6 sm:py-16">
        <Faq items={page.faq} />
      </section>

      <CtaBand title={page.cta.title} body={page.cta.body} />

      <JsonLd
        data={[
          softwareJsonLd({ description: page.metaDescription, path }),
          howToJsonLd({
            name: page.h1,
            description: page.quickAnswer,
            steps: page.how.steps.map((s) => ({ name: s.title, text: s.text })),
          }),
        ]}
      />
    </>
  );
}
