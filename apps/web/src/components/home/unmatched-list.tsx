'use client';

import Image from 'next/image';
import { useActionState, useEffect, useId, useRef, useState } from 'react';
import { addToSmartPlaylist, createFromSuggestion } from '@/app/app/sources/[id]/unmatched/actions';
import { buttonClass } from '@/components/ui';
import type { ActionState } from '@/lib/stats';
import { ActionMessage } from './action-message';
import { ChevronDownGlyph, ExternalGlyph, MusicGlyph } from './glyphs';

export interface UnmatchedRow {
  id: string;
  title: string;
  artists: string;
  tags: string | null;
  year: number | null;
  mood: string;
  imageUrl: string | null;
}

export interface MenuTarget {
  id: string;
  name: string;
  cover: string;
}

export interface SuggestionView {
  key: string;
  name: string;
  count: number;
  chips: string[];
  cover: string;
}

const ART = ['#4A3B2A', '#2F3B4A', '#3A2F4A', '#4A4530', '#2F4A40', '#4A302F'];

/** "Add to…" disclosure: smart playlists to pin the songs into (a bottom sheet on phones). */
function AddToMenu({
  action,
  sourceId,
  label,
  trackIds,
  targets,
  sourceName,
  disabled,
  variant = 'row',
  up = false,
}: {
  action: (form: FormData) => void;
  sourceId: string;
  label: string;
  trackIds: string[];
  targets: MenuTarget[];
  sourceName: string;
  disabled?: boolean;
  variant?: 'row' | 'bulk';
  /** Open upward (rows near the bottom of the list). */
  up?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const wrap = useRef<HTMLFormElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        button.current?.focus();
      }
    };
    const onClick = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  return (
    // Close on submit (not on click): React has already read the form data by then.
    <form ref={wrap} action={action} onSubmit={() => setOpen(false)} className="relative shrink-0">
      <input type="hidden" name="sourceId" value={sourceId} />
      {trackIds.map((id) => (
        <input key={id} type="hidden" name="trackId" value={id} />
      ))}
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={
          variant === 'bulk'
            ? 'inline-flex h-10 items-center gap-1.5 rounded-pill bg-white px-4 text-[14px] font-bold text-bg hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-surface-3 disabled:text-text-3'
            : 'inline-flex h-[34px] items-center gap-1.5 rounded-pill border border-white/24 px-3 text-[13px] font-bold text-text-1 hover:border-white/50 disabled:cursor-wait disabled:opacity-60'
        }
      >
        {label}
        <ChevronDownGlyph size={12} strokeWidth={2.5} />
      </button>
      {open ? (
        <>
          <div className="fixed inset-0 z-40 bg-black/55 sm:hidden" aria-hidden="true" onClick={() => setOpen(false)} />
          <div
            id={menuId}
            className={`fixed inset-x-0 bottom-0 z-50 flex max-h-[70dvh] flex-col overflow-y-auto rounded-t-panel bg-surface-3 p-3 pb-[max(env(safe-area-inset-bottom),16px)] shadow-[0_-24px_64px_rgba(0,0,0,0.65)] sm:absolute sm:inset-x-auto sm:right-0 sm:max-h-[320px] ${up ? 'sm:bottom-full sm:mb-1.5' : 'sm:bottom-auto sm:top-full sm:mt-1.5'} sm:w-60 sm:rounded-card sm:p-1.5 sm:pb-1.5 sm:shadow-e3`}
          >
            <p className="m-0 px-2.5 pb-2 pt-1 text-[15px] font-bold sm:hidden">{label.replace('…', '')}</p>
            {targets.length ? (
              targets.map((t) => (
                <button
                  key={t.id}
                  type="submit"
                  name="playlistId"
                  value={t.id}
                  className="flex min-h-11 items-center gap-2.5 rounded-sm px-2.5 py-2 text-left text-[14px] font-semibold text-text-1 hover:bg-white/[0.06] sm:min-h-0"
                >
                  <span className="size-6 shrink-0 rounded-art" style={{ background: t.cover }} aria-hidden="true" />
                  {t.name}
                </button>
              ))
            ) : (
              <p className="m-0 px-2.5 py-2 text-[13px] text-text-2">No smart playlists read from {sourceName} yet.</p>
            )}
            <span className="mt-1 border-t border-line px-2.5 pb-1 pt-2 text-[12px] text-text-3">
              {trackIds.length === 1 ? 'Adds it as a manual pin.' : 'Adds them as manual pins.'}
            </span>
          </div>
        </>
      ) : null}
    </form>
  );
}

