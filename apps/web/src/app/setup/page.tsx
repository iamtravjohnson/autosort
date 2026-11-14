import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthShell } from '@/components/access/auth-shell';
import { CopyRow } from '@/components/access/copy-button';
import { CheckIcon, ExternalIcon } from '@/components/icons';
import { buttonClass } from '@/components/ui';
import { docsUrl, ownerName, SPOTIFY_DASHBOARD_URL } from '@/lib/access';
import { MAX_PEOPLE, redirectUri } from '@/lib/config';
import { setupStatus, type CheckState } from '@/lib/setup';

export const metadata: Metadata = { title: 'Setup' };

const STATE: Record<CheckState, { label: string; color: string; ring: string }> = {
  done: { label: 'Done', color: 'text-success-text', ring: '' },
  missing: { label: 'Missing', color: 'text-warning-text', ring: 'shadow-[inset_0_0_0_1px_rgba(251,191,36,0.45)]' },
  optional: { label: 'Optional', color: 'text-text-3', ring: '' },
};

function StateIcon({ state }: { state: CheckState }) {
  if (state === 'done') {
    return (
      <span className="flex size-[26px] shrink-0 items-center justify-center rounded-pill bg-success text-bg">
        <CheckIcon size={14} strokeWidth={3} />
      </span>
    );
  }
  if (state === 'missing') {
    return (
      <span className="flex size-[26px] shrink-0 items-center justify-center rounded-pill border-2 border-warning text-[14px] font-extrabold text-warning" aria-hidden="true">
        !
      </span>
    );
  }
  return <span className="size-[26px] shrink-0 rounded-pill border-2 border-dashed border-disabled" aria-hidden="true" />;
}

/** First-run checklist. Stays reachable after setup so the owner can re-check it. */
export default async function SetupPage() {
  const [status, uri] = await Promise.all([setupStatus(), redirectUri()]);
  const owner = status.hasOwner ? await ownerName() : null;
  const total = status.checks.length;
  const done = status.checks.filter((c) => c.state === 'done').length;
  const cron = status.checks.find((c) => c.key === 'cron');
  const fixUrl = docsUrl('troubleshooting');

  const heading = !status.ready
    ? 'Almost there. Finish setting up your AutoSort.'
    : status.hasOwner
      ? 'Your AutoSort is set up.'
      : 'Almost there. Connect Spotify to finish.';
  const lead = !status.ready
    ? 'This page checks your settings each time you reload it.'
    : status.hasOwner
      ? 'Everything required is in place. Come back here any time to re-check your settings.'
      : 'Everything required is in place. Connect your Spotify account below to become the owner.';

  return (
    <AuthShell glow="setup" showVersion>
      <main id="main" className="flex w-full max-w-[680px] flex-col gap-6">
        <div className="flex flex-col items-center gap-2.5 text-center">
          <h1 className="m-0 text-[32px] font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-[44px]">{heading}</h1>
          <p className="m-0 max-w-[520px] text-[16px] leading-[1.55] text-text-2">{lead}</p>
        </div>

        <section aria-labelledby="checklist" className="flex flex-col gap-2.5 rounded-panel border border-line bg-surface-1 p-4 sm:p-6">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="checklist" className="m-0 mb-1.5 text-[18px] font-bold">
              Instance checklist
            </h2>
            <span className="tnum text-[13px] text-text-2">
              {done} of {total} ready
            </span>
          </div>
          <div
            role="progressbar"
            aria-label="Setup progress"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={done}
            aria-valuetext={`${done} of ${total} ready`}
            className="mb-1.5 h-1.5 overflow-hidden rounded-pill bg-surface-3"
          >
            <span className="block h-full rounded-pill bg-accent" style={{ width: `${(done / total) * 100}%` }} />
          </div>
          <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
            {status.checks.map((c) => {
              const s = STATE[c.state];
              return (
                <li key={c.key} className={`flex flex-wrap items-center gap-x-3.5 gap-y-2 rounded-card bg-surface-2 p-3.5 ${s.ring}`}>
                  <StateIcon state={c.state} />
                  <span className="flex min-w-0 flex-1 basis-[200px] flex-col gap-0.5">
                    <span className="text-[15px] font-bold">{c.label}</span>
                    <span className="break-words text-[13px] text-text-2">{c.detail}</span>
                  </span>
                  <span className="ml-auto flex items-center gap-3">
                    <span className={`text-[12px] font-bold ${s.color}`}>{s.label}</span>
                    {c.state === 'missing' ? (
                      <a href={fixUrl} target="_blank" rel="noopener noreferrer" className="whitespace-nowrap text-[13px] font-bold">
                        Fix it →<span className="sr-only"> {c.label} (opens the troubleshooting docs in a new tab)</span>
                      </a>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="redirect" className="flex flex-col gap-3 rounded-panel border border-line bg-surface-1 p-4 sm:p-6">
          <h2 id="redirect" className="m-0 text-[18px] font-bold">
            Paste this Redirect URI into Spotify
          </h2>
          <p className="m-0 text-[14px] leading-[1.55] text-text-2">
            Spotify Developer Dashboard → your app → Settings → Redirect URIs. It must match exactly, including <code>http</code> or{' '}
            <code>https</code>.
          </p>
          <CopyRow value={uri} description="Copy Redirect URI" />
          <a href={SPOTIFY_DASHBOARD_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 self-start text-[14px] font-bold">
            Open Spotify Developer Dashboard
            <ExternalIcon size={15} />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </section>

        <section aria-labelledby="connect" className="flex flex-col items-center gap-3.5 rounded-panel bg-surface-2 px-4 py-7 text-center sm:px-6">
          {!status.ready ? (
            <>
              <h2 id="connect" className="m-0 text-[20px] font-bold">
                Connect your Spotify account
              </h2>
              <p className="m-0 max-w-[460px] text-[14px] leading-[1.55] text-text-2">
                Finish the missing items above, then reload this page. The first person to connect becomes this AutoSort&apos;s owner.
              </p>
              <span
                aria-disabled="true"
                className="inline-flex h-[52px] cursor-not-allowed items-center justify-center rounded-pill bg-surface-3 px-7 text-[16px] font-bold text-text-3"
              >
                Connect your Spotify account
              </span>
            </>
          ) : status.hasOwner ? (
            <>
              <h2 id="connect" className="m-0 text-[20px] font-bold">
                {owner ? `${owner} owns this AutoSort` : 'This AutoSort has an owner'}
              </h2>
              <p className="m-0 max-w-[460px] text-[14px] leading-[1.55] text-text-2">
                The owner can invite up to {MAX_PEOPLE - 1} family members from the Family page. Already a member? Sign in to get back to your playlists.
              </p>
              <Link href="/connect" className={buttonClass('primary', 'lg')}>
                Go to sign in
              </Link>
            </>
          ) : (
            <>
              <h2 id="connect" className="m-0 text-[20px] font-bold">
                Connect your Spotify account
              </h2>
              <p className="m-0 max-w-[460px] text-[14px] leading-[1.55] text-text-2">
                The first person to connect becomes this AutoSort&apos;s owner and can invite up to {MAX_PEOPLE - 1} family members.
              </p>
              <a href="/api/auth/login" className={buttonClass('primary', 'lg')}>
                Connect your Spotify account
              </a>
              {cron && cron.state !== 'done' ? (
                <span className="text-[13px] text-warning-text">You can connect now. The daily sync starts once it&apos;s scheduled.</span>
              ) : null}
            </>
          )}
        </section>
      </main>
    </AuthShell>
  );
}
