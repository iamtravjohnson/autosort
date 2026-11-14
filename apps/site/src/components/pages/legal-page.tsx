import Link from 'next/link';
import type { ReactNode } from 'react';
import { ChevronDownIcon } from '@/components/icons';
import { Breadcrumbs, Toc } from '@/components/seo';
import { formatDate, site } from '@/lib/site';

export interface LegalSection {
  id: string;
  heading: string;
  body: ReactNode;
}

/**
 * Shared template for /privacy and /terms (boards WebLegal / MWebLegal): breadcrumb, H1,
 * effective date, draft notice, "In short" summary, sections, and a right TOC on desktop
 * (a collapsible "On this page" on mobile).
 */
export function LegalPage({
  title,
  path,
  inShort,
  sections,
  sibling,
}: {
  title: string;
  path: string;
  inShort: string[];
  sections: LegalSection[];
  sibling: { label: string; href: string };
}) {
  const toc = sections.map((s) => ({ id: s.id, label: s.heading }));
  return (
    <div className="mx-auto flex max-w-[1100px] flex-wrap items-start gap-7 px-4 pb-10 pt-6 sm:px-6 sm:pb-16 sm:pt-8 lg:gap-12">
      <article className="flex min-w-0 max-w-[720px] flex-[999_1_600px] flex-col gap-6">
        <Breadcrumbs crumbs={[{ name: 'Home', href: '/' }, { name: title }]} path={path} />

        <details className="rounded-[22px] bg-surface-2 lg:hidden">
          <summary className="flex h-11 items-center justify-between px-4 text-[14px] font-semibold text-text-2">
            On this page
            <ChevronDownIcon size={14} className="faq-chevron transition-transform duration-200" />
          </summary>
          <ul className="m-0 flex list-none flex-col gap-2 px-4 pb-4 pt-1 text-[14px]">
            {toc.map((t) => (
              <li key={t.id}>
                <a href={`#${t.id}`} className="text-text-2 no-underline hover:text-text-1">
                  {t.label}
                </a>
              </li>
            ))}
          </ul>
        </details>

        <h1 className="m-0 text-[clamp(38px,5vw,56px)] font-extrabold leading-[1.04] tracking-[-0.035em]">{title}</h1>
        <p className="m-0 text-[13px] text-text-3">
          Effective <time dateTime={site.updated}>{formatDate(site.updated)}</time> · See also <Link href={sibling.href}>{sibling.label}</Link>
        </p>

        <div role="note" className="rounded-card border border-warning/35 bg-warning/10 px-4 py-3.5 text-[14px] leading-[1.55] text-[#FEF3C7]">
          <strong className="text-text-1">Draft.</strong> This page hasn&apos;t been reviewed by a lawyer yet. It describes how AutoSort works
          today in plain language, and we&apos;ll update it after review.
        </div>

        <aside aria-label="In short" className="flex flex-col gap-2.5 rounded-card border border-accent/40 bg-surface-1 px-[22px] py-5">
          <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-accent-soft">In short</span>
          <ul className="m-0 flex list-disc flex-col gap-1.5 pl-5 text-[15px] leading-[1.55] text-[#E4E4E7]">
            {inShort.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </aside>

        {sections.map((s) => (
          <section key={s.id} id={s.id} aria-labelledby={`h-${s.id}`} className="flex scroll-mt-24 flex-col gap-2.5">
            <h2 id={`h-${s.id}`} className="m-0 mt-3 text-[24px] font-extrabold tracking-[-0.01em]">
              {s.heading}
            </h2>
            <div className="flex flex-col gap-3 text-[16px] leading-[1.7] text-prose [&_li]:my-1.5 [&_p]:m-0 [&_strong]:text-text-1 [&_ul]:m-0 [&_ul]:list-disc [&_ul]:pl-[22px]">
              {s.body}
            </div>
          </section>
        ))}
      </article>

      <aside className="mt-[120px] hidden flex-[0_1_220px] lg:sticky lg:top-24 lg:block">
        <Toc items={toc} />
      </aside>
    </div>
  );
}
