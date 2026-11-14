import type { ReactNode } from 'react';
import { CheckIcon, XIcon } from '@/components/icons';
import { Avatar } from './people';

const CAN = [
  { t: 'See your playlists and Liked Songs', d: 'To find what you want to organize.' },
  { t: 'Create, edit and reorder playlists', d: 'Only the smart playlists you make, and playlists you choose to sort.' },
  { t: 'Save songs to Liked Songs when you ask', d: 'Never on its own.' },
];

/** "AutoSort will be able to" list with the negative row. */
export function PermissionList() {
  return (
    <section aria-labelledby="perm" className="flex flex-col gap-1">
      <h2 id="perm" className="m-0 mb-2 text-[13px] font-bold uppercase tracking-[0.06em] text-text-3">
        AutoSort will be able to
      </h2>
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {CAN.map((p) => (
          <li key={p.t} className="flex items-start gap-3 py-2.5">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-pill bg-accent-tint text-accent-soft">
              <CheckIcon size={14} strokeWidth={3} />
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-[15px] font-bold">{p.t}</span>
              <span className="text-[13px] text-text-2">{p.d}</span>
            </span>
          </li>
        ))}
        <li className="flex items-start gap-3 py-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-pill bg-surface-3 text-text-3">
            <XIcon size={14} strokeWidth={3} />
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="text-[15px] font-bold">It won&apos;t play music or post anything</span>
            <span className="text-[13px] text-text-2">And it never changes playlists you only follow.</span>
          </span>
        </li>
      </ul>
    </section>
  );
}

/**
 * The Connect card from AppConnect / MAppConnect. Used by /connect and /join/[token].
 * `href` goes to a route handler, so it's a plain <a> (a Link could prefetch it).
 */
export function ConnectCard({
  inviter,
  intro,
  notice,
  href = '/api/auth/login',
  buttonLabel = 'Connect Spotify',
  showConnect = true,
  children,
}: {
  inviter?: string;
  intro: ReactNode;
  notice?: ReactNode;
  href?: string;
  buttonLabel?: string;
  showConnect?: boolean;
  children?: ReactNode;
}) {
  return (
    <main
      id="main"
      className="flex w-full max-w-[520px] flex-col gap-6 rounded-[16px] border border-line bg-surface-1 px-[18px] py-6 sm:px-8 sm:py-9"
    >
      <div className="flex flex-col items-center gap-2.5 text-center">
        {inviter ? (
          <span className="flex items-center gap-2 rounded-pill bg-surface-2 py-1.5 pl-1.5 pr-3 text-[13px] font-semibold">
            <Avatar name={inviter} index={0} size={24} />
            {inviter} invited you
          </span>
        ) : null}
        <h1 className="m-0 text-[30px] font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-[34px]">Connect your Spotify</h1>
        <p className="m-0 text-[15px] leading-[1.55] text-text-2">{intro}</p>
      </div>
      {notice}
      {showConnect ? (
        <>
          <PermissionList />
          <a
            href={href}
            className="inline-flex h-14 w-full items-center justify-center rounded-pill bg-accent px-7 text-[17px] font-bold text-bg no-underline transition-colors duration-[120ms] hover:bg-accent-hover hover:text-bg"
          >
            {buttonLabel}
          </a>
          <p className="m-0 text-center text-[13px] leading-[1.5] text-text-3">
            You&apos;ll sign in on Spotify&apos;s own page. Disconnect any time in Settings, which deletes everything AutoSort stored about you.
          </p>
        </>
      ) : null}
      {children}
    </main>
  );
}
