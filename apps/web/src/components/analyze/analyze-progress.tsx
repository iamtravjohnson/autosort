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
export function AnalyzeProgress({ name, state, doneLabel }: { name: string; state: AnalysisState; doneLabel: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (state.status !== 'running') return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [state.status]);

  const elapsed = state.startedAt ? now - state.startedAt : 0;
  const finished = state.status === 'done';
  const read = state.songs !== null;
  const audio = sum(state.steps.audio);
  const genres = sum(state.steps.tags, state.steps.albumTags, state.steps.artistTags);
  const years = sum(state.steps.years);
  const genreFrac = state.round > 1 ? 0.6 + 0.4 * frac(genres) : frac(genres);
  const real = (read ? 0.1 : 0) + 0.2 * frac(audio) + 0.55 * genreFrac + 0.15 * frac(years);
  const estimate = 0.92 * (1 - Math.exp(-elapsed / 90_000));
  const pct = finished ? 100 : Math.min(99, Math.round(Math.max(real, estimate) * 100));

  const stepState = (c: Count, started: boolean): 'waiting' | 'working' | 'done' =>
    finished || (c.total > 0 && c.done >= c.total) ? 'done' : started ? 'working' : 'waiting';
  const countLabel = (c: Count, noun: string) => (c.total > 0 ? `${c.done.toLocaleString('en-US')} of ${c.total.toLocaleString('en-US')} ${noun}` : read ? 'checking…' : '');

  const activity = finished
    ? doneLabel
    : !read
      ? 'Reading your songs from Spotify…'
      : state.round > 1
        ? `Finishing genre lookups (round ${state.round})…`
        : `Looking up tempo, key and genres for ${state.songs?.toLocaleString('en-US')} songs…`;

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
        <span className="block h-full rounded-pill bg-gradient-to-r from-accent to-accent-soft transition-[width] duration-700 ease-out" style={{ width: `${pct}%` }} />
        {finished ? null : <span className="as-shimmer absolute inset-0" />}
      </div>

      <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
        <Row label="Read your songs from Spotify" detail={read ? `${state.songs?.toLocaleString('en-US')} songs` : ''} state={read || finished ? 'done' : 'working'} />
        <Row label="Tempo, key and energy" detail={countLabel(audio, 'songs')} state={stepState(audio, read)} />
        <Row
          label={state.round > 1 ? `Genres (round ${state.round})` : 'Genres from song, album and artist tags'}
          detail={countLabel(genres, 'lookups')}
          state={stepState(genres, read)}
        />
        <Row label="Original release years" detail={finished ? 'the rest fill in each night' : countLabel(years, 'songs')} state={stepState(years, read)} />
      </ul>

      {finished ? null : <p className="m-0 text-[13px] text-text-3">Keep this page open. Big playlists can take a few minutes the first time.</p>}
    </div>
  );
}
