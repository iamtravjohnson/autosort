import Link from 'next/link';
import { Breadcrumbs } from '@/components/seo';
import { QuickAnswer } from '@/components/ui';
import { pageMetadata } from '@/lib/seo';

const PATH = '/tools';

export const metadata = pageMetadata({
  title: 'Free tools for harmonic mixing',
  description: 'Free Camelot key converter and Spotify BPM and key finder from AutoSort. No sign-in needed.',
  path: PATH,
});

const TOOLS = [
  {
    href: '/tools/camelot-converter',
    title: 'Camelot key converter',
    body: 'Turn any note and mode into its Camelot code, Open Key code and the keys that mix well with it.',
  },
  {
    href: '/tools/bpm-key-finder',
    title: 'Spotify BPM and key finder',
    body: 'Paste a Spotify track link to see its tempo, key, Camelot code and energy.',
  },
  {
    href: '/guides/camelot-wheel',
    title: 'The Camelot wheel, explained',
    body: 'An interactive wheel, the four moves that mix smoothly and all 24 keys in one table.',
  },
];

export default function ToolsPage() {
  return (
    <div className="mx-auto flex max-w-[1000px] flex-col gap-7 px-4 pb-10 pt-6 sm:px-6 sm:pb-16 sm:pt-8">
      <Breadcrumbs crumbs={[{ name: 'Home', href: '/' }, { name: 'Tools' }]} path={PATH} />
      <h1 className="m-0 text-[clamp(36px,4.6vw,54px)] font-extrabold leading-[1.05] tracking-[-0.035em]">Free tools for harmonic mixing</h1>
      <QuickAnswer>
        AutoSort&apos;s free tools help you mix a Spotify playlist by key and tempo. The Camelot converter turns any musical key into its
        Camelot and Open Key code. The BPM and key finder reads a song&apos;s tempo, key and energy from ReccoBeats. Neither needs a sign-in.
      </QuickAnswer>
      <ul className="m-0 grid list-none grid-cols-1 gap-6 p-0 sm:grid-cols-3">
        {TOOLS.map((t) => (
          <li key={t.href}>
            <Link
              href={t.href}
              className="flex h-full flex-col gap-2 rounded-card border border-line bg-surface-1 p-6 text-text-1 no-underline hover:bg-surface-2 hover:text-text-1"
            >
              <span className="text-[20px] font-bold tracking-[-0.01em]">{t.title}</span>
              <span className="text-[15px] leading-[1.55] text-text-2">{t.body}</span>
              <span className="mt-auto pt-2 text-[14px] font-bold text-accent-hover">Open →</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
