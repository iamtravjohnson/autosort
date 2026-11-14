import Link from 'next/link';
import { LegalPage, type LegalSection } from '@/components/pages/legal-page';
import { pageMetadata } from '@/lib/seo';
import { site } from '@/lib/site';

export const metadata = pageMetadata({
  title: 'Privacy',
  description:
    'How AutoSort handles data: this website is static with no accounts or cookies, and the self-hosted app keeps your Spotify data in your own accounts. Plain-language draft.',
  path: '/privacy',
});

const issues = `${site.github}/issues/new`;

const sections: LegalSection[] = [
  {
    id: 'who',
    heading: 'Who runs this site',
    body: (
      <p>
        autosort.app is run by <a href={site.founder.url}>{site.founder.name}</a>, who started AutoSort as an independent open-source
        project. It isn&apos;t a company, and it isn&apos;t affiliated with or endorsed by Spotify.
      </p>
    ),
  },
  {
    id: 'site',
    heading: 'This website',
    body: (
      <>
        <p>autosort.app is a simple, mostly static website. There are no accounts to create, nothing to sign in to and no ads.</p>
        <p>
          It&apos;s hosted on Vercel. Like most hosts, Vercel may log basic details of each request, such as your IP address, browser and the
          page you asked for, to run and protect the service.
        </p>
        <p>
          The <Link href="/tools/bpm-key-finder">BPM &amp; key finder</Link> is the one exception worth knowing about: when you paste a
          Spotify track link, this site sends that track&apos;s ID to ReccoBeats, a free music-data service, to look up its tempo, key and
          energy. Only the track ID is sent, nothing about you.
        </p>
      </>
    ),
  },
  {
    id: 'app',
    heading: 'The self-hosted app',
    body: (
      <>
        <p>
          AutoSort&apos;s app is self-hosted. Each family deploys its own copy to its own Vercel account and database, with its own Spotify
          developer app. Playlists, tokens and settings live there.
        </p>
        <p>
          <strong>The AutoSort project never receives that data</strong>, and the maintainers have no access to it. Whoever deploys a copy
          is responsible for the data in it, including for the people they invite (up to 5 per Spotify app).
        </p>
        <p>The one-click app isn&apos;t released yet; this section describes how it&apos;s built to work.</p>
      </>
    ),
  },
  {
    id: 'spotify',
    heading: 'Spotify data',
    body: (
      <ul>
        <li>
          <strong>What it reads:</strong> your playlists and their songs, plus details Spotify provides, such as the explicit flag
          and album release dates.
        </li>
        <li>
          <strong>Lookups:</strong> BPM, key and energy come from ReccoBeats, original release years from MusicBrainz and optional tags
          from Last.fm. These lookups send song identifiers (track IDs, ISRCs, artist and song names), not your account details.
        </li>
        <li>
          <strong>Tokens:</strong> your Spotify access tokens are stored encrypted in your own database.
        </li>
        <li>
          <strong>Disconnecting:</strong> disconnecting Spotify deletes the Spotify data your AutoSort stored about you.
        </li>
        <li>
          <strong>No AI:</strong> AutoSort never sends Spotify data to AI models, which Spotify&apos;s Developer Policy forbids. Smart
          playlists come from rules you can read and edit.
        </li>
      </ul>
    ),
  },
  {
    id: 'cookies',
    heading: 'Cookies',
    body: <p>This website doesn&apos;t set any cookies. Your own AutoSort deployment is separate from this site.</p>,
  },
  {
    id: 'rights',
    heading: 'Your rights and contact',
    body: (
      <>
        <p>
          This site doesn&apos;t keep personal data about you, so there&apos;s usually nothing for us to access or delete. For data in a
          self-hosted AutoSort, ask the person who runs that copy, or disconnect Spotify to delete your data. You can also remove an
          app&apos;s access to your account in your Spotify account settings.
        </p>
        <p>
          Questions or requests:{' '}
          <a href={issues} target="_blank" rel="noopener noreferrer">
            open an issue on GitHub
          </a>
          . Please don&apos;t post personal details there. If this policy changes, we&apos;ll update the effective date above.
        </p>
      </>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy"
      path="/privacy"
      sibling={{ label: 'Terms', href: '/terms' }}
      inShort={[
        'This website has no accounts, no ads and no cookies.',
        'The AutoSort app runs on your own Vercel account, with the database Vercel creates for it. The AutoSort project never receives your Spotify data.',
        'Spotify tokens are stored encrypted, disconnecting deletes your data, and nothing is sent to AI models.',
      ]}
      sections={sections}
    />
  );
}
