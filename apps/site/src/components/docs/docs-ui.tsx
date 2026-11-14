import Link from 'next/link';
import { Suspense, type CSSProperties, type ReactNode } from 'react';
import { StarIcon, VercelIcon } from '@/components/icons';
import { WheelMark } from '@/components/logo';
import { JsonLd } from '@/components/seo';
import { EarlyReleaseNote, WorksWithSpotify } from '@/components/ui';
import { formatCount, getRepoStats } from '@/lib/github';
import { breadcrumbJsonLd, faqJsonLd, type Crumb, type FaqItem } from '@/lib/seo';
import { formatDate, site } from '@/lib/site';
import { CopyButton } from './copy-button';
import { docsEditUrl, docsEntry, docsPager } from './docs-index';
import { DocsMenuButton, DocsSearch, MobileSearchButton } from './docs-shell';
import { ThemeToggle } from './theme';
import { DocsToc, MobileToc, type TocItem } from './toc';

/* ---------- Chrome: header + footer ---------- */

async function StarCount() {
  const { stars } = await getRepoStats();
  return <>{formatCount(stars)}</>;
}

function DocsStarPill() {
  return (
    <a
      href={site.github}
      target="_blank"
      rel="noopener noreferrer"
      className="tnum hidden h-10 shrink-0 items-center gap-1.5 rounded-pill border border-[var(--d-border-outline)] px-3.5 text-[14px] font-bold text-[var(--d-text)] no-underline transition-colors duration-[120ms] hover:border-[var(--d-border-hover)] hover:text-[var(--d-text)] sm:inline-flex"
    >
      GitHub
      <StarIcon size={14} />
      <Suspense fallback="—">
        <StarCount />
      </Suspense>
      <span className="sr-only"> stars</span>
    </a>
  );
}

export function DocsHeader() {
  return (
    <header className="border-b border-[var(--d-border)]">
      <nav aria-label="Docs header" className="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-2.5 sm:px-6 sm:py-3 md:gap-5">
        <Link href="/" className="flex shrink-0 items-center gap-2.5 text-[var(--d-text)] no-underline hover:text-[var(--d-text)]">
          <WheelMark size={26} />
          <span className="text-[20px] font-extrabold tracking-[-0.04em]">AutoSort</span>
          <span className="rounded-pill bg-[var(--d-chip)] px-2 py-0.5 text-[12px] font-bold text-[var(--d-text-2)]">Docs</span>
        </Link>
        <DocsSearch />
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <MobileSearchButton />
          <DocsStarPill />
        </div>
      </nav>
    </header>
  );
}

export function DocsFooter() {
  return (
    <footer className="border-t border-[var(--d-border)]">
      <div className="mx-auto flex max-w-[1440px] flex-wrap justify-between gap-4 p-6 text-[13px] text-[var(--d-text-3)]">
        <span className="flex flex-col gap-1.5">
          <span>
            Made by{' '}
            <a href={site.founder.url} target="_blank" rel="noopener noreferrer">
              {site.founder.name}
            </a>{' '}
            ·{' '}
            <a href={site.founder.twitterUrl} target="_blank" rel="noopener noreferrer">
              {site.founder.twitter}
            </a>
          </span>
          <span>{site.disclaimer}</span>
        </span>
        <span className="inline-flex">
          <WorksWithSpotify className="docs-spotify-on-dark" />
          <WorksWithSpotify tone="black" className="docs-spotify-on-light" />
        </span>
      </div>
    </footer>
  );
}

/* ---------- Page frame: breadcrumbs, H1, meta, pagination, TOC ---------- */

function DocsBreadcrumbs({ path, group, label }: { path: string; group: string; label: string }) {
  // Structured data skips the group level (there is no page for it).
  const crumbs: Crumb[] =
    path === '/docs/quick-start'
      ? [{ name: 'Home', href: '/' }, { name: label }]
      : [{ name: 'Home', href: '/' }, { name: 'Docs', href: '/docs/quick-start' }, { name: label }];
  return (
    <>
      <nav aria-label="Breadcrumb" className="flex flex-wrap gap-2 text-[13px] text-[var(--d-text-3)]">
        <Link href="/docs/quick-start" className="text-[var(--d-text-3)] no-underline hover:text-[var(--d-text)]">
          Docs
        </Link>
        <span aria-hidden="true">/</span>
        <span>{group}</span>
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="text-[var(--d-text-2)]">
          {label}
        </span>
      </nav>
      <JsonLd data={breadcrumbJsonLd(crumbs, path)} />
    </>
  );
}

