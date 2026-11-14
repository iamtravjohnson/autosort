'use client';

import { useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { AlertIcon, MusicIcon } from '@/components/icons';
import { CamelotChip } from './chip';
import { camelotMoves } from './moves';
import { EXAMPLE_TRACK_URL, parseTrackInput, type TrackLookup } from './track';

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string; field: boolean }
  | { status: 'done'; track: TrackLookup };

/** Paste a Spotify track link → tempo, key, Camelot, Open Key and energy from /api/track. */
export function BpmKeyFinder() {
  const [value, setValue] = useState('');
  const [state, setState] = useState<State>({ status: 'idle' });
  const pending = useRef<AbortController | null>(null);
  const inputId = useId();
  const errorId = useId();

  async function lookup(raw: string) {
    const parsed = parseTrackInput(raw);
    if (!parsed.ok) {
      setState({ status: 'error', message: parsed.message, field: true });
      return;
    }
    pending.current?.abort();
    const ctrl = new AbortController();
    pending.current = ctrl;
    setState({ status: 'loading' });
    try {
      const res = await fetch(`/api/track?id=${encodeURIComponent(parsed.id)}`, { signal: ctrl.signal });
      const data = (await res.json().catch(() => null)) as (TrackLookup & { error?: string }) | null;
      if (ctrl.signal.aborted) return;
      if (!res.ok || !data || data.error) {
        setState({ status: 'error', message: data?.error ?? 'Something went wrong. Try again in a minute.', field: res.status === 400 });
        return;
      }
      setState({ status: 'done', track: data });
    } catch {
      if (ctrl.signal.aborted) return;
      setState({ status: 'error', message: 'We couldn’t reach the server. Check your connection and try again.', field: false });
    }
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void lookup(value);
  }

  function tryExample() {
    setValue(EXAMPLE_TRACK_URL);
    void lookup(EXAMPLE_TRACK_URL);
  }

  const loading = state.status === 'loading';
  const fieldError = state.status === 'error' && state.field;

  return (
    <>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3 rounded-panel bg-surface-1 p-5">
        <div className="flex flex-wrap gap-2.5">
          <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-2">
            <label htmlFor={inputId} className="text-[13px] font-semibold text-text-2">
              Spotify track link
            </label>
            <input
              id={inputId}
              type="text"
              inputMode="url"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              placeholder={EXAMPLE_TRACK_URL}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              aria-invalid={fieldError || undefined}
              aria-describedby={fieldError ? errorId : undefined}
              className={`h-[52px] w-full min-w-0 rounded-pill border bg-surface-2 px-4 text-[15px] text-text-1 placeholder:text-text-3 focus:border-accent focus:outline-none ${
                fieldError ? 'border-error' : 'border-white/16'
              }`}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="h-[52px] self-end rounded-pill bg-accent px-7 text-[16px] font-bold text-bg transition-colors duration-[120ms] hover:bg-accent-hover disabled:cursor-wait disabled:opacity-70"
          >
            {loading ? 'Finding…' : 'Find BPM & key'}
          </button>
        </div>
        {fieldError ? (
          <p id={errorId} className="m-0 flex items-start gap-2 text-[14px] text-error-text">
            <AlertIcon size={16} className="mt-0.5 shrink-0" />
            {state.message}
          </p>
        ) : (
          <p className="m-0 text-[13px] text-text-3">
            No link handy?{' '}
            <button type="button" onClick={tryExample} className="cursor-pointer border-0 bg-transparent p-0 font-bold text-accent-hover hover:text-accent-soft">
              Try an example song
            </button>
          </p>
        )}
      </form>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {state.status === 'loading'
          ? 'Looking up the song…'
          : state.status === 'done'
            ? `${state.track.title ?? 'Song found'}: ${Math.round(state.track.tempo)} BPM, ${state.track.keyName ?? 'key unknown'}${
                state.track.camelot ? `, Camelot ${state.track.camelot}` : ''
              }.`
            : ''}
      </p>
      <div aria-busy={loading}>
        {state.status === 'loading' ? <ResultSkeleton /> : null}
        {state.status === 'error' && !state.field ? (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-panel bg-surface-2 p-6 text-[15px] leading-[1.6] text-error-text"
            style={{ boxShadow: 'inset 0 0 0 1px rgba(248,113,113,0.5)' }}
          >
            <AlertIcon size={18} className="mt-1 shrink-0" />
            {state.message}
          </div>
        ) : null}
        {state.status === 'done' ? <TrackResult track={state.track} /> : null}
      </div>
    </>
  );
}

