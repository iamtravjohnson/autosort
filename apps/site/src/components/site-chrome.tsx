import Link from 'next/link';
import { Suspense } from 'react';
import { formatCount, getRepoStats } from '@/lib/github';
import { footerNav, mainNav } from '@/lib/routes';
import { site } from '@/lib/site';
import { StarIcon } from './icons';
import { Logo } from './logo';
import { MobileMenu } from './mobile-menu';
import { ButtonLink, WorksWithSpotify } from './ui';

async function StarCount() {
  const { stars } = await getRepoStats();
  return <>{formatCount(stars)}</>;
}

/** GitHub star pill used in the header and on CTAs. */
export function StarPill({ className = '' }: { className?: string }) {
  return (
    <a
      href={site.github}
      target="_blank"
      rel="noopener noreferrer"
      className={`tnum inline-flex h-10 items-center gap-2 rounded-pill border border-white/25 px-3.5 text-[14px] font-bold text-text-1 no-underline hover:border-white/50 hover:text-text-1 ${className}`}
      aria-label="Star AutoSort on GitHub"
    >
      <StarIcon />
      <Suspense fallback="—">
        <StarCount />
      </Suspense>
    </a>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-[rgba(11,11,12,0.92)] backdrop-blur">
      <nav aria-label="Main" className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-6 py-3.5">
        <Logo />
        <div className="hidden items-center gap-6 text-[15px] font-semibold lg:flex">
          {mainNav.map((l) => (
            <Link key={l.href} href={l.href} className="text-text-2 no-underline hover:text-text-1">
              {l.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-3 sm:flex">
            <StarPill />
            <ButtonLink href={site.startPath} size="sm">
              Deploy your own
            </ButtonLink>
          </div>
          <ButtonLink href={site.startPath} size="sm" className="!px-4 sm:hidden">
            Deploy
          </ButtonLink>
          <MobileMenu links={mainNav} />
        </div>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-bg">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-10 px-6 pb-8 pt-14">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
          {footerNav.map((col) => (
            <div key={col.heading} className="flex flex-col gap-2.5">
              <h3 className="m-0 mb-1 text-[13px] font-bold uppercase tracking-[0.06em] text-text-3">{col.heading}</h3>
              {col.links.map((l) => (
                <Link key={l.href + l.label} href={l.href} className="text-[14px] text-text-2 no-underline hover:text-text-1">
                  {l.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap justify-between gap-4 border-t border-line pt-6 text-[13px] text-text-3">
          <span className="flex flex-col gap-1.5">
            <span>
              Made by{' '}
              <a href={site.founder.url} target="_blank" rel="noopener noreferrer" className="text-text-2 hover:text-text-1">
                {site.founder.name}
              </a>{' '}
              ·{' '}
              <a href={site.founder.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-text-2 hover:text-text-1">
                {site.founder.twitter}
              </a>
            </span>
            <span>{site.disclaimer}</span>
          </span>
          <WorksWithSpotify />
        </div>
      </div>
    </footer>
  );
}

/** Closing call-to-action band used at the bottom of most pages. */
export function CtaBand({ title, body, cta = 'Deploy your own', href = site.startPath }: { title: string; body?: string; cta?: string; href?: string }) {
  return (
    <section className="px-6 py-12 sm:py-[72px]">
      <div className="mx-auto flex max-w-[1152px] flex-col items-start justify-between gap-6 rounded-panel bg-surface-2 p-8 sm:flex-row sm:items-center sm:p-12">
        <div className="flex flex-col gap-2">
          <h2 className="m-0 text-[28px] font-extrabold tracking-[-0.03em] sm:text-[36px]">{title}</h2>
          {body ? <p className="m-0 text-[16px] text-text-2">{body}</p> : null}
        </div>
        <ButtonLink href={href} size="lg">
          {cta}
        </ButtonLink>
      </div>
    </section>
  );
}