function PagerCard({ href, label, dir }: { href: string; label: string; dir: 'prev' | 'next' }) {
  return (
    <Link
      href={href}
      rel={dir}
      className={`flex flex-col gap-1 rounded-card border border-[var(--d-border-card)] px-[18px] py-4 no-underline transition-colors duration-[120ms] hover:border-[var(--d-border-hover)] ${
        dir === 'next' ? 'items-end text-right sm:col-start-2' : ''
      }`}
    >
      <span className="text-[12px] text-[var(--d-text-3)]">{dir === 'prev' ? '← Previous' : 'Next →'}</span>
      <span className="text-[16px] font-bold text-[var(--d-text)]">{label}</span>
    </Link>
  );
}

/**
 * One docs page: mobile bar (Docs menu + On this page), breadcrumbs, H1, "Updated … · N min" meta,
 * the page body, prev/next cards, and the right-hand TOC with "Edit this page on GitHub".
 */
export function DocsPage({ path, title, meta, toc, children }: { path: string; title: string; meta: string; toc: TocItem[]; children: ReactNode }) {
  const entry = docsEntry(path);
  const { prev, next } = docsPager(path);
  const editUrl = docsEditUrl(path);

  return (
    <>
      <div className="flex min-w-0 flex-1 flex-col lg:max-w-[760px]">
        <div className="sticky top-0 z-10 -mx-4 flex gap-2 border-b border-[var(--d-border)] bg-[var(--d-bg)] px-4 py-2.5 sm:-mx-6 sm:px-6 lg:mx-0 lg:border-b-0 lg:px-0 lg:pt-6 xl:hidden">
          <DocsMenuButton />
          <MobileToc items={toc} />
        </div>
        <main id="main" className="flex min-w-0 flex-col gap-7 pb-12 pt-5 lg:pb-20 lg:pt-8">
          <DocsBreadcrumbs path={path} group={entry?.group ?? 'Docs'} label={entry?.label ?? title} />
          <div className="flex flex-col gap-3">
            <h1 className="m-0 text-[30px] font-extrabold leading-[1.12] tracking-[-0.03em] sm:text-[44px] sm:leading-[1.08]">{title}</h1>
            <p className="tnum m-0 text-[13px] text-[var(--d-text-3)]">
              Updated <time dateTime={site.updated}>{formatDate(site.updated)}</time> · {meta}
            </p>
          </div>
          {children}
          {prev || next ? (
            <nav aria-label="Pagination" className="grid grid-cols-1 gap-3 pt-3 sm:grid-cols-2 sm:gap-4">
              {prev ? <PagerCard href={prev.href} label={prev.label} dir="prev" /> : null}
              {next ? <PagerCard href={next.href} label={next.label} dir="next" /> : null}
            </nav>
          ) : null}
          <a
            href={editUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="self-start text-[13px] text-[var(--d-text-3)] no-underline hover:text-[var(--d-text)] xl:hidden"
          >
            Edit this page on GitHub
          </a>
        </main>
      </div>
      <div className="sticky top-0 -mx-3 hidden max-h-dvh w-[224px] shrink-0 flex-col gap-3 overflow-y-auto px-3 py-10 xl:flex">
        <DocsToc items={toc} />
        <a href={editUrl} target="_blank" rel="noopener noreferrer" className="mt-3 text-[13px] text-[var(--d-text-3)] no-underline hover:text-[var(--d-text)]">
          Edit this page on GitHub
        </a>
      </div>
    </>
  );
}

/* ---------- Content blocks ---------- */

export function QuickAnswer({ children }: { children: ReactNode }) {
  return (
    <aside aria-label="Quick answer" className="flex flex-col gap-2 rounded-card border border-[var(--d-qa-border)] bg-[var(--d-panel)] px-5 py-[18px]">
      <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--d-accent-text)]">Quick answer</span>
      <p className="m-0 text-[15px] leading-[1.6] text-[var(--d-qa-text)]">{children}</p>
    </aside>
  );
}

