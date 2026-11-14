import { ruleChips } from '@autosort/core';
import Link from 'next/link';
import type { SmartPlaylist } from '@/db/schema';
import { coverGradient, timeAgo } from '@/lib/format';
import { isWithinDay } from '@/lib/stats';
import { ExternalGlyph, MusicGlyph, PauseGlyph, WarningGlyph } from './glyphs';
import { withBase } from '@/lib/base-path';

/** A small rule chip: "Genre: Country" → muted "Genre:" + value. */
function MiniChip({ text }: { text: string }) {
  const i = text.indexOf(': ');
  return (
    <span className="inline-flex max-w-full items-center gap-1 truncate rounded-pill bg-surface-3 px-[9px] py-[3px] text-[12px] font-semibold text-text-1">
      {i > 0 ? <span className="text-text-3">{text.slice(0, i)}:</span> : null}
      <span className="truncate">{i > 0 ? text.slice(i + 2) : text}</span>
    </span>
  );
}

/** Smart playlist card (Components board): cover, "+N today", rule chips, Open in Spotify, status line. */
export function SmartPlaylistCard({ playlist: p, from, needsReconnect }: { playlist: SmartPlaylist; from?: string; needsReconnect: boolean }) {
  const failed = Boolean(p.lastError) && !p.paused;
  const today = isWithinDay(p.lastSyncedAt) && (p.lastAddedCount ?? 0) > 0 ? (p.lastAddedCount ?? 0) : 0;
  const chips = ruleChips(p.rule);
  const songs = (p.trackCount ?? 0).toLocaleString('en-US');
  return (
    <article
      className="relative flex flex-col gap-2.5 rounded-card bg-surface-2 p-2.5 sm:p-3"
      style={failed ? { boxShadow: 'inset 0 0 0 1px rgba(248,113,113,0.5)' } : undefined}
    >
      <div
        className={`relative flex aspect-square flex-col justify-between rounded-sm p-3 sm:p-3.5 ${p.paused ? 'opacity-55' : ''}`}
        style={{ background: coverGradient(p.name) }}
        aria-hidden="true"
      >
        <MusicGlyph size={24} className="text-bg" />
        <span className="line-clamp-3 text-[19px] font-extrabold leading-none tracking-[-0.03em] text-bg sm:text-[22px]">{p.name}</span>
        {today ? (
          <span className="tnum absolute right-2 top-2 rounded-pill bg-bg px-2 py-0.5 text-[11px] font-bold text-text-1 sm:right-2.5 sm:top-2.5 sm:px-[9px] sm:py-[3px] sm:text-[12px]">
            +{today} today
          </span>
        ) : null}
      </div>
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <Link
            href={`/app/playlists/${p.id}`}
            className="truncate text-[14px] font-bold text-text-1 no-underline after:absolute after:inset-0 after:rounded-card after:content-[''] hover:text-text-1 sm:text-[15px]"
          >
            {p.name}
          </Link>
          <span className="tnum truncate text-[12px] text-text-2 sm:text-[13px]">
            {songs} songs{from ? ` · from ${from}` : ''}
            {today ? <span className="sr-only">, {today} added today</span> : null}
          </span>
        </div>
        {p.spotifyPlaylistId ? (
          <a
            href={`https://open.spotify.com/playlist/${p.spotifyPlaylistId}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${p.name} in Spotify`}
            className="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-pill bg-surface-3 text-text-1 hover:bg-[#303035] hover:text-text-1"
          >
            <ExternalGlyph size={16} />
          </a>
        ) : null}
      </div>
      {chips.length ? (
        <div className="hidden flex-wrap gap-1.5 sm:flex">
          {chips.slice(0, 4).map((c) => (
            <MiniChip key={c} text={c} />
          ))}
        </div>
      ) : null}
      <span className="mt-auto flex items-center gap-1.5 text-[12px] text-text-3">
        {p.paused ? (
          <>
            <PauseGlyph size={12} className="text-text-2" />
            <span className="text-text-2">Paused · not syncing</span>
          </>
        ) : failed ? (
          <span className="flex items-center gap-1.5 text-error-text">
            <WarningGlyph size={12} />
            Sync failed ·{' '}
            {needsReconnect ? (
              <a href={withBase('/api/auth/login')} className="relative z-10 text-error-text underline">
                Reconnect
              </a>
            ) : (
              <Link href="/app/activity?filter=problems" className="relative z-10 text-error-text underline">
                Details
              </Link>
            )}
          </span>
        ) : p.lastSyncedAt ? (
          <>
            <span className="size-2 rounded-pill bg-success" aria-hidden="true" />
            Synced {timeAgo(p.lastSyncedAt)}
          </>
        ) : (
          <>
            <span className="size-2 rounded-pill bg-surface-3" aria-hidden="true" />
            Not synced yet
          </>
        )}
      </span>
    </article>
  );
}
