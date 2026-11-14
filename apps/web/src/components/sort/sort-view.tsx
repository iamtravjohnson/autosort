'use client';

import { camelotIndex, camelotToKeyName, sortTracks, transition, type OrderSpec, type TrackFacts } from '@autosort/core';
import { useDeferredValue, useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from 'react';
import { moveSongs, removeSongs, reorderPlaylist, saveAsNewPlaylist } from '@/app/app/sort/[playlistId]/actions';
import { ActionNotice, Art, Segmented, Spinner } from '@/components/editor/bits';
import { StickyBar } from '@/components/editor/sticky-bar';
import { XIcon } from '@/components/icons';
import { buttonClass, KeyChip, SpotifyLogo, TransitionChip } from '@/components/ui';
import { trackTime } from '@/lib/format';
import { shortDate, spotifyTrackUrl, type ActionResult } from '@/lib/rules-ui';
import { EnergyChart, peakTrack } from './energy-chart';
import type { SortPlaylistInfo, SortRow } from './types';

type Mode = 'harmonic' | 'bpm' | 'energy' | 'key' | 'added' | 'release';
type Arc = 'mountain' | 'steady' | 'build';
type Dir = 'asc' | 'desc';

const MODES: Array<{ value: Mode; label: string }> = [
  { value: 'harmonic', label: 'Harmonic mix' },
  { value: 'bpm', label: 'BPM' },
  { value: 'energy', label: 'Energy arc' },
  { value: 'key', label: 'Key' },
  { value: 'added', label: 'Date added' },
  { value: 'release', label: 'Release date' },
];

const PAGE = 100;

const MOOD = {
  Happy: '#D97706',
  Intense: '#DB2777',
  Chill: '#0284C7',
  Sad: '#7C3AED',
} as const;

function moodOf(energy: number | null, valence: number | null): keyof typeof MOOD | null {
  if (energy === null || valence === null) return null;
  if (energy >= 0.5) return valence >= 0.5 ? 'Happy' : 'Intense';
  return valence >= 0.5 ? 'Chill' : 'Sad';
}

function toFacts(r: SortRow): TrackFacts {
  return {
    id: r.key,
    uri: r.uri,
    name: r.name,
    artists: [{ id: null, name: r.artist }],
    album: { name: r.album, releaseDate: r.releaseDate, releaseDatePrecision: null, imageUrl: r.imageUrl },
    durationMs: r.durationMs,
    explicit: false,
    isrc: null,
    addedAt: r.addedAt,
    genres: [],
    tags: [],
    genreBuckets: [],
    genreNear: [],
    genreScores: {},
    genreConfidence: 'low',
    genreReasons: [],
    year: null,
    yearSource: null,
    decade: null,
    audio:
      r.tempo !== null
        ? { tempo: r.tempo, key: -1, mode: 1, energy: r.energy ?? 0, valence: r.valence ?? 0, danceability: 0, acousticness: 0, instrumentalness: 0, speechiness: 0, liveness: 0, loudness: 0 }
        : null,
    camelot: r.camelot,
    moods: [],
    themes: [],
  };
}

/** "Steady": songs closest to the playlist's usual energy first, so the level stays even for as long as possible. */
function steady(facts: TrackFacts[], pinned: Record<string, number>): TrackFacts[] {
  const levels = facts
    .map((t) => (t.audio ? t.audio.energy : null))
    .filter((e): e is number => e !== null)
    .sort((a, b) => a - b);
  const median = levels.length ? levels[Math.floor(levels.length / 2)]! : 0.5;
  const proxy = facts.map((t) => (t.audio ? { ...t, audio: { ...t.audio, energy: Math.abs(t.audio.energy - median) } } : t));
  const real = new Map(facts.map((t) => [t.id, t]));
  return sortTracks(proxy, { by: 'energy', direction: 'asc' }, { pinned }).map((t) => real.get(t.id)!);
}

export function SortView({ playlist, rows }: { playlist: SortPlaylistInfo; rows: SortRow[] }) {
  const facts = useMemo(() => rows.map(toFacts), [rows]);
  const byKey = useMemo(() => new Map(rows.map((r) => [r.key, r])), [rows]);
  const origIndex = useMemo(() => new Map(rows.map((r, i) => [r.key, i])), [rows]);

  const [mode, setMode] = useState<Mode>('harmonic');
  const [startKey, setStartKey] = useState('');
  const [tolerance, setTolerance] = useState(6);
  const [bpmDir, setBpmDir] = useState<Dir>('asc');
  const [arc, setArc] = useState<Arc>('mountain');
  const [addedDir, setAddedDir] = useState<Dir>('desc');
  const [releaseDir, setReleaseDir] = useState<Dir>('asc');
  const [view, setView] = useState<'sorted' | 'original'>('sorted');
  const [pinnedRaw, setPinned] = useState<Record<string, number>>({});
  const [selectedRaw, setSelected] = useState<Set<string>>(() => new Set());
  const [showAll, setShowAll] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startAction] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);
  const confirmDialog = useRef<HTMLDialogElement>(null);
  const menuWrap = useRef<HTMLDivElement>(null);

  // Rows can change after a save or edit; forget pins and picks for songs that are gone.
  const pinned = useMemo(() => Object.fromEntries(Object.entries(pinnedRaw).filter(([k, v]) => byKey.has(k) && v < rows.length)), [pinnedRaw, byKey, rows.length]);
  const selected = useMemo(() => new Set([...selectedRaw].filter((k) => byKey.has(k))), [selectedRaw, byKey]);

  const keysInPlaylist = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of rows) if (r.camelot) counts.set(r.camelot, (counts.get(r.camelot) ?? 0) + 1);
    return [...counts].sort((a, b) => (camelotIndex(a[0]) ?? 0) - (camelotIndex(b[0]) ?? 0));
  }, [rows]);

  const spec: OrderSpec | null = useMemo(() => {
    switch (mode) {
      case 'harmonic':
        return { by: 'harmonic', bpmTolerance: tolerance, ...(startKey ? { startKey } : {}) };
      case 'bpm':
        return { by: 'bpm', direction: bpmDir };
      case 'energy':
        return arc === 'steady' ? null : { by: 'energyArc', shape: arc };
      case 'key':
        return { by: 'camelot', direction: 'asc' };
      case 'added':
        return { by: 'addedAt', direction: addedDir };
      case 'release':
        return { by: 'releaseDate', direction: releaseDir };
    }
  }, [mode, tolerance, startKey, bpmDir, arc, addedDir, releaseDir]);

  // Big playlists take a moment to re-sort; keep the controls responsive while it catches up.
  const sortSpec = useDeferredValue(spec);
  const sortPins = useDeferredValue(pinned);
  const sorted = useMemo(() => (sortSpec ? sortTracks(facts, sortSpec, { pinned: sortPins }) : steady(facts, sortPins)), [facts, sortSpec, sortPins]);
  const catchingUp = sortSpec !== spec || sortPins !== pinned;
  const shown = view === 'sorted' ? sorted : facts;
  const moved = useMemo(() => sorted.reduce((n, t, i) => n + (t.id !== facts[i]?.id ? 1 : 0), 0), [sorted, facts]);
  const energies = useMemo(() => shown.map((t) => (t.audio ? t.audio.energy : null)), [shown]);
  const peak = peakTrack(energies);

  const label = modeLabel(mode, { bpmDir, arc, addedDir, releaseDir });
  const locked = playlist.hidden > 0;
  const visible = showAll ? shown : shown.slice(0, PAGE);
  const pickedItems = () =>
    [...selected]
      .map((k) => ({ index: origIndex.get(k)!, uri: byKey.get(k)!.uri }))
      .filter((i) => i.index !== undefined)
      .sort((a, b) => a.index - b.index);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!menuWrap.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const run = (fn: () => Promise<ActionResult>, after?: () => void) => {
    setResult(null);
    setMenuOpen(false);
    startAction(async () => {
      const res = await fn();
      setResult(res);
      if (res.ok) after?.();
    });
  };

  const reorder = () => run(() => reorderPlaylist({ playlistId: playlist.id, name: playlist.name, label, uris: sorted.map((t) => t.uri) }), () => setPinned({}));
  const saveNew = () => run(() => saveAsNewPlaylist({ playlistId: playlist.id, name: playlist.name, label, uris: sorted.map((t) => t.uri) }));
  const moveSel = (direction: 'up' | 'down' | 'top') => run(() => moveSongs({ playlistId: playlist.id, direction, items: pickedItems() }));
  const removeSel = () => {
    confirmDialog.current?.close();
    run(() => removeSongs({ playlistId: playlist.id, name: playlist.name, items: pickedItems() }), () => setSelected(new Set()));
  };

  const toggleSelect = (key: string, on: boolean) =>
    setSelected((prev) => {
      const next = new Set([...prev].filter((k) => byKey.has(k)));
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });
  const toggleLock = (key: string, index: number) =>
    setPinned((prev) => {
      const next = { ...prev };
      if (next[key] !== undefined) delete next[key];
      else next[key] = index;
      return next;
    });

  const allShownSelected = visible.length > 0 && visible.every((t) => selected.has(t.id));
  const coverage = rows.filter((r) => r.tempo !== null && r.camelot).length;

  return (
    <div className="flex flex-col gap-4">
      {/* ----- Controls ----- */}
      <div role="toolbar" aria-label="Sort options" className="flex flex-col gap-3 rounded-card bg-surface-2 p-3.5 lg:flex-row lg:flex-wrap lg:items-end">
        <div className="flex min-w-0 flex-col gap-1.5">
          <span id="mode-label" className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-3">
            Sort by
          </span>
          <div role="radiogroup" aria-labelledby="mode-label" className="-mx-3.5 flex gap-2 overflow-x-auto px-3.5 pb-0.5 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
            {MODES.map((m) => {
              const on = mode === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setMode(m.value)}
                  className={`h-9 shrink-0 rounded-pill px-3.5 text-[13px] font-bold transition-colors duration-200 lg:h-10 ${on ? 'bg-white text-bg' : 'bg-surface-3 text-text-1 hover:bg-[#303035]'}`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          {mode === 'harmonic' ? (
            <>
              <Field label="Start key">
                <span className="relative flex">
                  <select
                    value={startKey}
                    onChange={(e) => setStartKey(e.target.value)}
                    className="tnum h-10 min-w-[150px] appearance-none rounded-card border border-transparent bg-surface-3 pl-3 pr-8 text-[14px] font-bold text-text-1 focus:border-accent"
                  >
                    <option value="">Calmest song</option>
                    {keysInPlaylist.map(([k, n]) => (
                      <option key={k} value={k}>
                        {k} · {camelotToKeyName(k)} ({n})
                      </option>
                    ))}
                  </select>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B3B3B8" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </span>
              </Field>
              <Field label="BPM tolerance">
                <span className="relative flex">
                  <select
                    value={tolerance}
                    onChange={(e) => setTolerance(Number(e.target.value))}
                    className="tnum h-10 appearance-none rounded-card border border-transparent bg-surface-3 pl-3 pr-8 text-[14px] font-bold text-text-1 focus:border-accent"
                  >
                    {[3, 4, 6, 8, 10, 12, 16].map((n) => (
                      <option key={n} value={n}>
                        ± {n} BPM
                      </option>
                    ))}
                  </select>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B3B3B8" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </span>
              </Field>
            </>
          ) : null}
          {mode === 'bpm' ? (
            <Field label="Direction">
              <Segmented
                label="BPM direction"
                value={bpmDir}
                options={[
                  { value: 'asc', label: 'BPM ↑ slow to fast' },
                  { value: 'desc', label: 'BPM ↓ fast to slow' },
                ]}
                onChange={setBpmDir}
              />
            </Field>
          ) : null}
          {mode === 'energy' ? (
            <Field label="Energy arc">
              <Segmented
                label="Energy arc"
                value={arc}
                options={[
                  { value: 'mountain', label: 'Warm-up → Peak → Cool-down' },
                  { value: 'steady', label: 'Steady' },
                  { value: 'build', label: 'Build-up' },
                ]}
                onChange={setArc}
              />
            </Field>
          ) : null}
          {mode === 'added' ? (
            <Field label="Direction">
              <Segmented
                label="Date added direction"
                value={addedDir}
                options={[
                  { value: 'desc', label: 'Newest first' },
                  { value: 'asc', label: 'Oldest first' },
                ]}
                onChange={setAddedDir}
              />
            </Field>
          ) : null}
          {mode === 'release' ? (
            <Field label="Direction">
              <Segmented
                label="Release date direction"
                value={releaseDir}
                options={[
                  { value: 'asc', label: 'Oldest first' },
                  { value: 'desc', label: 'Newest first' },
                ]}
                onChange={setReleaseDir}
              />
            </Field>
          ) : null}
        </div>

        <div className="lg:ml-auto">
          <Field label="View">
            <Segmented
              label="Original or sorted order"
              value={view}
              options={[
                { value: 'original', label: 'Original' },
                { value: 'sorted', label: 'Sorted' },
              ]}
              onChange={setView}
            />
          </Field>
        </div>
      </div>

      {/* ----- Energy chart + data coverage ----- */}
      <div className="flex flex-wrap gap-4">
        <div className="flex min-w-0 flex-[2_1_420px] flex-col gap-1.5 rounded-card bg-surface-2 px-4 py-3.5">
          <div className="tnum flex justify-between gap-3 text-[13px]">
            <strong>Energy across the mix</strong>
            <span className="text-text-3">{peak !== null ? `Peak at track ${peak + 1}` : ''}</span>
          </div>
          <EnergyChart energies={energies} />
        </div>
        <div className="tnum flex min-w-0 flex-[1_1_280px] flex-col justify-center gap-2 rounded-card bg-surface-2 px-4 py-3.5">
          <span className="text-[13px] font-bold">
            BPM &amp; key found for {coverage.toLocaleString('en-US')} of {rows.length.toLocaleString('en-US')} tracks
          </span>
          <div role="meter" aria-valuemin={0} aria-valuemax={rows.length} aria-valuenow={coverage} aria-label="Songs with BPM and key" className="h-1.5 overflow-hidden rounded-pill bg-surface-3">
            <span className="block h-full rounded-pill bg-accent" style={{ width: `${rows.length ? Math.round((coverage / rows.length) * 100) : 0}%` }} />
          </div>
          <span className="text-[12px] text-text-3">
            Data: ReccoBeats{rows.length - coverage > 0 ? ` · ${(rows.length - coverage).toLocaleString('en-US')} without data go to the end` : ''}
          </span>
        </div>
      </div>

      {locked ? (
        <p role="note" className="m-0 rounded-card border border-warning/35 bg-warning/[0.08] px-4 py-3 text-[14px] leading-[1.6] text-[#FEF3C7]">
          This playlist has {playlist.hidden} item{playlist.hidden === 1 ? '' : 's'} AutoSort can&apos;t read (local files or podcast episodes). To keep {playlist.hidden === 1 ? 'it' : 'them'} safe,
          AutoSort won&apos;t change this playlist itself. You can still save the sorted songs as a new playlist.
        </p>
      ) : null}

      {/* ----- Selection actions ----- */}
      {selected.size > 0 ? (
        <div role="region" aria-label="Selected songs" className="tnum flex flex-wrap items-center gap-2 rounded-card bg-accent-tint px-3.5 py-2.5 text-[14px] text-accent-soft">
          <strong className="mr-1 text-text-1">{selected.size} selected</strong>
          <button type="button" disabled={pending || locked || view !== 'original'} onClick={() => moveSel('up')} className={smallBtn}>
            Move up
          </button>
          <button type="button" disabled={pending || locked || view !== 'original'} onClick={() => moveSel('down')} className={smallBtn}>
            Move down
          </button>
          <button type="button" disabled={pending || locked || view !== 'original'} onClick={() => moveSel('top')} className={smallBtn}>
            Move to top
          </button>
          <button type="button" disabled={pending || locked} onClick={() => confirmDialog.current?.showModal()} className={`${smallBtn} text-error-text`}>
            Remove from playlist
          </button>
          <button type="button" onClick={() => setSelected(new Set())} className={`${smallBtn} ml-auto`}>
            Clear
          </button>
          {view !== 'original' && !locked ? <span className="basis-full text-[12px] text-text-2">Moves change the order in Spotify right away. Switch the view to Original to use them.</span> : null}
        </div>
      ) : null}

      {/* ----- Track list ----- */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="m-0 text-[16px] font-bold">{view === 'sorted' ? `Sorted: ${label}` : 'Original order'}</h2>
        <SpotifyLogo width={72} />
      </div>

      {/* Phones */}
      <ol className={`tnum m-0 flex list-none flex-col gap-0.5 p-0 transition-opacity duration-200 md:hidden ${catchingUp ? 'opacity-70' : ''}`}>
        {visible.map((t, i) => {
          const r = byKey.get(t.id)!;
          const from = origIndex.get(t.id)!;
          const isMoved = view === 'sorted' && from !== i;
          const isLocked = pinned[t.id] !== undefined;
          const isSel = selected.has(t.id);
          return (
            <li key={t.id} className={`-mx-2 flex items-center gap-2.5 rounded-sm px-2 py-1.5 ${isSel ? 'bg-accent-tint' : isLocked ? 'bg-warning/[0.07]' : isMoved ? 'bg-info/[0.07]' : ''}`}>
              <input type="checkbox" checked={isSel} onChange={(e) => toggleSelect(t.id, e.target.checked)} aria-label={`Select ${r.name}`} className="m-0 size-5 shrink-0 accent-accent" />
              <Art url={r.imageUrl} size={44} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[15px] font-semibold">{r.name}</span>
                <span className="truncate text-[12px] text-text-2">
                  {r.artist}
                  {isLocked ? <span className="text-warning-text"> · locked</span> : isMoved ? <span className="text-info-text"> · from #{from + 1}</span> : null}
                </span>
              </span>
              <span className="w-8 text-right text-[13px] font-semibold">{r.tempo !== null ? Math.round(r.tempo) : '—'}</span>
              <span className="w-10 text-center">
                <KeyChip code={r.camelot} size="sm" />
              </span>
              <LockButton locked={isLocked} name={r.name} onClick={() => toggleLock(t.id, i)} />
            </li>
          );
        })}
      </ol>

      {/* Wider screens: the board's table */}
      <div className={`hidden overflow-x-auto rounded-card transition-opacity duration-200 md:block ${catchingUp ? 'opacity-70' : ''}`}>
        <table className="tnum w-full min-w-[1080px] border-collapse text-left text-[13px] text-text-2">
          <thead>
            <tr className="border-b border-line text-[11px] font-bold uppercase tracking-[0.06em] text-text-3">
              <th scope="col" className="w-8 py-2.5 pl-3">
                <input type="checkbox" checked={allShownSelected} onChange={(e) => setSelected(e.target.checked ? new Set(visible.map((t) => t.id)) : new Set())} aria-label="Select all songs shown" className="m-0 size-4 accent-accent" />
              </th>
              <th scope="col" className="w-12 py-2.5 pr-2.5 text-right font-bold">
                #
              </th>
              <th scope="col" className="py-2.5 pr-2.5 font-bold">
                Title
              </th>
              <th scope="col" className="w-[17%] py-2.5 pr-2.5 font-bold">
                Album
              </th>
              <th scope="col" className="w-[52px] py-2.5 pr-2.5 text-right font-bold">
                BPM
              </th>
              <th scope="col" className="w-[60px] py-2.5 pr-2.5 font-bold">
                Key
              </th>
              <th scope="col" className="w-[76px] py-2.5 pr-2.5 font-bold">
                Energy
              </th>
              <th scope="col" className="w-[84px] py-2.5 pr-2.5 font-bold">
                Mood
              </th>
              <th scope="col" className="w-[104px] py-2.5 pr-2.5 font-bold">
                Date added
              </th>
              <th scope="col" className="w-[52px] py-2.5 pr-2.5 text-right font-bold">
                Time
              </th>
              <th scope="col" className="w-[120px] py-2.5 pr-2.5 font-bold">
                Transition
              </th>
              <th scope="col" className="w-11 py-2.5 pr-2">
                <span className="sr-only">Lock in place</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((t, i) => {
              const r = byKey.get(t.id)!;
              const from = origIndex.get(t.id)!;
              const isMoved = view === 'sorted' && from !== i;
              const isLocked = pinned[t.id] !== undefined;
              const isSel = selected.has(t.id);
              const prev = i > 0 ? shown[i - 1] : null;
              const mood = moodOf(r.energy, r.valence);
              return (
                <tr key={t.id} className={isSel ? 'bg-accent-tint' : isLocked ? 'bg-warning/[0.07]' : isMoved ? 'bg-info/[0.07]' : 'hover:bg-surface-2'}>
                  <td className="rounded-l-sm py-1.5 pl-3">
                    <input type="checkbox" checked={isSel} onChange={(e) => toggleSelect(t.id, e.target.checked)} aria-label={`Select ${r.name}`} className="m-0 size-4 accent-accent" />
                  </td>
                  <td className="py-1.5 pr-2.5 text-right leading-[1.2]">
                    <span className="block text-[14px] text-text-1">{i + 1}</span>
                    {isLocked ? <span className="block text-[10.5px] font-bold text-warning-text">locked</span> : isMoved ? <span className="block text-[10.5px] font-bold text-info-text">from #{from + 1}</span> : null}
                  </td>
                  <td className="max-w-0 py-1.5 pr-2.5">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <Art url={r.imageUrl} size={40} />
                      <span className="flex min-w-0 flex-col">
                        <a href={spotifyTrackUrl(r.id)} target="_blank" rel="noopener noreferrer" className="truncate text-[14px] font-semibold text-text-1 no-underline hover:underline">
                          {r.name}
                        </a>
                        <span className="truncate">{r.artist}</span>
                      </span>
                    </span>
                  </td>
                  <td className="max-w-0 truncate py-1.5 pr-2.5">{r.album}</td>
                  <td className="py-1.5 pr-2.5 text-right text-text-1">{r.tempo !== null ? Math.round(r.tempo) : '—'}</td>
                  <td className="py-1.5 pr-2.5">
                    <KeyChip code={r.camelot} size="sm" />
                  </td>
                  <td className="py-1.5 pr-2.5">
                    {r.energy !== null ? (
                      <span className="relative block h-1 rounded-pill bg-surface-3" role="img" aria-label={`Energy ${Math.round(r.energy * 100)}%`}>
                        <span className="absolute inset-y-0 left-0 rounded-pill bg-text-2" style={{ width: `${Math.round(r.energy * 100)}%` }} />
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-1.5 pr-2.5">
                    {mood ? (
                      <span className="flex items-center gap-1.5">
                        <span className="size-2 shrink-0 rounded-pill" style={{ background: MOOD[mood] }} aria-hidden="true" />
                        {mood}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="whitespace-nowrap py-1.5 pr-2.5">{shortDate(r.addedAt)}</td>
                  <td className="py-1.5 pr-2.5 text-right">{trackTime(r.durationMs)}</td>
                  <td className="py-1.5 pr-2.5">
                    {!prev ? (
                      <span className="rounded-pill bg-surface-3 px-2.5 py-1 text-[12px] font-bold text-text-2">Start</span>
                    ) : prev.camelot && r.camelot ? (
                      <TransitionChip kind={transition(prev.camelot, r.camelot)} />
                    ) : (
                      <span className="text-text-3">—</span>
                    )}
                  </td>
                  <td className="rounded-r-sm py-1.5 pr-2">
                    <LockButton locked={isLocked} name={r.name} onClick={() => toggleLock(t.id, i)} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="tnum flex flex-wrap items-center gap-3 text-[13px] text-text-3">
        <span>
          Showing {visible.length.toLocaleString('en-US')} of {rows.length.toLocaleString('en-US')}. Moved rows are highlighted; locked songs stay where you put them.
        </span>
        {shown.length > PAGE ? (
          <button type="button" onClick={() => setShowAll((v) => !v)} className="font-bold text-accent-hover hover:text-accent-soft">
            {showAll ? `Show the first ${PAGE}` : `Show all ${shown.length.toLocaleString('en-US')}`}
          </button>
        ) : null}
      </div>

      {/* ----- Save bar ----- */}
      <StickyBar label="Save sorted order">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="flex items-center gap-2 text-[13px]">
            {pending ? (
              <>
                <Spinner className="text-text-2" />
                <span className="text-text-2">Saving to Spotify… big playlists go in batches of 100.</span>
              </>
            ) : moved > 0 ? (
              <>
                <span className="size-2 rounded-pill bg-warning" aria-hidden="true" />
                <span className="text-warning-text">
                  {moved.toLocaleString('en-US')} of {rows.length.toLocaleString('en-US')} tracks moved · not saved
                </span>
              </>
            ) : (
              <span className="text-text-3">Nothing moved yet</span>
            )}
          </span>
          <ActionNotice result={result} />
        </div>

        <div ref={menuWrap} className="relative">
          {menuOpen ? (
            <div role="menu" aria-label="Save options" className="absolute bottom-full right-0 z-30 mb-2 flex w-[min(88vw,300px)] flex-col rounded-card bg-surface-3 p-1.5 shadow-e3">
              <button
                type="button"
                role="menuitem"
                disabled={locked || moved === 0}
                onClick={reorder}
                className="flex flex-col items-start gap-0.5 rounded-sm px-3 py-2.5 text-left text-text-1 enabled:hover:bg-[#3A3A40] disabled:cursor-not-allowed disabled:opacity-55"
              >
                <span className="text-[14px] font-bold">Reorder this playlist</span>
                <span className="text-[12px] text-text-2">{locked ? "Not available: it has items AutoSort can't read." : 'Same playlist, new order. Dates added reset. Undo for 30 days.'}</span>
              </button>
              <button type="button" role="menuitem" onClick={saveNew} className="flex flex-col items-start gap-0.5 rounded-sm px-3 py-2.5 text-left text-text-1 hover:bg-[#3A3A40]">
                <span className="text-[14px] font-bold">Save as new playlist</span>
                <span className="text-[12px] text-text-2">
                  “{playlist.name} · {label}” in your library.
                </span>
              </button>
            </div>
          ) : null}
          <div className={`flex h-11 overflow-hidden rounded-pill ${pending ? 'bg-surface-3' : 'bg-accent'}`}>
            <button
              type="button"
              disabled={pending || (!locked && moved === 0)}
              onClick={() => (locked ? setMenuOpen(true) : reorder())}
              className="flex flex-1 items-center justify-center gap-2 pl-[22px] pr-[18px] text-[14px] font-bold text-bg enabled:hover:bg-white/10 disabled:cursor-not-allowed disabled:text-bg/60 sm:flex-none"
            >
              {pending ? <Spinner className="text-text-2" /> : null}
              <span className={pending ? 'text-text-2' : ''}>Save to Spotify</span>
            </button>
            <button
              type="button"
              aria-label="More save options"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              disabled={pending}
              onClick={() => setMenuOpen((v) => !v)}
              className="flex w-[42px] items-center justify-center border-l border-bg/25 bg-bg/10 text-bg disabled:cursor-not-allowed"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <path d="M6 15l6-6 6 6" />
              </svg>
            </button>
          </div>
        </div>
      </StickyBar>

      <dialog ref={confirmDialog} aria-labelledby="remove-title" className="m-auto w-[min(92vw,440px)] rounded-panel bg-surface-2 p-0 text-text-1 shadow-e3 backdrop:bg-black/60">
        <div className="flex flex-col gap-4 p-6">
          <div className="flex items-start justify-between gap-3">
            <h2 id="remove-title" className="m-0 text-[20px] font-bold">
              Remove {selected.size} song{selected.size === 1 ? '' : 's'} from {playlist.name}?
            </h2>
            <button type="button" aria-label="Close" onClick={() => confirmDialog.current?.close()} className="flex size-8 shrink-0 items-center justify-center rounded-pill text-text-2 hover:bg-white/10 hover:text-text-1">
              <XIcon size={16} />
            </button>
          </div>
          <p className="m-0 text-[15px] leading-[1.6] text-text-2">
            They&apos;ll come out of this playlist in Spotify (every copy, if a song is in it twice). Your other playlists aren&apos;t touched. You can undo this in Activity for 30 days.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            <button type="button" onClick={removeSel} className={buttonClass('primary', 'sm', 'h-11')}>
              Remove
            </button>
            <button type="button" onClick={() => confirmDialog.current?.close()} className={buttonClass('ghost', 'sm', 'h-11')}>
              Cancel
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}

const smallBtn = 'h-8 rounded-pill px-3 text-[13px] font-bold text-accent-soft hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-3">{label}</span>
      {children}
    </div>
  );
}

function LockButton({ locked, name, onClick }: { locked: boolean; name: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={locked}
      aria-label={`${locked ? 'Unlock' : 'Lock'} ${name} in place`}
      onClick={onClick}
      className={`flex size-8 shrink-0 items-center justify-center rounded-pill hover:bg-white/10 ${locked ? 'text-warning' : 'text-disabled hover:text-text-2'}`}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d={locked ? 'M8 11V7a4 4 0 0 1 8 0v4' : 'M8 11V7a4 4 0 0 1 7.5-2'} />
      </svg>
    </button>
  );
}

function modeLabel(mode: Mode, o: { bpmDir: Dir; arc: Arc; addedDir: Dir; releaseDir: Dir }): string {
  switch (mode) {
    case 'harmonic':
      return 'Harmonic mix';
    case 'bpm':
      return o.bpmDir === 'asc' ? 'BPM, slow to fast' : 'BPM, fast to slow';
    case 'energy':
      return o.arc === 'mountain' ? 'Energy arc' : o.arc === 'steady' ? 'Steady energy' : 'Build-up';
    case 'key':
      return 'Key';
    case 'added':
      return o.addedDir === 'desc' ? 'Newest added' : 'Oldest added';
    case 'release':
      return o.releaseDir === 'asc' ? 'Release date' : 'Newest releases';
  }
}

