import Link from 'next/link';
import { BpmKeyFinder } from '@/components/camelot/bpm-key-finder';
import { Breadcrumbs, JsonLd } from '@/components/seo';
import { ButtonLink, QuickAnswer } from '@/components/ui';
import { pageMetadata, softwareJsonLd } from '@/lib/seo';

const PATH = '/tools/bpm-key-finder';
const DESCRIPTION =
  'Free Spotify BPM and key finder. Paste a track link to see its tempo, musical key, Camelot code and energy, plus the keys it mixes with. No sign-in.';

export const metadata = pageMetadata({ title: 'Spotify BPM and key finder (free tool)', description: DESCRIPTION, path: PATH });

export default function BpmKeyFinderPage() {
  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-7 px-4 pb-10 pt-6 sm:px-6 sm:pb-16 sm:pt-8">
      <Breadcrumbs crumbs={[{ name: 'Home', href: '/' }, { name: 'Tools', href: '/tools' }, { name: 'BPM & key finder' }]} path={PATH} />
      <h1 className="m-0 text-[clamp(36px,4.6vw,54px)] font-extrabold leading-[1.05] tracking-[-0.035em]">Spotify BPM and key finder</h1>
      <QuickAnswer>
        Paste a Spotify track link to see its tempo in BPM, its musical key, its Camelot code and how energetic it is. It&apos;s free and
        needs no sign-in. To do this for a whole playlist at once, AutoSort can sort it by BPM, key or energy.
      </QuickAnswer>

      <BpmKeyFinder />

      <section aria-labelledby="h-data" className="flex flex-col gap-3">
        <h2 id="h-data" className="m-0 text-[22px] font-extrabold tracking-[-0.02em]">
          Where the numbers come from
        </h2>
        <p className="m-0 text-[16px] leading-[1.6] text-prose">
          Spotify closed its own audio-features endpoint to new apps in November 2024, so this tool reads tempo, key, mode and energy from
          ReccoBeats, a free audio-data service, using the song&apos;s Spotify track ID. The Camelot and Open Key codes and the matching keys
          come from AutoSort&apos;s open-source engine. New or rare songs may not have data yet.
        </p>
        <p className="m-0 text-[16px] leading-[1.6] text-prose">
          New to key codes? Start with <Link href="/guides/camelot-wheel">the Camelot wheel guide</Link>, or convert any key by hand with
          the <Link href="/tools/camelot-converter">Camelot converter</Link>.
        </p>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-5 rounded-panel bg-surface-2 p-6">
        <span className="flex flex-col gap-1">
          <span className="text-[19px] font-extrabold">Need this for 300 songs?</span>
          <span className="text-[14px] text-text-2">AutoSort reads a whole playlist and sorts it by BPM, key or energy.</span>
        </span>
        <ButtonLink href="/sort/by-bpm">Sort a whole playlist</ButtonLink>
      </div>

      <JsonLd
        data={{
          ...softwareJsonLd({ name: 'Spotify BPM and key finder', description: DESCRIPTION, path: PATH, category: 'MusicApplication' }),
          '@type': 'WebApplication',
          browserRequirements: 'Requires JavaScript.',
        }}
      />
    </div>
  );
}