function formatDuration(ms: number | null): string | null {
  if (ms === null) return null;
  const total = Math.round(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

function TrackResult({ track }: { track: TrackLookup }) {
  const mixes = track.camelot ? camelotMoves(track.camelot).filter((m) => m.primary && m.kind !== 'same') : [];
  const energy = track.energy === null ? null : Math.round(track.energy * 100);
  const meta = [track.artists.join(', '), formatDuration(track.durationMs)].filter(Boolean).join(' · ');

  return (
    <section aria-label="Result" className="tnum flex flex-col gap-[18px] rounded-panel bg-surface-2 p-6">
      <div className="flex flex-wrap items-center gap-4">
        <span aria-hidden="true" className="flex size-[72px] flex-none items-center justify-center rounded-art bg-[#3A2F4A] text-text-2">
          <MusicIcon size={28} />
        </span>
        <span className="flex min-w-0 flex-[1_1_200px] flex-col gap-0.5">
          <span className="text-[20px] font-extrabold">{track.title ?? 'Unknown title'}</span>
          {meta ? <span className="text-[14px] text-text-2">{meta}</span> : null}
        </span>
        <a
          href={track.spotifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-10 items-center gap-2 rounded-pill border border-white/24 px-3.5 text-[13px] font-bold text-text-1 no-underline hover:border-white/50 hover:text-text-1"
        >
          <span aria-hidden="true" className="box-border inline-block size-4 rounded-pill border-[1.5px] border-dashed border-text-2" />
          Open in Spotify
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
        <Stat label="Tempo">
          <span className="text-[32px] font-extrabold leading-[1.1]">
            {Math.round(track.tempo)} <span className="text-[16px] text-text-2">BPM</span>
          </span>
        </Stat>
        <Stat label="Key">
          <span className="text-[24px] font-extrabold leading-[1.2]">{track.keyName ?? '—'}</span>
        </Stat>
        <Stat label="Camelot · Open Key" gap="gap-1.5">
          <span className="flex items-center gap-2.5">
            <CamelotChip code={track.camelot} size="lg" />
            <span className="text-[16px] font-bold text-text-2">{track.openKey ?? '—'}</span>
          </span>
        </Stat>
        <Stat label="Energy" gap="gap-2">
          <span className="text-[24px] font-extrabold leading-[1.2]">{energy === null ? '—' : `${energy}%`}</span>
          {energy !== null ? (
            <span className="block h-1 rounded-pill bg-[#3A3A40]" aria-hidden="true">
              <span className="block h-full rounded-pill bg-text-2" style={{ width: `${energy}%` }} />
            </span>
          ) : null}
        </Stat>
      </div>

      <span className="text-[12px] text-text-3">
        Data:{' '}
        <a href="https://reccobeats.com" target="_blank" rel="noopener noreferrer" className="text-text-3 underline hover:text-text-1">
          ReccoBeats
        </a>
      </span>

      {mixes.length ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] text-text-2">Mixes well with:</span>
          {mixes.map((m) => (
            <CamelotChip key={m.code} code={m.code} size="sm" title={`${m.name}: ${m.label}`}>
              <span className="sr-only">{`, ${m.name}, ${m.label}`}</span>
            </CamelotChip>
          ))}
        </div>
      ) : (
        <span className="text-[13px] text-text-2">ReccoBeats doesn’t list a key for this song, so we can’t suggest key matches.</span>
      )}
    </section>
  );
}

function Stat({ label, gap = 'gap-1', children }: { label: string; gap?: string; children: ReactNode }) {
  return (
    <div className={`flex flex-col rounded-card bg-surface-3 p-4 ${gap}`}>
      <span className="text-[12px] text-text-3">{label}</span>
      {children}
    </div>
  );
}

function ResultSkeleton() {
  return (
    <div className="flex flex-col gap-[18px] rounded-panel bg-surface-2 p-6">
      <div className="flex items-center gap-4">
        <span className="size-[72px] flex-none animate-pulse rounded-art bg-surface-3" />
        <span className="flex flex-1 flex-col gap-2">
          <span className="h-4 w-1/2 animate-pulse rounded-[4px] bg-surface-3" />
          <span className="h-3 w-1/3 animate-pulse rounded-[4px] bg-surface-3" />
        </span>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="h-[88px] animate-pulse rounded-card bg-surface-3" />
        ))}
      </div>
    </div>
  );
}
