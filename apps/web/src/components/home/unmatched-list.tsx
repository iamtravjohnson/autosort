'use client';

import Image from 'next/image';
import { useActionState, useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
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
  /** CSS background: the playlist's real cover when known, else its gradient. */
  cover: string;
  songs: number | null;
  /** "Genres", "By decade", "Moods", "Themes" or "Other", for grouping the menu. */
  group: string;
}

const GROUP_ORDER = ['Genres', 'By decade', 'Moods', 'Themes', 'Other'];

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
  const [query, setQuery] = useState('');
  const menuId = useId();
  const wrap = useRef<HTMLFormElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const searchable = targets.length > 6;

  const q = query.trim().toLowerCase();
  const shown = q ? targets.filter((t) => t.name.toLowerCase().includes(q)) : targets;
  const groups = GROUP_ORDER.map((g) => ({ name: g, items: shown.filter((t) => t.group === g).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })) })).filter(
    (g) => g.items.length,
  );

  // Arrow keys move between options; the search box hands off to the first one.
  const moveFocus = (e: ReactKeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const options = [...(list.current?.querySelectorAll<HTMLButtonElement>('[data-option]') ?? [])];
    if (!options.length) return;
    e.preventDefault();
    const at = options.indexOf(document.activeElement as HTMLButtonElement);
    const next = e.key === 'ArrowDown' ? (at + 1) % options.length : at <= 0 ? options.length - 1 : at - 1;
    options[next]?.focus();
  };

  useEffect(() => {
    if (!open) return;
    if (searchable) search.current?.focus();
    else list.current?.querySelector<HTMLButtonElement>('[data-option]')?.focus();
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
        onClick={() => {
          setQuery('');
          setOpen((o) => !o);
        }}
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
            onKeyDown={moveFocus}
            className={`fixed inset-x-0 bottom-0 z-50 flex max-h-[75dvh] flex-col rounded-t-panel border border-white/10 bg-surface-3 pb-[max(env(safe-area-inset-bottom),12px)] shadow-[0_-24px_64px_rgba(0,0,0,0.65)] sm:absolute sm:inset-x-auto sm:right-0 sm:max-h-[440px] sm:w-[320px] sm:rounded-card sm:pb-0 sm:shadow-e3 ${up ? 'sm:bottom-full sm:mb-2' : 'sm:bottom-auto sm:top-full sm:mt-2'}`}
          >
            <div className="flex flex-col gap-2.5 border-b border-line px-3.5 pb-3 pt-3.5">
              <span className="text-[14px] font-bold text-text-1">
                {trackIds.length > 1 ? `Add ${trackIds.length.toLocaleString('en-US')} songs to…` : 'Add to a smart playlist'}
              </span>
              {searchable ? (
                <input
                  ref={search}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Find a playlist"
                  aria-label="Find a playlist"
                  className="h-9 rounded-pill border border-line bg-surface-1 px-3.5 text-[14px] text-text-1 placeholder:text-text-3 focus:border-accent focus:outline-none"
                />
              ) : null}
            </div>
            <div ref={list} role="listbox" aria-label="Smart playlists" className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain p-1.5">
              {targets.length === 0 ? (
                <p className="m-0 px-2.5 py-3 text-[13px] text-text-2">No smart playlists read from {sourceName} yet.</p>
              ) : groups.length === 0 ? (
                <p className="m-0 px-2.5 py-3 text-[13px] text-text-2">No playlist matches “{query}”.</p>
              ) : (
                groups.map((g) => (
                  <div key={g.name} role="group" aria-label={g.name} className="flex flex-col pb-1">
                    <span className="px-2.5 pb-1 pt-2 text-[11px] font-bold uppercase tracking-[0.08em] text-text-3">{g.name}</span>
                    {g.items.map((t) => (
                      <button
                        key={t.id}
                        type="submit"
                        name="playlistId"
                        value={t.id}
                        data-option
                        role="option"
                        aria-selected={false}
                        className="flex min-h-12 items-center gap-3 rounded-sm px-2.5 py-1.5 text-left outline-none hover:bg-white/[0.07] focus-visible:bg-white/[0.09] focus-visible:ring-2 focus-visible:ring-accent/60"
                      >
                        <span className="size-9 shrink-0 rounded-[6px] shadow-[0_2px_6px_rgba(0,0,0,0.35)]" style={{ background: t.cover }} aria-hidden="true" />
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-[14px] font-semibold text-text-1">{t.name}</span>
                          {t.songs !== null ? <span className="tnum text-[12px] text-text-3">{t.songs.toLocaleString('en-US')} songs</span> : null}
                        </span>
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
            <span className="border-t border-line px-3.5 py-2.5 text-[12px] text-text-3">
              {trackIds.length === 1 ? 'Pins it into the playlist, even if the rules don’t match.' : 'Pins them into the playlist, even if the rules don’t match.'}
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
