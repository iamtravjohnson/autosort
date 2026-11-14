import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Fragment } from 'react';
import { ArticleToc } from '@/components/content/article-toc';
import { AuthorAvatar, AuthorBox } from '@/components/content/author';
import { Block } from '@/components/content/rich-text';
import { ChevronDownIcon } from '@/components/icons';
import { WheelMark } from '@/components/logo';
import { Breadcrumbs, JsonLd } from '@/components/seo';
import { QuickAnswer } from '@/components/ui';
import { getGuide, guides, readMinutes } from '@/content/guides';
import { articleJsonLd, faqJsonLd, pageMetadata } from '@/lib/seo';
import { formatDate, site } from '@/lib/site';

type Props = { params: Promise<{ slug: string }> };

/** /guides/camelot-wheel is a separate static page, so it's never generated here. */
const RESERVED = new Set(['camelot-wheel']);

export function generateStaticParams() {
  return guides.filter((g) => !RESERVED.has(g.slug)).map((g) => ({ slug: g.slug }));
}

function findGuide(slug: string) {
  return RESERVED.has(slug) ? undefined : getGuide(slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = findGuide(slug);
  if (!guide) return {};
  return pageMetadata({ title: guide.title, description: guide.description, path: `/guides/${guide.slug}`, type: 'article' });
}

const H2 = 'm-0 mt-2 text-[24px] font-extrabold leading-[1.2] tracking-[-0.02em] text-text-1 sm:text-[30px]';

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = findGuide(slug);
  if (!guide) notFound();

  const path = `/guides/${guide.slug}`;
  const minutes = readMinutes(guide);
  const toc = [...guide.sections.map((s) => ({ id: s.id, label: s.title })), { id: 'faq', label: 'FAQ' }];

  return (
    <div className="mx-auto flex max-w-[1200px] flex-wrap items-start gap-7 px-4 pb-10 pt-6 sm:px-6 sm:pb-16 sm:pt-8 lg:gap-14">
      <aside className="hidden flex-[0_1_220px] self-stretch pt-[120px] lg:block">
        <div className="sticky top-[96px]">
          <ArticleToc items={toc} />
        </div>
      </aside>

      <article className="flex min-w-0 max-w-[720px] flex-[999_1_620px] flex-col gap-7">
        <Breadcrumbs crumbs={[{ name: 'Home', href: '/' }, { name: 'Guides', href: '/guides' }, { name: guide.crumb }]} path={path} />

        <details className="group rounded-[22px] bg-surface-2 lg:hidden">
          <summary className="flex h-11 items-center justify-between px-4 text-[14px] font-semibold text-text-2">
            On this page
            <ChevronDownIcon size={14} className="transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <nav aria-label="On this page" className="flex flex-col gap-1 px-4 pb-4 pt-1 text-[15px]">
            {toc.map((t) => (
              <a key={t.id} href={`#${t.id}`} className="py-1.5 text-text-2 no-underline hover:text-text-1">
                {t.label}
              </a>
            ))}
          </nav>
        </details>

        <h1 className="m-0 text-[clamp(36px,4.6vw,54px)] font-extrabold leading-[1.05] tracking-[-0.035em]">{guide.title}</h1>

        <div className="flex items-center gap-3.5">
          <AuthorAvatar size={48} />
          <span className="flex flex-col text-[14px]">
            <a href={site.founder.url} target="_blank" rel="noopener noreferrer author" className="font-bold text-text-1 no-underline hover:text-text-1 hover:underline">
              {site.founder.name}
            </a>
            <span className="tnum text-text-3">
              Creator of AutoSort · Updated <time dateTime={site.updated}>{formatDate(site.updated)}</time> · {minutes} min read
            </span>
          </span>
        </div>

        <QuickAnswer>{guide.quickAnswer}</QuickAnswer>

        <div className="flex flex-col gap-2.5 rounded-card bg-surface-2 px-[22px] py-5">
          <h2 className="m-0 text-[16px] font-extrabold">Key takeaways</h2>
          <ul className="m-0 flex list-disc flex-col gap-1.5 pl-5 text-[15px] leading-[1.55] text-prose">
            {guide.takeaways.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>

        {guide.sections.map((section) => (
          <Fragment key={section.id}>
            <section
              id={section.id}
              aria-labelledby={`${section.id}-title`}
              className="flex flex-col gap-3.5 text-[17px] leading-[1.7] text-prose"
            >
              <h2 id={`${section.id}-title`} className={H2}>
                {section.title}
              </h2>
              {section.blocks.map((b, i) => (
                <Block key={i} block={b} />
              ))}
            </section>
            {guide.cta.after === section.id ? (
              <Link
                href={guide.cta.href}
                className="flex flex-wrap items-center gap-[18px] rounded-panel border border-accent/50 bg-accent-tint p-5 text-text-1 no-underline hover:text-text-1"
              >
                <WheelMark size={44} color="#A78BFA" />
                <span className="flex flex-[1_1_260px] flex-col gap-0.5">
                  <span className="text-[17px] font-extrabold">{guide.cta.title}</span>
                  <span className="text-[14px] text-prose">{guide.cta.text}</span>
                </span>
                <span className="inline-flex h-11 items-center rounded-pill bg-accent px-5 text-[14px] font-bold text-bg">{guide.cta.label}</span>
              </Link>
            ) : null}
          </Fragment>
        ))}

        <section aria-labelledby="faq" className="flex flex-col">
          <h2 id="faq" className={`${H2} mb-3`}>
            FAQ
          </h2>
          {guide.faq.map((f, i) => (
            <details key={f.q} open={i === 0} className="border-t border-line py-4">
              <summary className="flex items-center justify-between gap-4 text-[17px] font-bold">
                {f.q}
                <ChevronDownIcon className="faq-chevron shrink-0 text-text-3 transition-transform duration-200" />
              </summary>
              <p className="m-0 mt-2.5 text-[16px] leading-[1.6] text-text-2">{f.a}</p>
            </details>
          ))}
        </section>

        <AuthorBox />

        <section aria-labelledby="related" className="flex flex-col gap-3.5">
          <h2 id="related" className="m-0 text-[22px] font-extrabold">
            Related guides
          </h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
            {guide.related.map((r) => (
              <Link
                key={r.href}
                href={r.href}
                className="rounded-card bg-surface-1 p-4 text-[15px] font-bold text-text-1 no-underline transition-colors duration-[120ms] hover:bg-surface-2 hover:text-text-1"
              >
                {r.label}
              </Link>
            ))}
          </div>
        </section>
      </article>

      <JsonLd
        data={[
          articleJsonLd({ headline: guide.title, description: guide.description, path, dateModified: site.updated }),
          faqJsonLd(guide.faq),
        ]}
      />
    </div>
  );
}