export function UnmatchedList({ sourceId, sourceName, rows, targets }: { sourceId: string; sourceName: string; rows: UnmatchedRow[]; targets: MenuTarget[] }) {
  const [state, formAction, pending] = useActionState<ActionState | null, FormData>(addToSmartPlaylist, null);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const chosen = rows.filter((r) => selected.has(r.id)).map((r) => r.id);
  const allOn = rows.length > 0 && chosen.length === rows.length;

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-[14px] text-text-2">
          <label className="flex items-center gap-2.5">
            <input
              type="checkbox"
              checked={allOn}
              onChange={() => setSelected(allOn ? new Set() : new Set(rows.map((r) => r.id)))}
              className="size-[18px] accent-accent"
            />
            <span className="tnum">
              <strong className="text-text-1">{chosen.length ? `${chosen.length.toLocaleString('en-US')} selected` : 'Select all'}</strong>
            </span>
          </label>
          {chosen.length ? (
            <button type="button" onClick={() => setSelected(new Set())} className="text-[13px] font-bold text-accent-hover hover:text-accent-soft">
              Clear
            </button>
          ) : null}
        </div>
        <AddToMenu
          action={formAction}
          sourceId={sourceId}
          variant="bulk"
          label={chosen.length ? `Add ${chosen.length.toLocaleString('en-US')} to…` : 'Add to…'}
          trackIds={chosen}
          targets={targets}
          sourceName={sourceName}
          disabled={!chosen.length || pending}
        />
      </div>
      <div aria-live="polite" className="empty:hidden">
        {pending ? <p className="m-0 text-[14px] text-text-2">Adding and syncing with Spotify… this can take a minute.</p> : <ActionMessage state={state} />}
      </div>

      <div className="tnum hidden grid-cols-[28px_minmax(0,2fr)_minmax(0,1fr)_56px_90px_120px_32px] gap-3 border-b border-line px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.06em] text-text-3 lg:grid">
        <span />
        <span>Title</span>
        <span>Genre tags</span>
        <span>Year</span>
        <span>Mood</span>
        <span className="sr-only">Add to</span>
        <span className="sr-only">Open</span>
      </div>
      <ul className="tnum m-0 flex list-none flex-col gap-2 p-0 lg:gap-0.5">
        {rows.map((r, i) => {
          const on = selected.has(r.id);
          const tags = r.tags ?? 'no genre data';
          return (
            <li
              key={r.id}
              className={`flex flex-col gap-2.5 rounded-card p-3 text-[13px] text-text-2 lg:grid lg:grid-cols-[28px_minmax(0,2fr)_minmax(0,1fr)_56px_90px_120px_32px] lg:items-center lg:gap-3 lg:rounded-sm lg:px-3 lg:py-1.5 ${on ? 'bg-accent-tint' : 'bg-surface-2 lg:bg-transparent lg:hover:bg-surface-2'}`}
            >
              <div className="flex items-center gap-3 lg:contents">
                <input type="checkbox" checked={on} onChange={() => toggle(r.id)} aria-label={`Select ${r.title}`} className="size-5 shrink-0 accent-accent lg:size-[18px]" />
                <span className="flex min-w-0 flex-1 items-center gap-3 lg:gap-2.5">
                  <span className="size-11 shrink-0 overflow-hidden rounded-art lg:size-10" style={{ background: ART[i % ART.length] }} aria-hidden="true">
                    {r.imageUrl ? <Image src={r.imageUrl} alt="" width={44} height={44} unoptimized className="size-full object-cover" /> : null}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-[15px] font-semibold text-text-1 lg:text-[14px]">{r.title}</span>
                    <span className="truncate text-[12px] lg:text-[13px]">
                      {r.artists}
                      <span className="lg:hidden">{r.year ? ` · ${r.year}` : ''}</span>
                    </span>
                  </span>
                </span>
                <a
                  href={`https://open.spotify.com/track/${r.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${r.title} in Spotify`}
                  className="flex size-9 shrink-0 items-center justify-center rounded-pill text-text-2 hover:text-text-1 lg:order-last lg:size-8"
                >
                  <ExternalGlyph size={15} />
                </a>
              </div>
              <div className="flex items-center justify-between gap-2 pl-8 lg:contents">
                <span className={`min-w-0 truncate text-[12px] lg:hidden ${r.tags ? '' : 'text-warning-text'}`}>
                  {tags} · {r.mood}
                </span>
                <span className={`hidden truncate lg:block ${r.tags ? '' : 'text-warning-text'}`}>{tags}</span>
                <span className="hidden lg:block">{r.year ?? '—'}</span>
                <span className="hidden lg:block">{r.mood}</span>
                <AddToMenu action={formAction} sourceId={sourceId} up={rows.length > 5 && i >= rows.length - 3} label="Add to…" trackIds={[r.id]} targets={targets} sourceName={sourceName} disabled={pending} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Smart suggestion cards on the unmatched page: one tap creates the playlist in Spotify. */
export function UnmatchedSuggestions({ sourceId, suggestions }: { sourceId: string; suggestions: SuggestionView[] }) {
  const [state, formAction, pending] = useActionState<ActionState | null, FormData>(createFromSuggestion, null);
  const [lastKey, setLastKey] = useState<string | null>(null);
  const baseId = useId();
  const busy = suggestions.find((s) => s.key === lastKey);
  return (
    <div className="flex flex-col gap-3">
      {suggestions.map((s, i) => (
        <section key={s.key} aria-labelledby={`${baseId}-${i}`} className="flex flex-wrap items-center gap-4 rounded-card border border-accent/40 bg-surface-2 p-4 sm:gap-[18px] sm:p-[18px]">
          <span className="flex size-[72px] shrink-0 items-end rounded-sm p-2" style={{ background: s.cover }} aria-hidden="true">
            <MusicGlyph size={22} className="text-bg" />
          </span>
          <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-1">
            <span className="text-[12px] font-bold uppercase tracking-[0.06em] text-accent-soft">Smart suggestion</span>
            <h2 id={`${baseId}-${i}`} className="tnum m-0 text-[18px] font-bold sm:text-[20px]">
              {s.name} · {s.count.toLocaleString('en-US')} {s.count === 1 ? 'song' : 'songs'}
            </h2>
            <span className="text-[14px] text-text-2">
              {s.count.toLocaleString('en-US')} of these match {s.chips.join(' · ')}. Make them their own playlist?
            </span>
          </div>
          <form action={formAction} onSubmit={() => setLastKey(s.key)}>
            <input type="hidden" name="sourceId" value={sourceId} />
            <input type="hidden" name="key" value={s.key} />
            <button type="submit" disabled={pending} className={buttonClass('primary', 'sm', 'disabled:cursor-wait disabled:opacity-70')}>
              {pending && lastKey === s.key ? 'Creating in Spotify…' : 'Create in Spotify'}
            </button>
          </form>
        </section>
      ))}
      <div aria-live="polite" className="flex flex-col gap-2">
        {pending ? (
          <p className="m-0 text-[14px] text-text-2">Creating {busy?.name ?? 'your playlist'} and filling it… this can take a minute.</p>
        ) : (
          <ActionMessage state={state} />
        )}
        <p className="m-0 text-[12px] text-text-3">Spotify may list new playlists as public. You can make one private in the Spotify app.</p>
      </div>
    </div>
  );
}
