import Link from 'next/link';
import { breadcrumbJsonLd, faqJsonLd, type Crumb, type FaqItem } from '@/lib/seo';
import { ChevronDownIcon } from './icons';

/** Renders one or more JSON-LD objects (escaped against </script> injection). */
export function JsonLd({ data }: { data: Record<string, unknown> | Array<Record<string, unknown>> }) {
  const list = Array.isArray(data) ? data : [data];
  return (
    <>
      {list.map((d, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(d).replace(/</g, '\\u003c') }} />
      ))}
    </>
  );
}

/** Visible breadcrumb trail plus BreadcrumbList structured data. The last crumb is the current page. */
export function Breadcrumbs({ crumbs, path }: { crumbs: Crumb[]; path: string }) {
  return (
    <>
      <nav aria-label="Breadcrumb" className="flex flex-wrap gap-2 text-[13px] text-text-3">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <span key={`${c.name}-${i}`} className="flex gap-2">
              {last || !c.href ? (
                <span className={last ? 'text-text-2' : undefined} aria-current={last ? 'page' : undefined}>
                  {c.name}
                </span>
              ) : (
                <Link href={c.href} className="text-text-3 no-underline hover:text-text-1">
                  {c.name}
                </Link>
              )}
              {last ? null : <span aria-hidden="true">/</span>}
            </span>
          );
        })}
      </nav>
      <JsonLd data={breadcrumbJsonLd(crumbs, path)} />
    </>
  );
}

/** FAQ as <details> rows (first open) plus FAQPage structured data. */
export function Faq({ items, id = 'faq', title = 'FAQ', headingLevel = 2 }: { items: FaqItem[]; id?: string; title?: string; headingLevel?: 2 | 3 }) {
  const H = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <div className="flex max-w-[860px] flex-col">
      <H id={id} className="m-0 mb-6 text-[32px] font-extrabold tracking-[-0.03em] sm:text-[40px]">
        {title}
      </H>
      {items.map((f, i) => (
        <details key={f.q} open={i === 0} className="border-t border-line py-5">
          <summary className="flex items-center justify-between gap-4 text-[18px] font-bold">
            {f.q}
            <ChevronDownIcon className="faq-chevron shrink-0 text-text-3 transition-transform duration-200" />
          </summary>
          <p className="m-0 mt-3 text-[16px] leading-[1.6] text-text-2">{f.a}</p>
        </details>
      ))}
      <JsonLd data={faqJsonLd(items)} />
    </div>
  );
}

/** Right-hand "On this page" table of contents. */
export function Toc({ items, title = 'On this page' }: { items: Array<{ id: string; label: string }>; title?: string }) {
  return (
    <nav aria-label={title} className="flex flex-col gap-2 text-[13px]">
      <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-text-3">{title}</span>
      {items.map((t) => (
        <a key={t.id} href={`#${t.id}`} className="border-l-2 border-transparent pl-3 text-text-2 no-underline hover:border-accent hover:text-text-1">
          {t.label}
        </a>
      ))}
    </nav>
  );
}
