'use client';

import { useActionState, useState } from 'react';
import { ExternalIcon } from '@/components/icons';
import { buttonClass, StepNumber } from '@/components/ui';
import { CopyRow } from './copy-button';

export type InviteState = { ok: true; link: string; name: string } | { ok: false; error: string } | null;

type CreateInvite = (prev: InviteState, formData: FormData) => Promise<InviteState>;

/** "Add a family member": 1 add them in Spotify, 2 create and share an invite link. */
export function AddMember({ action, userManagementUrl, inviteDays }: { action: CreateInvite; userManagementUrl: string; inviteDays: number }) {
  const [round, setRound] = useState(0);
  return <AddMemberSteps key={round} action={action} userManagementUrl={userManagementUrl} inviteDays={inviteDays} onAnother={() => setRound((r) => r + 1)} />;
}

function AddMemberSteps({
  action,
  userManagementUrl,
  inviteDays,
  onAnother,
}: {
  action: CreateInvite;
  userManagementUrl: string;
  inviteDays: number;
  onAnother: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [added, setAdded] = useState(false);
  const [state, formAction, pending] = useActionState(action, null);
  const who = name.trim() || 'them';
  const first = name.trim().split(/\s+/)[0] || 'they';

  return (
    <div className="flex flex-col gap-5 lg:flex-row">
      <div className="flex flex-1 flex-col gap-3 rounded-card bg-surface-3 p-[18px]">
        <span className="flex items-center gap-2.5">
          <StepNumber n={1} size={28} />
          <h3 className="m-0 text-[16px] font-bold">Add {who} in Spotify</h3>
        </span>
        <p className="m-0 text-[14px] leading-[1.5] text-text-2">
          Open your Spotify app&apos;s <strong className="text-text-1">User Management</strong> tab and enter:
        </p>
        <dl className="m-0 grid grid-cols-[90px_1fr] gap-x-3 gap-y-1.5 rounded-sm bg-bg p-3 text-[14px]">
          <dt className="text-text-3">Full name</dt>
          <dd className="m-0 min-w-0 break-words font-semibold">{name.trim() || 'Their name'}</dd>
          <dt className="text-text-3">Email</dt>
          <dd className="m-0 min-w-0 font-mono text-[13px]">the email {first === 'they' ? 'they use' : `${first} uses`} for Spotify</dd>
        </dl>
        <a href={userManagementUrl} target="_blank" rel="noopener noreferrer" className={buttonClass('secondary', 'sm', 'self-start')}>
          Open User Management
          <ExternalIcon size={15} />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
        <label className="flex items-center gap-2.5 text-[14px] font-semibold">
          <input type="checkbox" checked={added} onChange={(e) => setAdded(e.target.checked)} className="size-5 shrink-0 accent-accent" />
          I&apos;ve added {who} in Spotify
        </label>
      </div>

      <div className="flex flex-1 flex-col gap-3 rounded-card bg-surface-3 p-[18px]">
        <span className="flex items-center gap-2.5">
          <StepNumber n={2} size={28} />
          <h3 className="m-0 text-[16px] font-bold">{state?.ok ? `Send ${state.name} this invite link` : `Send ${who} an invite link`}</h3>
        </span>
        {state?.ok ? (
          <>
            <CopyRow value={state.link} display={state.link.replace(/^https?:\/\//, '')} description="Copy invite link" truncate />
            <span className="text-[12px] text-text-3">
              The link works once and expires in {inviteDays} days. Send it by text or email; it&apos;s also listed under Members.
            </span>
            <button type="button" onClick={onAnother} className="self-start text-[14px] font-bold text-accent-hover hover:text-accent-soft">
              Add someone else
            </button>
          </>
        ) : (
          <form action={formAction} className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="flex flex-1 flex-col gap-1.5 text-[12px] font-semibold text-text-2">
                Name
                <input
                  type="text"
                  name="name"
                  required
                  maxLength={60}
                  autoComplete="off"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 rounded-card border border-white/12 bg-surface-2 px-3 text-[14px] font-normal text-text-1 outline-none focus:border-accent"
                />
              </label>
              <label className="flex flex-[2] flex-col gap-1.5 text-[12px] font-semibold text-text-2">
                Spotify email (optional)
                <input
                  type="email"
                  name="email"
                  maxLength={254}
                  autoComplete="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 rounded-card border border-white/12 bg-surface-2 px-3 text-[14px] font-normal text-text-1 outline-none focus:border-accent"
                />
              </label>
            </div>
            {state && !state.ok ? (
              <p role="alert" className="m-0 rounded-card bg-error/[0.14] px-3 py-2 text-[14px] text-error-text">
                {state.error}
              </p>
            ) : null}
            <button type="submit" disabled={!added || pending} className={buttonClass('primary', 'sm', 'self-start disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-text-3')}>
              {pending ? 'Creating link…' : 'Create invite link'}
            </button>
            <span className="text-[12px] text-text-3">
              {added ? `The link works once and expires in ${inviteDays} days.` : 'Tick the box in step 1 first. Spotify blocks anyone who isn’t on the list.'}
            </span>
          </form>
        )}
      </div>
    </div>
  );
}
