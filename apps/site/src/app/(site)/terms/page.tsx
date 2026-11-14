import Link from 'next/link';
import { LegalPage, type LegalSection } from '@/components/pages/legal-page';
import { pageMetadata } from '@/lib/seo';
import { site } from '@/lib/site';

export const metadata = pageMetadata({
  title: 'Terms',
  description:
    'AutoSort is free, MIT-licensed open-source software provided as is. It is not affiliated with Spotify, and anyone who runs it must follow Spotify’s Developer Terms.',
  path: '/terms',
});

const ext = { target: '_blank', rel: 'noopener noreferrer' } as const;

const sections: LegalSection[] = [
  {
    id: 'license',
    heading: 'The license',
    body: (
      <p>
        AutoSort&apos;s code is released under the MIT license. You can use, copy, change and share it, including commercially, as long as
        you keep the copyright and license notice. The full text is in the{' '}
        <a href={`${site.github}/blob/main/LICENSE`} {...ext}>
          LICENSE file on GitHub
        </a>
        .
      </p>
    ),
  },
  {
    id: 'as-is',
    heading: 'Provided as is',
    body: (
      <p>
        AutoSort and this website are provided &ldquo;as is&rdquo;, without warranty of any kind. The maintainers aren&apos;t liable for lost
        playlists, changed song order or other problems from using it. AutoSort logs every sync with Undo, but keep your own backup of any
        playlist that matters to you.
      </p>
    ),
  },
  {
    id: 'spotify',
    heading: 'Not affiliated with Spotify',
    body: <p>{site.disclaimer} Spotify is a trademark of Spotify AB.</p>,
  },
  {
    id: 'developer-terms',
    heading: 'Your Spotify developer app',
    body: (
      <p>
        Each copy of AutoSort uses its own Spotify developer app, created by whoever deploys it. If you run a copy, you agree to follow{' '}
        <a href="https://developer.spotify.com/terms" {...ext}>
          Spotify&apos;s Developer Terms
        </a>{' '}
        and Developer Policy, including the Development Mode limit of 5 users per app and the rule against feeding Spotify data to AI
        models.
      </p>
    ),
  },
  {
    id: 'site',
    heading: 'Using this website',
    body: (
      <p>
        The guides, recipes and tools on autosort.app are free to use and are for general information. Details about Spotify and other apps
        can change; our <Link href="/compare">comparisons</Link> show the date they were checked.
      </p>
    ),
  },
  {
    id: 'changes',
    heading: 'Changes to these terms',
    body: (
      <p>
        We may update these terms as AutoSort changes. When we do, we&apos;ll change the effective date above. Questions?{' '}
        <a href={`${site.github}/issues/new`} {...ext}>
          Open an issue on GitHub
        </a>
        .
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms"
      path="/terms"
      sibling={{ label: 'Privacy', href: '/privacy' }}
      inShort={[
        'AutoSort is free, open-source software under the MIT license: use it, change it and share it.',
        'It’s provided as is, without warranty, so keep your own backup of any playlist that matters.',
        'It isn’t affiliated with Spotify. If you run a copy, you agree to follow Spotify’s Developer Terms.',
      ]}
      sections={sections}
    />
  );
}