export function P({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`m-0 text-[16px] leading-[1.6] text-[var(--d-prose)] ${className}`}>{children}</p>;
}

export function UL({ children }: { children: ReactNode }) {
  return <ul className="m-0 flex list-disc flex-col gap-1.5 pl-[22px] text-[16px] leading-[1.6] text-[var(--d-prose)]">{children}</ul>;
}

export function OL({ children }: { children: ReactNode }) {
  return <ol className="m-0 flex list-decimal flex-col gap-1.5 pl-[22px] text-[16px] leading-[1.6] text-[var(--d-prose)]">{children}</ol>;
}

const H2_SIZE = {
  md: 'text-[22px] font-bold leading-[1.25]',
  lg: 'text-[24px] font-bold leading-[1.2] tracking-[-0.01em]',
  xl: 'text-[24px] font-extrabold leading-[1.2] tracking-[-0.02em] sm:text-[26px]',
} as const;

/** A titled section of a docs page. The id is the TOC anchor. */
export function DocsSection({ id, title, size = 'lg', children }: { id: string; title: ReactNode; size?: keyof typeof H2_SIZE; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className={`m-0 ${H2_SIZE[size]}`}>
        {title}
      </h2>
      {children}
    </section>
  );
}

const NOTE = {
  info: {
    box: 'border-[var(--d-note-info-border)] bg-[var(--d-note-info-bg)] text-[var(--d-note-info-text)]',
    icon: 'text-[var(--d-note-info-icon)]',
    path: <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z" />,
  },
  warning: {
    box: 'border-[var(--d-note-warning-border)] bg-[var(--d-note-warning-bg)] text-[var(--d-note-warning-text)]',
    icon: 'text-[var(--d-note-warning-icon)]',
    path: <path d="M12 9v4M12 17h.01M10.3 3.9L2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />,
  },
  violet: {
    box: 'border-[var(--d-note-violet-border)] bg-[var(--d-note-violet-bg)] text-[var(--d-note-violet-text)]',
    icon: 'text-[var(--d-note-violet-icon)]',
    path: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5M12 16h.01" />
      </>
    ),
  },
} as const;

/** Callout: info ("Tip"), warning, or violet ("Important"). */
export function DocsNote({ tone = 'info', label, children }: { tone?: keyof typeof NOTE; label: string; children: ReactNode }) {
  const s = NOTE[tone];
  return (
    <div role="note" className={`flex gap-3 rounded-card border px-4 py-3.5 ${s.box}`}>
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
        className={`mt-0.5 shrink-0 ${s.icon}`}
      >
        {s.path}
      </svg>
      <p className="m-0 text-[15px] leading-[1.55]">
        <strong>{label}:</strong> {children}
      </p>
    </div>
  );
}

