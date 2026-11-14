'use client';

import type { OrderSpec, Rule } from '@autosort/core';
import Link from 'next/link';
import { startTransition, useActionState, useEffect, useRef, useState, type ReactNode } from 'react';
import { createSuggestedPlaylists } from '@/app/app/sources/[id]/suggestions/actions';
import { ChevronDownIcon } from '@/components/icons';
import { buttonClass } from '@/components/ui';
import { ActionNotice, Art, Spinner } from './bits';
import { StickyBar } from './sticky-bar';

export interface SuggestionCard {
  key: string;
  name: string;
  /** Short rule summary for phones, e.g. "Genre + decade". */
  kindLabel: string;
  count: number;
  chips: string[];
  cover: string;
  rule: Rule;
  order: OrderSpec;
  samples: Array<{ id: string; name: string; artist: string; imageUrl: string | null }>;
}

export interface RecipeCard extends SuggestionCard {
  slug: string;
  description: string;
  /** Why it can't be added: already a smart playlist from this source. */
  exists: boolean;
}

export function SuggestionsPicker({
  intro,
  headerBackground,
  source,
  suggestions,
  recipes,
  unmatchedCount,
  footer,
}: {
  /** Breadcrumb, H1 and lead (server-rendered). */
  intro: ReactNode;
  headerBackground: string;
  source: { id: string; name: string };
  suggestions: SuggestionCard[];
  recipes: RecipeCard[];
  unmatchedCount: number;
  footer?: ReactNode;
}) {
  const [cards, setCards] = useState<SuggestionCard[]>(suggestions);
  const [off, setOff] = useState<Set<string>>(() => new Set());
  const [names, setNames] = useState<Record<string, string>>({});
  const [state, create, pending] = useActionState(createSuggestedPlaylists, null);

  const picked = cards.filter((c) => !off.has(c.key));
  const n = picked.length;
  const cta = n ? `Create ${n} playlist${n === 1 ? '' : 's'} in Spotify` : 'Pick at least one';
  const nameOf = (c: SuggestionCard) => names[c.key] ?? c.name;

  const toggle = (key: string, on: boolean) =>
    setOff((prev) => {
      const next = new Set(prev);
      if (on) next.delete(key);
      else next.add(key);
      return next;
    });

  const submit = () => {
    if (!n || pending) return;
    const items = picked.map((c) => ({ name: nameOf(c).trim() || c.name, rule: c.rule, order: c.order }));
    startTransition(() => create({ sourceId: source.id, items }));
  };

  const addRecipe = (r: RecipeCard) => {
    setCards((prev) => (prev.some((c) => c.key === r.key) ? prev : [...prev, r]));
    toggle(r.key, true);
  };

  const ctaButton = (extra = '') => (
    <button type="button" onClick={submit} disabled={!n || pending} className={`${buttonClass('primary', 'md', extra)} disabled:cursor-not-allowed disabled:bg-surface-3 disabled:text-text-3`}>
      {pending ? <Spinner /> : null}
      {pending ? 'Creating…' : cta}
    </button>
  );

  return (
    <div className="flex flex-col">
      <header className="flex flex-wrap items-end justify-between gap-6 px-6 pb-7 pt-8 sm:px-8 sm:pt-12" style={{ background: headerBackground }}>
        <div className="flex min-w-0 max-w-[720px] flex-col gap-2.5">{intro}</div>
        <div className="flex flex-wrap gap-3">
          <RecipeMenu recipes={recipes} inList={new Set(cards.map((c) => c.key))} onAdd={addRecipe} />
          <span className="hidden sm:contents">{ctaButton()}</span>
        </div>
      </header>
      <div className="flex flex-col gap-5 px-6 pb-8 sm:px-8">
        {cards.length === 0 ? (
          <div className="flex flex-col gap-3 rounded-card bg-surface-2 p-6">
            <h2 className="m-0 text-[18px] font-bold">No big groups yet</h2>
            <p className="m-0 max-w-[620px] text-[15px] leading-[1.6] text-text-2">
              Suggestions need at least 25 songs that share a genre, decade or mood. Import a recipe above, or build a playlist with your own rules.
            </p>
            <div>
              <Link href={`/app/playlists/new?source=${source.id}`} className={buttonClass('secondary', 'sm')}>
                New smart playlist
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="tnum flex flex-wrap items-center justify-between gap-3 text-[14px] text-text-2">
              <span>
                <strong className="text-text-1">
                  {n} of {cards.length} selected
                </strong>
                {unmatchedCount > 0 ? ` · ${unmatchedCount.toLocaleString('en-US')} song${unmatchedCount === 1 ? '' : 's'} fit none yet` : ''}
              </span>
              <span className="flex gap-4">
                <button type="button" onClick={() => setOff(new Set())} className="py-2 text-[14px] font-bold text-accent-hover hover:text-accent-soft">
                  Select all
                </button>
                <button type="button" onClick={() => setOff(new Set(cards.map((c) => c.key)))} className="py-2 text-[14px] font-bold text-accent-hover hover:text-accent-soft">
                  Clear
                </button>
              </span>
            </div>
            <p className="m-0 text-[14px] text-text-2 sm:hidden">Tap a cover to include it. Tap a name to rename it.</p>

            <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-[repeat(auto-fill,minmax(260px,1fr))] sm:gap-5">
              {cards.map((c) => (
                <SuggestionTile key={c.key} card={c} name={nameOf(c)} on={!off.has(c.key)} onToggle={(on) => toggle(c.key, on)} onRename={(v) => setNames((p) => ({ ...p, [c.key]: v }))} />
              ))}
            </ul>

            <p className="m-0 text-[13px] leading-[1.6] text-text-3">
              Counts are estimates. Songs can land in more than one playlist (a 90s Country song also goes into Country).
              {unmatchedCount > 0 ? (
                <>
                  {' '}
                  {unmatchedCount.toLocaleString('en-US')} song{unmatchedCount === 1 ? " doesn't" : "s don't"} fit any suggestion yet; you&apos;ll find them in{' '}
                  <Link href={`/app/sources/${source.id}/unmatched`}>Unmatched songs</Link>.
                </>
              ) : null}{' '}
              Spotify may make new playlists public; you can make any of them private in the Spotify app.
            </p>
          </>
        )}

        {cards.length ? (
          <StickyBar label="Create playlists">
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-[13px] text-text-2">
                {pending ? `Creating ${n} playlist${n === 1 ? '' : 's'} in Spotify… this can take a minute.` : `${n} selected · they'll keep filling themselves as you add songs to ${source.name}.`}
              </span>
              <ActionNotice result={state} />
            </div>
            {ctaButton('w-full sm:w-auto')}
          </StickyBar>
        ) : null}
        {footer}
      </div>
    </div>
  );
}

