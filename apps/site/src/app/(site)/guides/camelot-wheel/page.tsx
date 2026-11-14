import Link from 'next/link';
import { camelotTable, camelotToKeyName } from '@autosort/core';
import { CamelotChip } from '@/components/camelot/chip';
import { CamelotWheel } from '@/components/camelot/camelot-wheel';
import { ChevronDownIcon } from '@/components/icons';
import { Breadcrumbs, Faq, JsonLd, Toc } from '@/components/seo';
import { ButtonLink, QuickAnswer } from '@/components/ui';
import { articleJsonLd, pageMetadata, type FaqItem } from '@/lib/seo';
import { formatDate, site } from '@/lib/site';

const PATH = '/guides/camelot-wheel';
const TITLE = 'The Camelot wheel: harmonic mixing, explained';
const DESCRIPTION =
  'Learn the Camelot wheel with an interactive wheel, the four key moves that mix smoothly, and all 24 keys with their Open Key codes and relative keys.';
/** About 1,000 words of prose plus the wheel and the 24-key table (~200 words a minute). */
const READ_MINUTES = 6;

export const metadata = pageMetadata({ title: TITLE, description: DESCRIPTION, path: PATH, type: 'article' });

const TOC = [
  { id: 'wheel', label: 'Interactive wheel' },
  { id: 'rules', label: 'The four moves' },
  { id: 'why', label: 'Why it works' },
  { id: 'table', label: 'All 24 keys' },
  { id: 'playlist', label: 'Mix a Spotify playlist' },
  { id: 'faq', label: 'FAQ' },
];

const FAQ: FaqItem[] = [
  {
    q: 'Who made the Camelot wheel?',
    a: 'DJ Mark Davis devised the Camelot system as an easier way to read the circle of fifths, and Mixed In Key made it popular in its key-detection software. Camelot is a trademark of Mixed In Key LLC. AutoSort is not affiliated with Mixed In Key.',
  },
  {
    q: "What's the difference between Camelot and Open Key?",
    a: 'Same idea, different labels. Open Key, the notation used in Traktor, writes m for minor and d for major and starts its numbering at C major (1d). So C major is 8B in Camelot and 1d in Open Key, and A minor is 8A and 1m.',
  },
  {
    q: 'Why does moving up two numbers add energy?',
    a: 'Two steps clockwise on the wheel raises the key by a whole tone, for example A minor (8A) to B minor (10A). The two keys still share five of their seven notes, so the change sounds like a lift rather than a clash. Use it sparingly, at a peak in the playlist.',
  },
  {
    q: 'Can AutoSort sort my playlist this way?',
    a: "Yes. AutoSort's harmonic mix sort orders a playlist you own by compatible keys while keeping tempo changes small; by default it favors moves within 8 BPM. The sorting engine is open source on npm today, and the one-click self-hosted app is coming soon.",
  },
  {
    q: "Where does AutoSort get each song's key?",
    a: "From ReccoBeats, a free audio-data service, because Spotify closed its own audio-features endpoint to new apps in November 2024. ReccoBeats reports each song's key and mode, and AutoSort converts them to Camelot codes. You can look up a single song with the free BPM and key finder.",
  },
  {
    q: "Doesn't Spotify do this already?",
    a: "Spotify's Smart Reorder, launched in February 2026, reorders a playlist by BPM and key inside Spotify's Mix feature for Premium users. It's a one-time reorder. AutoSort is free, shows the Camelot code for every song, and can keep a smart playlist in harmonic order as new songs arrive.",
  },
];

const h2 = 'm-0 text-[26px] font-extrabold leading-[1.15] tracking-[-0.03em] sm:text-[32px]';
const prose = 'm-0 text-[17px] leading-[1.6] text-prose';