/** The design's white "Deploy to Vercel" button (Vercel's one-click clone flow). */
export function DeployButton() {
  return (
    <div className="flex flex-col items-start gap-2">
      <a
        href={site.deployUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-11 items-center gap-2.5 rounded-pill bg-[var(--d-deploy-bg)] px-5 text-[15px] font-bold text-[var(--d-deploy-text)] no-underline transition-colors duration-[120ms] hover:bg-[var(--d-deploy-bg-hover)] hover:text-[var(--d-deploy-text)]"
      >
        <VercelIcon size={14} />
        Deploy to Vercel
      </a>
      <span className="text-[13px] text-[var(--d-text-3)]">Opens Vercel in a new tab. Have your Spotify Client ID and Client Secret ready.</span>
    </div>
  );
}

/** The shared EarlyReleaseNote, wrapped so docs.css can restyle it for the light theme. */
export function DocsEarlyReleaseNote() {
  return (
    <div className="docs-preview">
      <EarlyReleaseNote />
    </div>
  );
}

/** Numbered steps (36px violet-tint circles). */
export function Steps({ children }: { children: ReactNode }) {
  return (
    <ol role="list" className="m-0 flex list-none flex-col gap-8 p-0 sm:gap-9">
      {children}
    </ol>
  );
}

export function Step({ n, id, title, children }: { n: number; id: string; title: ReactNode; children: ReactNode }) {
  return (
    <li className="flex gap-3 sm:gap-5">
      <span className="tnum flex size-9 shrink-0 items-center justify-center rounded-pill bg-[var(--d-tint)] text-[16px] font-extrabold text-[var(--d-accent-text)]">
        {n}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-3.5">
        <h2 id={id} className="m-0 mt-1.5 text-[22px] font-bold leading-[1.25]">
          {title}
        </h2>
        {children}
      </div>
    </li>
  );
}

/** Striped screenshot placeholder, optionally framed as a browser window. */
export function Screenshot({ label, url, caption, height = 220 }: { label: string; url?: string; caption?: string; height?: number }) {
  return (
    <figure className="m-0 flex flex-col gap-2">
      <div className="overflow-hidden rounded-card border border-[var(--d-border-strong)] bg-[var(--d-panel)]">
        {url ? (
          <div className="flex items-center gap-1.5 border-b border-[var(--d-border)] px-3 py-2.5" aria-hidden="true">
            <span className="size-2.5 rounded-pill bg-[var(--d-copy)]" />
            <span className="size-2.5 rounded-pill bg-[var(--d-copy)]" />
            <span className="size-2.5 rounded-pill bg-[var(--d-copy)]" />
            <span className="ml-2.5 truncate font-mono text-[11px] text-[var(--d-text-3)]">{url}</span>
          </div>
        ) : null}
        <div
          className="docs-shot flex h-[180px] items-center justify-center px-4 text-center text-[14px] text-[var(--d-text-3)] sm:h-[var(--shot-h)]"
          style={{ '--shot-h': `${height}px` } as CSSProperties}
        >
          Screenshot coming soon: {label}
        </div>
      </div>
      {caption ? <figcaption className="text-[13px] text-[var(--d-text-3)]">{caption}</figcaption> : null}
    </figure>
  );
}

/** A value to paste somewhere (Redirect URI), with a Copy button. */
export function CopyRow({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-card border border-[var(--d-border-strong)] bg-[var(--d-panel)] py-1 pl-4 pr-1">
      <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap py-2 text-[var(--d-text)]" style={{ fontSize: 14 }}>
        {value}
      </code>
      <CopyButton text={value} label={label} />
    </div>
  );
}

/** Terminal-style code block with a title bar and a Copy button. Lines are shown with a "$" prompt. */
export function CodeBlock({ title, lang = 'bash', lines, label }: { title: string; lang?: string; lines: string[]; label: string }) {
  return (
    <div className="overflow-hidden rounded-card border border-[var(--d-border-strong)]">
      <div className="flex items-center justify-between gap-3 bg-[var(--d-surface-2)] py-1.5 pl-3.5 pr-1.5 text-[12px] font-semibold text-[var(--d-text-3)]">
        <span>{title}</span>
        <span className="flex items-center gap-3">
          <span>{lang}</span>
          <CopyButton text={lines.join('\n')} label={label} size="sm" />
        </span>
      </div>
      <pre className="m-0 overflow-x-auto bg-[var(--d-panel)] p-4 font-mono text-[13.5px] leading-[1.7] text-[var(--d-code-text)]">
        {lines.map((line, i) => (
          <span key={i} className="block">
            <span className="select-none text-[var(--d-text-3)]" aria-hidden="true">
              ${' '}
            </span>
            {line}
          </span>
        ))}
      </pre>
    </div>
  );
}

/** Bordered, horizontally scrollable table. */
export function DocsTable({ head, rows, minWidth = 480 }: { head: string[]; rows: ReactNode[][]; minWidth?: number }) {
  return (
    <div className="overflow-x-auto rounded-card border border-[var(--d-border)]">
      <table className="w-full border-collapse text-[14px]" style={{ minWidth }}>
        <thead>
          <tr className="bg-[var(--d-surface-2)] text-left">
            {head.map((h) => (
              <th key={h} scope="col" className="px-3.5 py-3 font-bold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, i) => (
            <tr key={i} className="border-t border-[var(--d-border)]">
              {cells.map((c, j) => (
                <td key={j} className={`px-3.5 py-3 align-top ${j === 0 ? 'font-semibold' : 'text-[var(--d-text-2)]'}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export type EnvRequirement = 'Required' | 'Auto' | 'Optional';

/** The deploy environment variables, from the design's env table. */
export const ENV_VARS: Array<{ name: string; req: EnvRequirement; where: string }> = [
  { name: 'SPOTIFY_CLIENT_ID', req: 'Required', where: 'Spotify Developer Dashboard → your app → Settings' },
  { name: 'SPOTIFY_CLIENT_SECRET', req: 'Required', where: 'Same page, under "View client secret"' },
  { name: 'DATABASE_URL', req: 'Auto', where: 'Filled in when Vercel creates the database' },
  { name: 'AUTH_SECRET', req: 'Auto', where: 'Generated during deploy' },
  { name: 'LASTFM_API_KEY', req: 'Required', where: 'Free key from last.fm/api/account/create · tells genres apart (Country, Rap, Worship…)' },
  { name: 'OPENROUTER_API_KEY', req: 'Optional', where: 'Key from openrouter.ai/keys · photo covers for new smart playlists' },
];

const REQ_COLOR: Record<EnvRequirement, string> = {
  Required: 'text-[var(--d-text)]',
  Auto: 'text-[var(--d-success-text)]',
  Optional: 'text-[var(--d-text-3)]',
};

export function EnvTable({ vars = ENV_VARS }: { vars?: typeof ENV_VARS }) {
  return (
    <div className="overflow-x-auto rounded-card border border-[var(--d-border)]">
      <table className="w-full min-w-[560px] border-collapse text-[14px]">
        <caption className="sr-only">Environment variables</caption>
        <thead>
          <tr className="bg-[var(--d-surface-2)] text-left">
            <th scope="col" className="px-3.5 py-3 font-bold">
              Variable
            </th>
            <th scope="col" className="px-3.5 py-3 font-bold">
              Required
            </th>
            <th scope="col" className="px-3.5 py-3 font-bold">
              Where to get it
            </th>
          </tr>
        </thead>
        <tbody>
          {vars.map((v) => (
            <tr key={v.name} className="border-t border-[var(--d-border)]">
              <th scope="row" className="px-3.5 py-3 text-left font-normal">
                <code className="text-[var(--d-accent-text)]">{v.name}</code>
              </th>
              <td className={`px-3.5 py-3 font-semibold ${REQ_COLOR[v.req]}`}>{v.req}</td>
              <td className="px-3.5 py-3 text-[var(--d-text-2)]">{v.where}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Troubleshooting card: error-code chip, title, cause and fix. */
export function ErrorSection({ id, code, title, children }: { id: string; code: string; title: ReactNode; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="flex flex-col gap-3 rounded-[10px] border border-[var(--d-border)] p-4 sm:p-[22px]">
      <code className="self-start rounded-sm bg-[var(--d-chip)] px-2.5 py-[3px] text-[var(--d-accent-text)]" style={{ fontSize: 13 }}>
        {code}
      </code>
      <h2 id={`${id}-title`} className="m-0 text-[22px] font-bold leading-[1.25]">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** FAQ rows (first open) plus FAQPage structured data. Answers are plain text. */
export function DocsFaq({ items, id = 'faq', title = 'FAQ' }: { items: FaqItem[]; id?: string; title?: string }) {
  return (
    <section aria-labelledby={id} className="flex flex-col">
      <h2 id={id} className="m-0 mb-2 text-[24px] font-bold tracking-[-0.01em]">
        {title}
      </h2>
      {items.map((f, i) => (
        <details key={f.q} open={i === 0} className="border-t border-[var(--d-border)] py-4">
          <summary className="flex items-center justify-between gap-4 text-[17px] font-bold">
            {f.q}
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
              className="faq-chevron shrink-0 text-[var(--d-text-3)] transition-transform duration-200"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </summary>
          <p className="m-0 mt-2.5 text-[16px] leading-[1.6] text-[var(--d-prose)]">{f.a}</p>
        </details>
      ))}
      <JsonLd data={faqJsonLd(items)} />
    </section>
  );
}

/** Small "Related" row of internal links at the end of a page. */
export function Related({ links }: { links: Array<{ href: string; label: string }> }) {
  return (
    <nav aria-label="Related" className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[var(--d-border)] pt-5 text-[14px]">
      <span className="font-semibold text-[var(--d-text-3)]">Related:</span>
      {links.map((l) => (
        <Link key={l.href} href={l.href}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
