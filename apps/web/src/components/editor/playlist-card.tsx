import { ruleChips } from '@autosort/core';
import Link from 'next/link';
import { AlertIcon, ExternalIcon, MusicIcon } from '@/components/icons';
import type { SmartPlaylist } from '@/db/schema';
import { coverBackground, timeAgo } from '@/lib/format';
import { friendlyLastError, spotifyPlaylistUrl } from '@/lib/rules-ui';

const DAY = 86_400_000;

/** Songs the last sync added, if that sync ran in the past day (for the "+N today" badge). */
function addedToday(p: SmartPlaylist): number {
  if (!p.lastAddedCount || !p.lastSyncedAt) return 0;
  return Date.now() - p.lastSyncedAt.getTime() < DAY ? p.lastAddedCount : 0;
}

/** Smart playlist card (Components board): cover, "+N today", name, source, rule chips, sync status. */
export function SmartPlaylistCard({ playlist: p, sourceNames }: { playlist: SmartPlaylist; sourceNames: string }) {
  const chips = ruleChips(p.rule);
  const today = addedToday(p);
  const failed = Boolean(p.lastError) && !p.paused;
  return (
    <li
      className="relative flex min-w-0 flex-col gap-3 rounded-card bg-surface-2 p-3"
      style={failed ? { boxShadow: 'inset 0 0 0 1px rgba(248,113,113,0.5)' } : undefined}
    >
      <span
        className="relative flex aspect-square flex-col justify-between rounded-sm p-3.5"
        style={{ background: coverBackground(p.name, p.imageUrl), opacity: p.paused ? 0.55 : 1 }}
        aria-hidden="true"
      >
        {p.imageUrl ? <span /> : <MusicIcon size={26} className="text-bg" />}
        {p.imageUrl ? null : <span className="line-clamp-3 text-[22px] font-extrabold leading-none tracking-[-0.03em] text-bg">{p.name}</span>}
        {today ? <span className="tnum absolute right-2.5 top-2.5 rounded-pill bg-bg px-2.5 py-[3px] text-[12px] font-bold text-text-1">+{today} today</span> : null}
      </span>

      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <Link href={`/app/playlists/${p.id}`} className="truncate text-[15px] font-bold text-text-1 no-underline after:absolute after:inset-0 after:rounded-card hover:text-text-1">
            {p.name}
          </Link>
          <span className="tnum truncate text-[13px] text-text-2">
            {(p.trackCount ?? 0).toLocaleString('en-US')} songs{sourceNames ? ` · from ${sourceNames}` : ''}
          </span>
        </div>
        {p.spotifyPlaylistId ? (
          <a
            href={spotifyPlaylistUrl(p.spotifyPlaylistId)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${p.name} in Spotify`}
            className="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-pill bg-surface-3 text-text-1 hover:bg-[#303035] hover:text-text-1"
          >
            <ExternalIcon size={16} />
          </a>
        ) : null}
      </div>

      {chips.length ? (
        <ul aria-label="Rules" className="m-0 flex list-none flex-wrap gap-1.5 p-0">
          {chips.slice(0, 3).map((c) => (
            <li key={c} className="max-w-full truncate rounded-pill bg-surface-3 px-2.5 py-[3px] text-[12px] font-semibold">
              {c}
            </li>
          ))}
          {chips.length > 3 ? <li className="rounded-pill bg-surface-3 px-2.5 py-[3px] text-[12px] font-semibold text-text-2">+{chips.length - 3}</li> : null}
        </ul>
      ) : null}

      <p className="m-0 mt-auto flex items-center gap-2 text-[12px]">
        {p.paused ? (
          <>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="text-text-3">
              <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
            </svg>
            <span className="text-text-3">Paused · not syncing</span>
          </>
        ) : failed ? (
          <>
            <AlertIcon size={13} className="shrink-0 text-error" />
            <span className="text-error-text">Sync failed · {friendlyLastError(p.lastError)}</span>
          </>
        ) : !p.spotifyPlaylistId ? (
          <>
            <span className="size-2 shrink-0 rounded-pill bg-warning" aria-hidden="true" />
            <span className="text-text-3">Not in Spotify yet</span>
          </>
        ) : (
          <>
            <span className="size-2 shrink-0 rounded-pill bg-success" aria-hidden="true" />
            <span className="text-text-3">Synced {timeAgo(p.lastSyncedAt)}</span>
          </>
        )}
      </p>
    </li>
  );
}