function SuggestionTile({
  card,
  name,
  on,
  onToggle,
  onRename,
}: {
  card: SuggestionCard;
  name: string;
  on: boolean;
  onToggle: (on: boolean) => void;
  onRename: (v: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <li
      className={`flex min-w-0 flex-col gap-2 rounded-card p-2 transition-colors duration-200 sm:gap-3 sm:p-3.5 ${on ? 'bg-surface-2' : 'bg-surface-1'}`}
      style={{ boxShadow: on ? 'inset 0 0 0 2px #8B5CF6' : 'inset 0 0 0 1px rgba(255,255,255,0.08)' }}
    >
      <label className="relative flex aspect-square cursor-pointer flex-col justify-end rounded-sm p-2.5 sm:aspect-[16/10] sm:p-3.5" style={{ background: card.cover }}>
        <span className="line-clamp-2 text-[17px] font-extrabold leading-none tracking-[-0.03em] text-bg sm:text-[26px]">{name || card.name}</span>
        <span className="absolute right-1.5 top-1.5 flex size-8 items-center justify-center rounded-pill bg-bg/70 sm:right-2.5 sm:top-2.5">
          <input type="checkbox" checked={on} onChange={(e) => onToggle(e.target.checked)} aria-label={`Include ${name || card.name}`} className="m-0 size-[18px] cursor-pointer accent-accent" />
        </span>
      </label>

      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-col px-0.5">
          <input
            ref={input}
            type="text"
            value={name}
            maxLength={100}
            onChange={(e) => onRename(e.target.value)}
            aria-label={`Name for ${card.name}`}
            className="-ml-1 w-full min-w-0 rounded-art border border-transparent bg-transparent px-1 py-0.5 text-[14px] font-bold text-text-1 hover:border-white/12 focus:border-accent focus:outline-none sm:text-[16px]"
          />
          <span className="tnum truncate text-[12px] text-text-2 sm:text-[13px]">
            ~{card.count.toLocaleString('en-US')} songs<span className="sm:hidden"> · {card.kindLabel}</span>
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            input.current?.focus();
            input.current?.select();
          }}
          aria-label={`Rename ${name || card.name}`}
          className="hidden size-9 shrink-0 items-center justify-center rounded-pill bg-surface-3 text-text-1 hover:bg-[#303035] sm:flex"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 20h4L19 9l-4-4L4 16z" />
          </svg>
        </button>
      </div>

      {card.chips.length ? (
        <ul aria-label="Rules" className="m-0 hidden list-none flex-wrap gap-1.5 p-0 sm:flex">
          {card.chips.map((ch) => (
            <li key={ch} className="rounded-pill bg-surface-3 px-2.5 py-[3px] text-[12px] font-semibold">
              {ch}
            </li>
          ))}
        </ul>
      ) : null}

      {card.samples.length ? (
        <ul aria-label="Recently added songs" className="m-0 hidden list-none flex-col gap-2 border-t border-line p-0 pt-2.5 sm:flex">
          {card.samples.map((t) => (
            <li key={t.id} className="flex items-center gap-2.5 text-[13px]">
              <Art url={t.imageUrl} size={28} />
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-semibold">{t.name}</span>
                <span className="truncate text-text-3">{t.artist}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function RecipeMenu({ recipes, inList, onAdd }: { recipes: RecipeCard[]; inList: Set<string>; onAdd: (r: RecipeCard) => void }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={wrap} className="relative">
      <button type="button" aria-expanded={open} aria-controls="recipe-menu" onClick={() => setOpen((v) => !v)} className={buttonClass('secondary', 'md', 'h-10 px-4 text-[14px] sm:h-12 sm:px-5 sm:text-[15px]')}>
        Import a recipe
        <ChevronDownIcon size={16} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open ? (
        <div
          id="recipe-menu"
          className="absolute left-0 top-full z-30 mt-2 flex max-h-[min(70dvh,520px)] w-[min(92vw,400px)] flex-col gap-1 overflow-y-auto rounded-card bg-surface-3 p-1.5 shadow-e3 sm:left-auto sm:right-0"
        >
          <p className="m-0 px-3 pb-1 pt-2 text-[12px] font-bold uppercase tracking-[0.06em] text-text-3">Recipes</p>
          {recipes.map((r) => {
            const added = inList.has(r.key);
            const disabled = added || r.exists;
            return (
              <button
                key={r.slug}
                type="button"
                disabled={disabled}
                onClick={() => {
                  onAdd(r);
                  setOpen(false);
                }}
                className="flex flex-col items-start gap-1.5 rounded-sm px-3 py-2.5 text-left text-text-1 enabled:hover:bg-[#3A3A40] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="flex w-full items-baseline justify-between gap-3">
                  <span className="text-[14px] font-bold">{r.name}</span>
                  <span className="tnum shrink-0 text-[12px] text-text-2">{r.exists ? 'You have this one' : added ? 'In the list' : `~${r.count.toLocaleString('en-US')} songs`}</span>
                </span>
                <span className="text-[13px] leading-[1.45] text-text-2">{r.description}</span>
                {r.chips.length ? (
                  <span className="flex flex-wrap gap-1">
                    {r.chips.map((ch) => (
                      <span key={ch} className="rounded-pill bg-bg px-2 py-0.5 text-[11px] font-semibold">
                        {ch}
                      </span>
                    ))}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
