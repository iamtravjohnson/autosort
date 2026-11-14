import Link from 'next/link';
import { CodeBlock, DocsNote, DocsPage, DocsSection, P, QuickAnswer, Screenshot, Step, Steps } from '@/components/docs/docs-ui';
import { JsonLd } from '@/components/seo';
import { howToJsonLd, pageMetadata } from '@/lib/seo';
import { site } from '@/lib/site';

const PATH = '/docs/updating';
const TITLE = 'Updating your AutoSort';
const DESCRIPTION =
  'Update your self-hosted AutoSort in about two minutes: run the Update AutoSort action in your GitHub repository, let Vercel redeploy, and roll back with Vercel’s Instant Rollback if something goes wrong.';

export const metadata = pageMetadata({ title: TITLE, description: DESCRIPTION, path: PATH });

const STEPS = [
  { name: 'Check what’s new', text: 'Open Settings in your AutoSort to see your version, then compare it with the latest release in the changelog.' },
  {
    name: 'Run the Update AutoSort action',
    text: 'In your autosort repository on GitHub, open Actions, choose Update AutoSort, then click Run workflow.',
  },
  { name: 'Wait for Vercel to redeploy', text: 'Vercel picks up the update and redeploys, usually within a few minutes.' },
];

const TOC = [
  { id: 'u1', label: '1 · Check what’s new' },
  { id: 'u2', label: '2 · Run the update' },
  { id: 'u3', label: '3 · Wait for Vercel' },
  { id: 'command-line', label: 'From the command line' },
  { id: 'rollback', label: 'Rolling back' },
];

export default function UpdatingPage() {
  return (
    <DocsPage path={PATH} title={TITLE} meta="about 2 minutes" toc={TOC}>
      <QuickAnswer>
        Open your AutoSort repository on GitHub, go to Actions, choose Update AutoSort and click Run workflow. It copies the newest version
        into your repository, and Vercel redeploys within a few minutes. Your playlists, rules, family members and settings are kept, and
        nothing in Spotify changes. If something breaks, roll back in Vercel.
      </QuickAnswer>

      <Steps>
        <Step n={1} id="u1" title="Check what’s new">
          <P>
            Open <strong>Settings</strong> in your AutoSort. The Instance section shows your version. The{' '}
            <Link href="/changelog">changelog</Link> lists the latest release and what changed.
          </P>
        </Step>

        <Step n={2} id="u2" title="Run the Update AutoSort action">
          <P>
            Go to your <code>autosort</code> repository on GitHub (Deploy to Vercel created it for you). Open the <strong>Actions</strong> tab,
            choose <strong>Update AutoSort</strong>, then click <strong>Run workflow</strong>. If GitHub asks you to enable workflows first,
            click the green button to turn them on.
          </P>
          <Screenshot url="github.com/you/autosort/actions" label="Update AutoSort, Run workflow" height={180} />
        </Step>

        <Step n={3} id="u3" title="Wait for Vercel to redeploy">
          <P>
            The action commits the update to your repository, and Vercel redeploys it, usually within a few minutes. Any database changes
            apply automatically during that deploy. Reload your AutoSort and check the version in Settings.
          </P>
        </Step>
      </Steps>

      <DocsNote tone="violet" label="Important">
        The update replaces AutoSort&apos;s files with the newest version, so changes you made to the code are overwritten. Your Vercel
        environment variables and everything in your database stay as they are. Read the <Link href="/changelog">changelog</Link> before
        updating.
      </DocsNote>

      <DocsSection id="command-line" title="From the command line" size="md">
        <P>Prefer a terminal? From a local clone of your repository:</P>
        <CodeBlock
          title="Terminal · update from the command line"
          label="update commands"
          lines={[
            `git clone --depth 1 ${site.github}.git /tmp/autosort-latest`,
            'rsync -a --delete --exclude .git --exclude .github /tmp/autosort-latest/apps/web/ ./',
            'git add -A && git commit -m "Update AutoSort" && git push',
          ]}
        />
      </DocsSection>

      <DocsSection id="rollback" title="If something goes wrong" size="md">
        <P>
          In Vercel, open your project&apos;s <strong>Deployments</strong>, find the last deployment that worked, and use{' '}
          <strong>Instant Rollback</strong> to make it live again. Then check <Link href="/docs/troubleshooting">Troubleshooting</Link> or{' '}
          <a href={`${site.github}/issues`}>open an issue on GitHub</a>.
        </P>
      </DocsSection>

      <JsonLd data={howToJsonLd({ name: TITLE, description: DESCRIPTION, totalTime: 'PT2M', steps: STEPS })} />
    </DocsPage>
  );
}