export default function CamelotWheelGuide() {
  const rows = camelotTable();

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col items-start gap-7 px-4 pb-10 pt-6 sm:px-6 sm:pb-16 sm:pt-8 lg:flex-row lg:gap-12">
      <article className="flex w-full min-w-0 flex-1 flex-col gap-7">
        <Breadcrumbs crumbs={[{ name: 'Home', href: '/' }, { name: 'Guides', href: '/guides' }, { name: 'Camelot wheel' }]} path={PATH} />

        <details className="group rounded-[22px] bg-surface-2 lg:hidden">
          <summary className="flex h-11 items-center justify-between px-4 text-[14px] font-semibold text-text-2">
            On this page
            <ChevronDownIcon size={14} className="faq-chevron transition-transform duration-200" />
          </summary>
          <ul className="m-0 flex list-none flex-col gap-1 px-4 pb-4 pt-1">
            {TOC.map((t) => (
              <li key={t.id}>
                <a href={`#${t.id}`} className="block py-1.5 text-[14px] text-text-2 no-underline hover:text-text-1">
                  {t.label}
                </a>
              </li>
            ))}
          </ul>
        </details>

        <header className="flex flex-col gap-4">
          <h1 className="m-0 text-[clamp(38px,5vw,60px)] font-extrabold leading-[1.04] tracking-[-0.035em]">{TITLE}</h1>
          <div className="flex items-center gap-3 text-[14px] text-text-2">
            <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-pill bg-accent text-[13px] font-extrabold text-bg">
              TJ
            </span>
            <span>
              <a href={site.founder.url} rel="author" className="font-bold text-text-1 no-underline hover:text-accent-soft">
                {site.founder.name}
              </a>{' '}
              · Updated <time dateTime={site.updated}>{formatDate(site.updated)}</time> · {READ_MINUTES} min read
            </span>
          </div>
        </header>

        <QuickAnswer>
          The Camelot wheel gives each of the 24 musical keys a number from 1 to 12 and a letter: A for minor, B for major. Songs mix
          smoothly when their codes match, sit one number apart with the same letter, or share a number with the other letter. Moving up
          two numbers adds energy.
        </QuickAnswer>

        <CamelotWheel />

        <section id="rules" aria-labelledby="h-rules" className="flex flex-col gap-3.5">
          <h2 id="h-rules" className={h2}>
            The four moves, in plain English
          </h2>
          <ol className="m-0 flex flex-col gap-2.5 pl-[22px] text-[17px] leading-[1.6] text-prose">
            <li>
              <strong className="text-text-1">Stay put.</strong> Same code (8A → 8A) always works.
            </li>
            <li>
              <strong className="text-text-1">Step one number.</strong> Up or down one, same letter (8A → 7A or 9A).
            </li>
            <li>
              <strong className="text-text-1">Swap the letter.</strong> Same number, other letter (8A → 8B) moves between a minor key and its
              relative major.
            </li>
            <li>
              <strong className="text-text-1">Jump two up for energy.</strong> 8A → 10A lifts the mood. Use it sparingly.
            </li>
          </ol>
          <p className={prose}>
            The wheel wraps around, so 12A sits next to 1A. One step down from 1A is 12A, and two steps up from 11B is 1B.
          </p>

          <h3 className="m-0 mt-3 text-[20px] font-bold tracking-[-0.01em]">Two more moves AutoSort allows</h3>
          <p className={prose}>
            AutoSort&apos;s open-source engine also accepts two riskier moves. They work, but the change is more noticeable, so use them as
            accents rather than the backbone of a mix.
          </p>
          <ul className="m-0 flex flex-col gap-2.5 pl-[22px] text-[16px] leading-[1.6] text-prose">
            <li>
              <strong className="text-text-1">Diagonal.</strong> One step clockwise while switching from minor to major (8A → 9B), or one
              step counterclockwise from major to minor (8B → 7A). The keys share six of their seven notes, but the mood flips.
            </li>
            <li>
              <strong className="text-text-1">Semitone lift (+7).</strong> Seven steps clockwise on the same letter (8A → 3A) raises the key
              by one semitone, like a last-chorus key change. The keys share few notes, so it&apos;s a deliberate jolt.
            </li>
          </ul>
          <p className={prose}>
            When AutoSort builds a harmonic mix, it ranks moves in this order: same key first, then one step, then the relative key, then
            diagonal moves, then energy jumps (+2 or +7).
          </p>
        </section>

        <section id="why" aria-labelledby="h-why" className="flex flex-col gap-3.5">
          <h2 id="h-why" className={h2}>
            Why the wheel works
          </h2>
          <p className={prose}>
            The Camelot wheel is the circle of fifths with friendlier labels. Each step clockwise moves the key up a perfect fifth, for
            example from C major (8B) to G major (9B). Keys that sit next to each other share six of their seven notes, which is why a blend
            between them doesn&apos;t clash.
          </p>
          <p className={prose}>
            The outer ring holds the major keys (B) and the inner ring holds the minor keys (A). Each minor key sits beside its relative
            major, which uses exactly the same seven notes. A minor and C major are both played on the white keys of a piano, so they share
            the number 8.
          </p>
          <p className={prose}>
            Numbers make the rules easy to remember. You don&apos;t need to know that E minor and G major are related; you only need to see
            that both are 9.
          </p>
        </section>

        <section id="table" aria-labelledby="h-table" className="flex flex-col gap-3.5">
          <h2 id="h-table" className={h2}>
            All 24 keys: musical key, Camelot and Open Key
          </h2>
          <div className="overflow-x-auto rounded-card border border-line">
            <table className="tnum w-full min-w-[560px] border-collapse text-[15px]">
              <caption className="sr-only">Each musical key with its Camelot code, Open Key code and relative key</caption>
              <thead>
                <tr className="bg-surface-2 text-left">
                  <th scope="col" className="px-4 py-3">
                    Musical key
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Camelot
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Open Key
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Relative key
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const relative = camelotToKeyName(r.camelot.endsWith('A') ? r.camelot.replace('A', 'B') : r.camelot.replace('B', 'A'));
                  return (
                    <tr key={r.camelot} className="border-t border-line">
                      <th scope="row" className="px-4 py-2.5 text-left font-semibold">
                        {r.key}
                      </th>
                      <td className="px-4 py-2.5">
                        <CamelotChip code={r.camelot} fixed />
                      </td>
                      <td className="px-4 py-2.5 text-text-2">{r.openKey}</td>
                      <td className="px-4 py-2.5 text-text-2">{relative}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="m-0 text-[14px] leading-[1.6] text-text-2">
            Need one key fast? The free{' '}
            <Link href="/tools/camelot-converter">Camelot converter</Link> turns any note and mode into its Camelot and Open Key code.
          </p>
        </section>

        <section id="playlist" aria-labelledby="h-playlist" className="flex flex-col gap-3.5">
          <h2 id="h-playlist" className={h2}>
            How to mix a Spotify playlist with the wheel
          </h2>
          <ol className="m-0 flex flex-col gap-2.5 pl-[22px] text-[17px] leading-[1.6] text-prose">
            <li>
              <strong className="text-text-1">Find each song&apos;s key.</strong> Paste a song into the free{' '}
              <Link href="/tools/bpm-key-finder">BPM &amp; key finder</Link> to see its tempo, key and Camelot code.
            </li>
            <li>
              <strong className="text-text-1">Pick a starting song.</strong> A calm, low-energy track gives the mix room to build.
            </li>
            <li>
              <strong className="text-text-1">Choose each next song with the four moves.</strong> Prefer the same key or one step away,
              and keep tempos close. A gap of a few BPM is easy to blend; a big jump is not.
            </li>
            <li>
              <strong className="text-text-1">Save the energy jumps for peaks.</strong> A +2 move works best once or twice in a set.
            </li>
          </ol>
          <p className={prose}>
            Doing this by hand gets slow past a few dozen songs. AutoSort&apos;s harmonic mix sort does it for a whole playlist: it starts
            from the calmest song, then keeps picking the next song with the smoothest key move and the smallest tempo change. Songs without
            key data go at the end. See <Link href="/sort/by-key">sorting a playlist by key</Link> and{' '}
            <Link href="/sort/by-camelot">sorting by Camelot code</Link>, or{' '}
            <Link href="/sort/by-bpm">sort by BPM</Link> when tempo matters more than key.
          </p>
        </section>

        <Faq items={FAQ} />

        <div className="flex flex-wrap items-center justify-between gap-5 rounded-panel bg-surface-2 p-[18px] sm:p-7">
          <div className="flex flex-col gap-1">
            <span className="text-[22px] font-extrabold">Mix your playlist harmonically</span>
            <span className="text-[15px] text-text-2">Free and open source.</span>
          </div>
          <ButtonLink href="/sort/by-key">
            Sort by key with AutoSort
          </ButtonLink>
        </div>
      </article>

      <div className="hidden w-[220px] shrink-0 flex-col gap-3 pt-12 lg:sticky lg:top-[88px] lg:flex">
        <Toc items={TOC} />
        <Link
          href="/tools/camelot-converter"
          className="mt-3 rounded-card bg-surface-1 p-3 text-[14px] font-bold text-text-1 no-underline hover:bg-surface-2 hover:text-text-1"
        >
          Free tool: Camelot converter →
        </Link>
      </div>

      <JsonLd data={articleJsonLd({ headline: TITLE, description: DESCRIPTION, path: PATH, dateModified: site.updated })} />
    </div>
  );
}
