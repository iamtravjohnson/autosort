import Link from 'next/link';
import { CamelotConverter } from '@/components/camelot/camelot-converter';
import { Breadcrumbs, JsonLd } from '@/components/seo';
import { ButtonLink, QuickAnswer } from '@/components/ui';
import { pageMetadata, softwareJsonLd } from '@/lib/seo';

const PATH = '/tools/camelot-converter';
const DESCRIPTION =
  'Free Camelot key converter. Pick a note and major or minor to get its Camelot code, its Open Key code and the keys that mix well with it.';

export const metadata = pageMetadata({ title: 'Camelot key converter (free tool)', description: DESCRIPTION, path: PATH });

export default function CamelotConverterPage() {
  return (
    <div className="mx-auto flex max-w-[1000px] flex-col gap-7 px-4 pb-10 pt-6 sm:px-6 sm:pb-16 sm:pt-8">
      <Breadcrumbs crumbs={[{ name: 'Home', href: '/' }, { name: 'Tools', href: '/tools' }, { name: 'Camelot converter' }]} path={PATH} />
      <h1 className="m-0 text-[clamp(36px,4.6vw,54px)] font-extrabold leading-[1.05] tracking-[-0.035em]">Camelot key converter</h1>
      <QuickAnswer>
        Pick a note and choose major or minor to get its Camelot code, its Open Key code and the keys that mix well with it. Minor keys end
        in A and major keys end in B. For example, A minor is 8A and C major is 8B.
      </QuickAnswer>

      <CamelotConverter />

      <section aria-labelledby="h-how" className="flex flex-col gap-3">
        <h2 id="h-how" className="m-0 text-[22px] font-extrabold tracking-[-0.02em]">
          How to read the result
        </h2>
        <ul className="m-0 flex flex-col gap-2 pl-[22px] text-[16px] leading-[1.6] text-prose">
          <li>
            <strong className="text-text-1">Camelot</strong> is the key&apos;s spot on the wheel: a number from 1 to 12 plus A (minor) or B
            (major).
          </li>
          <li>
            <strong className="text-text-1">Open Key</strong> is the same spot in Traktor&apos;s notation: m for minor, d for major, with C
            major as 1d.
          </li>
          <li>
            <strong className="text-text-1">Mixes well with</strong> lists one step down, one step up, the relative key and the +2 energy
            boost. Read <Link href="/guides/camelot-wheel">the Camelot wheel guide</Link> for why these work.
          </li>
        </ul>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-5 rounded-panel bg-surface-2 p-6">
        <span className="flex flex-col gap-1">
          <span className="text-[19px] font-extrabold">Want this for a whole playlist?</span>
          <span className="text-[14px] text-text-2">AutoSort finds the key of every track and orders them for you.</span>
        </span>
        <ButtonLink href="/sort/by-key">Sort a playlist by key</ButtonLink>
      </div>

      <JsonLd
        data={{
          ...softwareJsonLd({ name: 'Camelot key converter', description: DESCRIPTION, path: PATH, category: 'MusicApplication' }),
          '@type': 'WebApplication',
          browserRequirements: 'Requires JavaScript.',
        }}
      />
    </div>
  );
}
