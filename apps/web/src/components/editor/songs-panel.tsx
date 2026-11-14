'use client';

import { Suspense, use, useState } from 'react';
import { SpotifyLogo } from '@/components/ui';
import { spotifyTrackUrl } from '@/lib/rules-ui';
import { ActionNotice, Art } from './bits';
import type { SongRow, SongsResult } from './types';

interface Overrides {
  pinned: Record<string, number>;
  exclude: string[];
}

export interface SongsPanelProps {
  songs: Promise<SongsResult>;
  overrides: Overrides;
  onPin: (song: SongRow, index: number) => void;
  onUnpin: (song: SongRow) => void;
  onExclude: (song: SongRow) => void;
  onRestore: (song: SongRow) => void;
}

/** "Songs in Spotify": the playlist's current order, with Pin here / Exclude per row. */
export function SongsPanel(props: SongsPanelProps) {
  return (
    <section aria-labelledby="songs-title" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex max-w-[680px] flex-col gap-1.5">
          <h2 id="songs-title" className="m-0 text-[18px] font-bold">
            In Spotify right now
          </h2>
          <p className="m-0 text-[14px] leading-[1.6] text-text-2">
            AutoSort re-sorts this playlist every time it syncs, so moving songs around in Spotify won&apos;t stick. Pin a song to keep it at its spot, or exclude it to keep it out. Then save.
          </p>
        </div>
        <SpotifyLogo width={78} />
      </div>
      <Suspense fallback={<SongsSkeleton />}>
        <SongsList {...props} />
      </Suspense>
    </section>
  );
}

function SongsSkeleton() {
  return (
    <div role="status" aria-label="Loading songs from Spotify" className="flex flex-col gap-2">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-sm bg-surface-2 p-2">
          <span className="size-10 rounded-art bg-surface-3" />
          <span className="flex flex-1 flex-col gap-1.5">
            <span className="h-3 w-2/5 rounded-art bg-surface-3" />
            <span className="h-3 w-1/4 rounded-art bg-surface-3" />
          </span>
        </div>
      ))}
    </div>
  );
}

const PAGE = 100;

function SongsList({ songs, overrides, onPin, onUnpin, onExclude, onRestore }: SongsPanelProps) {
  const result = use(songs);
  const [showAll, setShowAll] = useState(false);
  if (!result.ok) return <ActionNotice result={result} />;
  if (result.tracks.length === 0) return <p className="m-0 text-[14px] text-text-2">This playlist is empty in Spotify right now. It fills in at the next sync.</p>;

  const excluded = new Set(overrides.exclude);
  const rows = showAll ? result.tracks : result.tracks.slice(0, PAGE);
  return (
    <>
      <ol className="tnum m-0 flex list-none flex-col gap-1 p-0">
        {rows.map((s, i) => {
          const pin = overrides.pinned[s.id];
          const isOut = excluded.has(s.id);
          return (
            <li
              key={`${s.id}-${i}`}
              className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-sm px-2 py-1.5 ${isOut ? 'bg-transparent' : pin !== undefined ? 'bg-warning/[0.08]' : 'hover:bg-surface-2'}`}
            >
              <span className="w-8 text-right text-[14px] text-text-2">{i + 1}</span>
              <Art url={s.imageUrl} size={40} />
              <span className={`flex min-w-0 flex-1 basis-40 flex-col ${isOut ? 'opacity-50' : ''}`}>
                <a href={spotifyTrackUrl(s.id)} target="_blank" rel="noopener noreferrer" className={`truncate text-[14px] font-semibold text-text-1 no-underline hover:underline ${isOut ? 'line-through' : ''}`}>
                  {s.name}
                </a>
                <span className="truncate text-[13px] text-text-2">{s.artist}</span>
              </span>
              <span className="flex flex-wrap items-center gap-1.5">
                {pin !== undefined ? <span className="rounded-pill bg-warning/[0.14] px-2 py-0.5 text-[12px] font-bold text-warning-text">Pinned at #{pin + 1}</span> : null}
                {isOut ? <span className="rounded-pill bg-surface-3 px-2 py-0.5 text-[12px] font-bold text-text-2">Excluded</span> : null}
                {s.manual && !isOut ? <span className="rounded-pill bg-info/[0.14] px-2 py-0.5 text-[12px] font-bold text-info-text">Added in Spotify</span> : null}
              </span>
              <span className="ml-auto flex gap-1">
                {isOut ? null : pin !== undefined ? (
                  <RowButton onClick={() => onUnpin(s)} label={`Unpin ${s.name}`}>
                    Unpin
                  </RowButton>
                ) : (
                  <RowButton onClick={() => onPin(s, i)} label={`Pin ${s.name} at number ${i + 1}`}>
                    Pin here
                  </RowButton>
                )}
                {isOut ? (
                  <RowButton onClick={() => onRestore(s)} label={`Restore ${s.name}`}>
                    Restore
                  </RowButton>
                ) : (
                  <RowButton onClick={() => onExclude(s)} label={`Exclude ${s.name}`}>
                    Exclude
                  </RowButton>
                )}
              </span>
            </li>
          );
        })}
      </ol>
      {!showAll && result.tracks.length > PAGE ? (
        <button type="button" onClick={() => setShowAll(true)} className="self-start text-[13px] font-bold text-accent-hover hover:text-accent-soft">
          Show all {result.tracks.length.toLocaleString('en-US')}
        </button>
      ) : null}
    </>
  );
}

function RowButton({ onClick, label, children }: { onClick: () => void; label: string; children: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className="h-8 rounded-pill px-3 text-[13px] font-bold text-accent-hover hover:bg-white/5 hover:text-accent-soft">
      {children}
    </button>
  );
}
