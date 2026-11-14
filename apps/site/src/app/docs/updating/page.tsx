import Link from 'next/link';
import { CodeBlock, DocsNote, DocsPage, DocsSection, P, QuickAnswer, Screenshot, Step, Steps } from '@/components/docs/docs-ui';
import { JsonLd } from '@/components/seo';
import { howToJsonLd, pageMetadata } from '@/lib/seo';
import { site } from '@/lib/site';

const PATH = '/docs/updating';
const TITLE = 'Updating your AutoSort';
const DESCRIPTION =
  'Update your self-hosted AutoSort in about two minutes: click Sync fork on GitHub, let Vercel redeploy, and roll back with Vercel’s Instant Rollback if something goes wrong.';

export const metadata = pageMetadata({ title: TITLE, description: DESCRIPTION, path: PATH });

const STEPS = [
  { name: 'Check your version', text: 'Open Settings in your AutoSort. The Instance section shows your version and whether a newer one is out.' },
  { name: 'Sync your fork on GitHub', text: 'Open your autosort repository on GitHub, click Sync fork, then Update branch.' },
  { name: 'Wait for Vercel to redeploy', text: 'Vercel picks up the change and redeploys, usually within a few minutes.' },
];

const TOC = [
  { id: 'u1', label: '1 · Check your version' },
  { id: 'u2', label: '2 · Sync your fork' },
  { id: 'u3', label: '3 · Wait for Vercel' },
  { id: 'rollback', label: 'Rolling back' },
];

export default function UpdatingPage() {
  return (
    <DocsPage path={PATH} title={TITLE} meta="about 2 minutes" toc={TOC}>
      <QuickAnswer>
        When AutoSort&apos;s Settings shows “Update available”, open your AutoSort repository on GitHub and click Sync fork, then Update
        branch. Vercel redeploys automatically within a few minutes. Your playlists, rules and family members are kept, and nothing in
        Spotify changes. If something breaks, roll back in Vercel.
      </QuickAnswer>

      <Steps>
        <Step n={1} id="u1" title="Check your version">
          <P>
            Open <strong>Settings</strong> in your AutoSort. The Instance section shows your version and whether a newer one is out. The{' '}
            <Link href="/changelog">changelog</Link> lists what changed in each release.
          </P>
          <Screenshot label="Settings, update banner" height={180} />
        </Step>

        <Step n={2} id="u2" title="Sync your fork on GitHub">
          <P>
            Go to your <code>autosort</code> repository on GitHub, click <strong>Sync fork</strong>, then <strong>Update branch</strong>.
          </P>
          <Screenshot url="github.com/you/autosort" label="GitHub Sync fork menu" height={180} />
          <P className="text-[15px]">Prefer the command line? From a local clone of your fork:</P>
          <CodeBlock
            title="Terminal · update from the command line"
            label="update commands"
            lines={[`git remote add upstream ${site.github}.git`, 'git fetch upstream', 'git merge upstream/main', 'git push']}
          />
        </Step>

        <Step n={3} id="u3" title="Wait for Vercel to redeploy">
          <P>
            Vercel picks up the new commit and redeploys, usually within a few minutes. Reload your AutoSort and the update banner disappears.
          </P>
          <Screenshot url="vercel.com" label="Vercel deployment ready" height={180} />
        </Step>
      </Steps>

      <DocsNote tone="violet" label="Important">
        If you changed the code in your copy, Sync fork may report conflicts. Read the release notes in the{' '}
        <Link href="/changelog">changelog</Link> before merging.
      </DocsNote>

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
