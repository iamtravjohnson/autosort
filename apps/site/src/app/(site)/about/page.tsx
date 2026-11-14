import Link from 'next/link';
import { Breadcrumbs, JsonLd } from '@/components/seo';
import { QuickAnswer } from '@/components/ui';
import { pageMetadata , founderPerson } from '@/lib/seo';
import { absoluteUrl, site } from '@/lib/site';

const TITLE = "I built AutoSort for my family's Favs playlists";

export const metadata = pageMetadata({
  title: 'About AutoSort: why Travis Johnson built it',
  absoluteTitle: true,
  description:
    "Why Travis Johnson built AutoSort: years of songs in one Favs playlist, only ever hearing the newest ones, and a family that wanted 90s Country, Clean Rap and Worship on demand.",
  path: '/about',
});

const H2 = 'm-0 text-[24px] font-extrabold tracking-[-0.02em] sm:text-[30px]';

const promises = [
  { title: 'Free, for good', body: 'No plans, no upsells, no paid tier. The code is MIT licensed.' },
  { title: 'Your data stays yours', body: 'Each family runs its own copy on its own accounts and database. There’s no central AutoSort server.' },
  {
    title: 'Plays by Spotify’s rules',
    body: 'It runs within Spotify’s Development Mode limits and never feeds Spotify data to AI models. Smart playlists come from rules you can read and edit.',
  },
];

const aboutJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  name: TITLE,
  url: absoluteUrl('/about'),
  mainEntity: founderPerson,
};

export default function AboutPage() {
  return (
    <div className="mx-auto flex max-w-[1000px] flex-col gap-10 px-4 pb-10 pt-6 sm:px-6 sm:pb-16 sm:pt-8">
      <Breadcrumbs crumbs={[{ name: 'Home', href: '/' }, { name: 'About' }]} path="/about" />
      <JsonLd data={aboutJsonLd} />

      <div className="flex flex-wrap items-center gap-6 sm:gap-10">
        <span
          role="img"
          aria-label={`${site.founder.name}, initials avatar`}
          className="flex size-24 flex-none items-center justify-center rounded-pill bg-accent text-[36px] font-extrabold tracking-[-0.03em] text-bg"
        >
          TJ
        </span>
        <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-4">
          <h1 className="m-0 text-[clamp(38px,5vw,56px)] font-extrabold leading-[1.04] tracking-[-0.035em]">{TITLE}</h1>
          <p className="m-0 text-[17px] leading-[1.6] text-text-2">
            {site.founder.name} · creator of AutoSort ·{' '}
            <a href={site.founder.url} target="_blank" rel="noopener noreferrer author">
              travisjohnson.com ↗
            </a>{' '}
            ·{' '}
            <a href={site.founder.twitterUrl} target="_blank" rel="noopener noreferrer me">
              {site.founder.twitter} on X ↗
            </a>
          </p>
        </div>
      </div>

      <QuickAnswer>
        AutoSort is an independent, open-source project started by {site.founder.name} to organize the one giant &ldquo;Favs&rdquo;
        playlist his family kept adding to. It isn&apos;t a company product and isn&apos;t affiliated with Spotify. It&apos;s free, and each
        family runs its own copy on its own accounts.
      </QuickAnswer>

      <section aria-labelledby="h-story" className="flex max-w-[720px] flex-col gap-4 text-[18px] leading-[1.7] text-prose">
        <h2 id="h-story" className={`${H2} text-text-1`}>
          The story
        </h2>
        <p className="m-0">
          For years, I added every song I liked to one playlist called Favs. It was easy, and it never stopped growing. But when I pressed
          play, I mostly heard the newest songs at the top. Everything older got buried.
        </p>
        <p className="m-0">
          What I wanted was simple: put on 90s Country, Clean Rap or Worship whenever I felt like it. Those songs were already in Favs, just
          not in a form I could play.
        </p>
        <p className="m-0">
          So I built AutoSort for my wife, our sons and me. We keep adding songs to our Favs the same way we always have, and every day
          AutoSort files the new ones into smart playlists like Country, 90s Country, Clean Rap and Worship.
        </p>
        <p className="m-0">
          It&apos;s open source because a tool that reads your music library should be one you can inspect and run yourself. The engine
          runs our family&apos;s setup today, and I&apos;m finishing a self-hosted version so other families can run their own copy.
        </p>
      </section>

      <section aria-labelledby="h-princ" className="flex flex-col gap-4">
        <h2 id="h-princ" className={H2}>
          What AutoSort promises
        </h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3.5">
          {promises.map((p) => (
            <div key={p.title} className="rounded-card bg-surface-1 p-5">
              <h3 className="m-0 mb-1.5 text-[17px] font-bold">{p.title}</h3>
              <p className="m-0 text-[14px] leading-normal text-text-2">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-panel bg-surface-2 p-6">
        <p className="m-0 text-[16px] text-text-2">
          Questions or ideas?{' '}
          <a href={`${site.github}/issues/new`} target="_blank" rel="noopener noreferrer">
            Open an issue on GitHub
          </a>
          . Curious how it&apos;s built? Read about the <Link href="/open-source">open-source project</Link> or what&apos;s new in the{' '}
          <Link href="/changelog">changelog</Link>.
        </p>
      </div>
    </div>
  );
}
