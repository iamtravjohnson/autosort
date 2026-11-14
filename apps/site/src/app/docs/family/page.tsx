import Link from 'next/link';
import { DocsNote, DocsPage, DocsTable, P, QuickAnswer, Screenshot, Step, Steps } from '@/components/docs/docs-ui';
import { JsonLd } from '@/components/seo';
import { howToJsonLd, pageMetadata } from '@/lib/seo';

const PATH = '/docs/family';
const TITLE = 'Add family members to your AutoSort';
const DESCRIPTION =
  'Share your AutoSort with up to 5 people: add each person in your Spotify app’s User Management, send them an invite link, and they connect their own Spotify account.';

export const metadata = pageMetadata({ title: TITLE, description: DESCRIPTION, path: PATH });

const STEPS = [
  {
    name: 'Add them in the Spotify Developer Dashboard',
    text: 'Open your AutoSort app in the Spotify Developer Dashboard, choose User Management, and add their name and the email they use for Spotify.',
  },
  {
    name: 'Send them an invite link',
    text: 'In AutoSort, open the Family page, enter the same name and email, and copy the invite link.',
  },
  {
    name: 'They connect their own Spotify',
    text: 'They open the link, review what AutoSort can access, and click Connect Spotify.',
  },
];

const TOC = [
  { id: 'dash', label: '1 · Spotify dashboard' },
  { id: 'invite', label: '2 · Invite link' },
  { id: 'connect', label: '3 · They connect' },
  { id: 'limit', label: 'The 5-user limit' },
];

export default function FamilyPage() {
  return (
    <DocsPage path={PATH} title={TITLE} meta="3 min · Owner only" toc={TOC}>
      <QuickAnswer>
        Add each person to your Spotify app&apos;s User Management with their name and Spotify email, then send them an invite link from
        AutoSort&apos;s Family page. Spotify&apos;s Development Mode allows up to 5 users per app, including you. Each person connects their
        own Spotify account and gets their own sources and smart playlists.
      </QuickAnswer>

      <Steps>
        <Step n={1} id="dash" title="Add them in the Spotify Developer Dashboard">
          <P>
            Open your AutoSort app in the <a href="https://developer.spotify.com/dashboard">Spotify Developer Dashboard</a>, choose{' '}
            <strong>User Management</strong>, and add:
          </P>
          <DocsTable
            head={['Field', 'What to enter']}
            minWidth={440}
            rows={[
              ['Full name', 'Anything you’ll recognize, e.g. Sam'],
              ['Email', 'The email they use to log in to Spotify'],
            ]}
          />
          <Screenshot label="User Management tab" caption="User Management in the Spotify Developer Dashboard." height={220} />
        </Step>

        <Step n={2} id="invite" title="Send them an invite link">
          <P>
            In AutoSort, open the <strong>Family</strong> page, enter the same name and email, and copy the invite link. It works once and
            expires after 7 days.
          </P>
          <DocsNote tone="violet" label="Important">
            Do step 1 first. Otherwise they&apos;ll see a 403 error when they connect.{' '}
            <Link href="/docs/troubleshooting#e403">See troubleshooting</Link>.
          </DocsNote>
        </Step>

        <Step n={3} id="connect" title="They connect their own Spotify">
          <P>
            They open the link, review what AutoSort can access, and click <strong>Connect Spotify</strong>. Their status on your Family page
            changes to Connected, and they can pick their own source playlist and smart playlists.
          </P>
        </Step>
      </Steps>

      <section id="limit" aria-labelledby="limit-title" className="flex flex-col gap-3">
        <h2 id="limit-title" className="sr-only">
          The 5-user limit
        </h2>
        <DocsNote tone="warning" label="Limit">
          Spotify&apos;s Development Mode allows up to 5 users per app, including you. For a bigger group, another household can run its own
          free copy of AutoSort with its own Spotify app. See the <Link href="/docs/quick-start">quick start</Link>.
        </DocsNote>
      </section>

      <JsonLd data={howToJsonLd({ name: TITLE, description: DESCRIPTION, totalTime: 'PT3M', steps: STEPS })} />
    </DocsPage>
  );
}
