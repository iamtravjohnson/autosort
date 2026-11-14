import type { Metadata } from 'next';
import Link from 'next/link';
import { AddMember } from '@/components/access/add-member';
import { ConfirmDialog, SubmitButton } from '@/components/access/confirm-dialog';
import { CopyRow } from '@/components/access/copy-button';
import { Avatar, ConnectionPill, StatusPill } from '@/components/access/people';
import { InfoIcon } from '@/components/icons';
import { docsUrl, familyMembers, INVITE_DAYS, openInvites, userManagementUrl } from '@/lib/access';
import { appOrigin, MAX_PEOPLE } from '@/lib/config';
import { count } from '@/lib/format';
import { requireOwner } from '@/lib/session';
import { createInvite, removeMember, revokeInvite } from './actions';

export const metadata: Metadata = { title: 'Family' };

const rowAction = 'inline-flex h-9 items-center rounded-pill px-3.5 text-[13px] font-bold text-text-2 hover:bg-surface-2 hover:text-text-1';

/** Owner only: who's on this AutoSort, open invites, and adding someone new. */
export default async function FamilyPage() {
  const me = await requireOwner();
  const [members, invites, origin] = await Promise.all([familyMembers(), openInvites(), appOrigin()]);
  const pending = invites.filter((i) => !i.expired);
  const used = Math.min(MAX_PEOPLE, members.length + pending.length);
  const full = members.length + pending.length >= MAX_PEOPLE;

  return (
    <div className="min-h-full" style={{ background: 'linear-gradient(180deg, #2A1F3A 0px, #141416 260px)' }}>
      <div className="flex max-w-[1000px] flex-col gap-7 p-6 sm:p-8">
        <div className="flex flex-col gap-2">
          <nav aria-label="Breadcrumb" className="flex gap-2 text-[13px] text-text-2">
            <Link href="/app/settings" className="text-text-2 no-underline hover:text-text-1">
              Settings
            </Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page" className="text-text-1">
              Family
            </span>
          </nav>
          <h1 className="m-0 text-[32px] font-extrabold tracking-[-0.03em] sm:text-[44px] sm:tracking-[-0.035em]">Family</h1>
          <p className="m-0 text-[15px] leading-[1.55] text-text-2">
            Everyone gets their own sources and smart playlists. Only you (the owner) can add or remove people.
          </p>
        </div>

        <section aria-labelledby="members" className="flex flex-col gap-3 rounded-card bg-surface-2 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 id="members" className="m-0 text-[18px] font-bold">
              Members
            </h2>
            <span className="tnum text-[13px] text-text-2">
              <strong className="text-text-1">
                {used} of {MAX_PEOPLE}
              </strong>{' '}
              spots used
            </span>
          </div>
          <div role="img" aria-label={`${used} of ${MAX_PEOPLE} spots used`} className="flex gap-1">
            {Array.from({ length: MAX_PEOPLE }, (_, i) => (
              <span key={i} className={`h-1.5 flex-1 rounded-pill ${i < used ? 'bg-accent' : 'bg-surface-3'}`} />
            ))}
          </div>

          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {members.map((m, i) => (
              <li key={m.id} className="flex flex-wrap items-center gap-3.5 rounded-card bg-surface-3 p-3">
                <Avatar name={m.name} index={i} />
                <span className="flex min-w-0 flex-[1_1_180px] flex-col">
                  <span className="truncate text-[15px] font-bold">
                    {m.name}
                    {m.id === me.id ? <span className="font-semibold text-text-3"> (you)</span> : null}
                  </span>
                  <span className="text-[13px] text-text-2">{m.role === 'owner' ? 'Owner' : 'Member'}</span>
                </span>
                <span className="tnum min-w-[140px] text-[13px] text-text-2">{count(m.smartPlaylists, 'smart playlist')}</span>
                <ConnectionPill state={m.connection} />
                {m.role !== 'owner' ? (
                  <ConfirmDialog
                    trigger={
                      <>
                        Remove<span className="sr-only"> {m.name}</span>
                      </>
                    }
                    triggerClassName={rowAction}
                    title={`Remove ${m.name}?`}
                    confirmLabel={`Remove ${m.name}`}
                    pendingLabel="Removing…"
                    action={removeMember}
                    fields={{ userId: m.id }}
                  >
                    <p className="m-0">
                      This deletes everything AutoSort stored for {m.name}: their sources, smart playlists and activity. Their playlists in Spotify stay
                      where they are.
                    </p>
                    <p className="m-0">
                      To free the spot in Spotify too, remove them from User Management in your Spotify developer dashboard.
                    </p>
                  </ConfirmDialog>
                ) : null}
              </li>
            ))}

            {invites.map((inv, i) => {
              const link = `${origin}/join/${inv.token}`;
              return (
                <li key={inv.token} className="flex flex-wrap items-center gap-3.5 rounded-card bg-surface-3 p-3">
                  <Avatar name={inv.name} index={members.length + i} />
                  <span className="flex min-w-0 flex-[1_1_180px] flex-col">
                    <span className="truncate text-[15px] font-bold">{inv.name}</span>
                    <span className="truncate text-[13px] text-text-2">{inv.email ?? 'Invite link'}</span>
                  </span>
                  <span className="tnum min-w-[140px] text-[13px] text-text-2">{inv.meta}</span>
                  {inv.expired ? <StatusPill tone="warning">Expired</StatusPill> : <StatusPill tone="info">Invited</StatusPill>}
                  <form action={revokeInvite}>
                    <input type="hidden" name="token" value={inv.token} />
                    <SubmitButton className={rowAction} pendingLabel={inv.expired ? 'Clearing…' : 'Revoking…'}>
                      {inv.expired ? 'Clear' : 'Revoke'}
                      <span className="sr-only"> invite for {inv.name}</span>
                    </SubmitButton>
                  </form>
                  {!inv.expired ? (
                    <div className="basis-full">
                      <CopyRow value={link} display={link.replace(/^https?:\/\//, '')} description={`Copy invite link for ${inv.name}`} truncate />
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="add" className="flex flex-col gap-5 rounded-card border border-accent/40 bg-surface-2 p-4 sm:p-6">
          <div className="flex flex-col gap-1">
            <h2 id="add" className="m-0 text-[20px] font-bold">
              Add a family member
            </h2>
            <p className="m-0 text-[14px] leading-[1.5] text-text-2">Spotify requires two steps while your app is in development mode.</p>
          </div>
          {full ? (
            <p role="status" className="m-0 rounded-card bg-surface-3 px-4 py-3 text-[14px] leading-[1.55] text-text-2">
              All {MAX_PEOPLE} spots are in use. Remove someone or revoke an invite to add another person.
            </p>
          ) : (
            <AddMember action={createInvite} userManagementUrl={userManagementUrl()} inviteDays={INVITE_DAYS} />
          )}
        </section>

        <div role="note" className="flex gap-3 rounded-card border border-info/30 bg-info/[0.08] px-4 py-3.5">
          <InfoIcon size={18} className="mt-0.5 shrink-0 text-info-text" />
          <p className="m-0 text-[14px] leading-[1.55] text-[#E0F2FE]">
            <strong className="text-text-1">Why only {MAX_PEOPLE}?</strong> Spotify limits apps in development mode to {MAX_PEOPLE} people, including
            you. Pending invites hold a spot until they&apos;re used or expire.{' '}
            <a href={docsUrl('family')} target="_blank" rel="noopener noreferrer">
              Read the docs
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
