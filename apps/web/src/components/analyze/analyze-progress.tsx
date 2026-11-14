'use client';

import { useEffect, useState } from 'react';
import { Spinner } from '@/components/editor/bits';
import type { AnalysisState } from './use-analysis';

type Count = { done: number; total: number };
const sum = (...counts: Array<Count | undefined>) =>
  counts.reduce<Count>((acc, c) => ({ done: acc.done + (c?.done ?? 0), total: acc.total + (c?.total ?? 0) }), { done: 0, total: 0 });
const frac = (c: Count) => (c.total > 0 ? Math.min(1, c.done / c.total) : 0);

function elapsedLabel(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Four bouncing bars, like a music visualizer. */
function Equalizer() {
  return (
    <span aria-hidden="true" className="flex h-6 items-end gap-[3px]">
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className="as-eq-bar w-[4px] rounded-[2px] bg-accent" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </span>
  );
}

function Row({ label, detail, state }: { label: string; detail: string; state: 'waiting' | 'working' | 'done' }) {
  return (
    <li className="flex items-center gap-3">
      <span className="flex size-6 shrink-0 items-center justify-center">
        {state === 'done' ? (
          <span className="flex size-5 items-center justify-center rounded-pill bg-success/[0.18] text-success-text">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
        ) : state === 'working' ? (
          <Spinner className="text-accent-soft" />
        ) : (
          <span className="size-2 rounded-pill bg-surface-3" />
        )}
      </span>
      <span className={`flex-1 text-[14px] ${state === 'waiting' ? 'text-text-3' : 'text-text-1'}`}>{label}</span>
      <span className="text-[13px] text-text-2">{detail}</span>
    </li>
  );
}

/**
 * Live progress for an analysis: real counts per step, an elapsed clock, and a bar that keeps
 * moving (it never shows less than a slow, time-based estimate, so it can't look frozen).
 */
export interface ExtraStep {
  label: string;
  detail: string;
  state: 'waiting' | 'working' | 'done';
}

export function AnalyzeProgress({ name, state, doneLabel, extra }: { name: string; state: AnalysisState; doneLabel: string; extra?: ExtraStep | null }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (state.status !== 'running') return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [state.status]);

  const elapsed = state.startedAt ? now - state.startedAt : 0;
  const finished = state.status === 'done';
  const read = state.songs !== null;
  const songs = state.songs ?? 0;
  const pending = state.lastPending;
  const audio = sum(state.steps.audio);
  const roundGenres = sum(state.steps.tags, state.steps.albumTags, state.steps.artistTags);
  const years = sum(state.steps.years);

  // Steps finished in an earlier round stay finished.
  const audioDone = finished || pending?.audio === 0 || (audio.total > 0 && audio.done >= audio.total);
  // Genre lookups count across rounds: earlier rounds plus this one, out of everything known so far.
  const genresDone = state.genresDoneBefore + roundGenres.done;
  const genresTotal = state.round > 1 && state.genresLeft !== null ? state.genresDoneBefore + state.genresLeft : roundGenres.total;
  const genres = { done: Math.min(genresDone, genresTotal), total: genresTotal };
  const genresComplete = finished || (pending !== null && state.genresLeft === 0);
  const yearsKnown = pending ? Math.max(0, songs - (pending.years ?? 0)) : years.done;

  const real = (read ? 0.1 : 0) + 0.2 * (audioDone ? 1 : frac(audio)) + 0.6 * (genresComplete ? 1 : frac(genres)) + 0.1 * (pending ? 1 : frac(years));
  const estimate = 0.92 * (1 - Math.exp(-elapsed / 90_000));
  const computed = finished ? 100 : Math.min(99, Math.round(Math.max(real, estimate) * 100));

  // The bar only moves forward, even when a new round starts its counts from zero.
  // (React's "adjust state while rendering" pattern: remember the highest value shown for this run.)
  const [peak, setPeak] = useState({ run: state.startedAt, pct: 0 });
  const pct = peak.run === state.startedAt ? Math.max(peak.pct, computed) : computed;
  if (peak.run !== state.startedAt || pct !== peak.pct) setPeak({ run: state.startedAt, pct });

  const activity = finished
    ? doneLabel
    : !read
      ? 'Reading your songs from Spotify…'
      : state.round > 1
        ? `Finishing genre lookups (round ${state.round})…`
        : `Looking up tempo, key and genres for ${songs.toLocaleString('en-US')} songs…`;
  const of = (c: Count, noun: string) => `${c.done.toLocaleString('en-US')} of ${c.total.toLocaleString('en-US')} ${noun}`;

  return (
    <div className="tnum flex flex-col gap-5 rounded-panel bg-surface-2 p-5 sm:p-6">
      <div className="flex items-start gap-3.5">
        {finished ? null : <Equalizer />}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-[20px] font-extrabold tracking-[-0.02em] sm:text-[22px]">{finished ? `${name} is ready` : `Analyzing ${name}…`}</span>
          <span role="status" aria-live="polite" className="text-[14px] text-text-2">
            {activity}
          </span>
        </div>
        <span className="flex flex-col items-end">
          <span className="text-[28px] font-extrabold leading-none tracking-[-0.03em]">{pct}%</span>
          <span className="text-[12px] text-text-3">{elapsedLabel(elapsed)}</span>
        </span>
      </div>

      <div role="progressbar" aria-label={`Analyzing ${name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className="relative h-2.5 overflow-hidden rounded-pill bg-surface-3">
        <span className="block h-full rounded-pill bg-gradient-to-r from-accent to-accent-soft transition-[width] duration-500 ease-out" style={{ width: `${pct}%` }} />
        {finished ? null : <span className="as-shimmer absolute inset-0" />}
      </div>

      <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
        <Row label="Read your songs from Spotify" detail={read ? `${songs.toLocaleString('en-US')} songs` : ''} state={read || finished ? 'done' : 'working'} />
        <Row
          label="Tempo, key and energy"
          detail={audioDone && read ? `${songs.toLocaleString('en-US')} songs` : audio.total > 0 ? of(audio, 'songs') : read ? 'checking…' : ''}
          state={audioDone ? 'done' : read ? 'working' : 'waiting'}
        />
        <Row
          label="Genres from song, album and artist tags"
          detail={genresComplete && genres.total === 0 ? 'already looked up' : genres.total > 0 ? of(genres, 'lookups') : read ? 'checking…' : ''}
          state={genresComplete ? 'done' : read ? 'working' : 'waiting'}
        />
        <Row
          label="Original release years"
          detail={
            finished && pending && (pending.years ?? 0) > 0
              ? `${yearsKnown.toLocaleString('en-US')} of ${songs.toLocaleString('en-US')} · the rest fill in each night`
              : pending
                ? `${yearsKnown.toLocaleString('en-US')} of ${songs.toLocaleString('en-US')} songs`
                : years.total > 0
                  ? of(years, 'songs')
                  : read
                    ? 'checking…'
                    : ''
          }
          state={finished ? 'done' : read ? 'working' : 'waiting'}
        />
        {extra ? <Row label={extra.label} detail={extra.detail} state={extra.state} /> : null}
      </ul>

      {finished ? null : <p className="m-0 text-[13px] text-text-3">Keep this page open. Big playlists can take a few minutes the first time.</p>}
    </div>
  );
}
