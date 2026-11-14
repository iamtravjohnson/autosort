'use client';

import { matchesRule, ruleChips, type TrackFacts } from '@autosort/core';
import { useDeferredValue, useMemo, useState, useTransition } from 'react';
import { createAskedPlaylist } from '@/app/app/playlists/actions';
import { buttonClass } from '@/components/ui';
import { ruleFromRequest } from '@/lib/ask';
import { factsFromCompact, mergeTracks } from '@/lib/rules-ui';
import { Art, Spinner } from './bits';
import type { EditorSource } from './types';

const ENOUGH = 5;
const EXAMPLES = ['90s country', 'clean rap for the gym', 'slow love songs', 'happy songs from the 2000s', 'Christmas'];

/** Type what you want; AutoSort turns it into rules, shows what matches, and creates it if it makes sense. */
export function AskPlaylist({ sources }: { sources: EditorSource[] }) {
  const analyzed = sources.filter((s) => s.analyzed && s.tracks.length > 0);
  const [text, setText] = useState('');
  const [anyway, setAnyway] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, start] = useTransition();
  const query = useDeferredValue(text);

  const facts = useMemo(() => mergeTracks(analyzed.map((s) => s.tracks.map(factsFromCompact))), [analyzed]);
  const artists = useMemo(() => [...new Set(facts.flatMap((t) => t.artists.map((a) => a.name)))], [facts]);
  const ask = useMemo(() => (query.trim().length >= 3 ? ruleFromRequest(query, artists) : null), [query, artists]);
  const matches = useMemo<TrackFacts[]>(
    () => (ask?.rule ? facts.filter((t) => matchesRule(t, ask.rule!)).sort((a, b) => (b.addedAt ?? '').localeCompare(a.addedAt ?? '')) : []),
    [ask, facts],
  );

  if (analyzed.length === 0) return null;
  const enough = matches.length >= ENOUGH;
  const create = () =>
    start(async () => {
      if (!ask?.rule) return;
      setError(null);
      const res = await createAskedPlaylist({ name: ask.name, rule: ask.rule, sourceIds: analyzed.map((s) => s.id) });
      if (res && !res.ok) setError(res.error ?? 'Something went wrong. Try again.');
    });

  return (
    <section aria-labelledby="ask-title" className="flex flex-col gap-3.5 rounded-card bg-surface-2 p-5">
      <div className="flex flex-col gap-1">
        <h2 id="ask-title" className="m-0 text-[18px] font-bold">
          Ask for a playlist
        </h2>
        <p className="m-0 text-[14px] text-text-2">Describe it in your own words. AutoSort checks your songs and builds it if enough of them match.</p>
      </div>
      <input
        type="text"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setAnyway(false);
        }}
        placeholder="e.g. 90s country love songs"
        aria-label="Describe the playlist you want"
        className="h-12 rounded-pill border border-line bg-surface-1 px-5 text-[16px] text-text-1 placeholder:text-text-3 focus:border-accent focus:outline-none"
      />
      {!ask ? (
        <p className="m-0 flex flex-wrap gap-2 text-[13px] text-text-3">
          Try:
          {EXAMPLES.map((ex) => (
            <button key={ex} type="button" onClick={() => setText(ex)} className="rounded-pill bg-surface-3 px-2.5 py-0.5 text-[13px] text-text-2 hover:text-text-1">
              {ex}
            </button>
          ))}
        </p>
      ) : !ask.rule ? (
        <p className="m-0 text-[14px] text-text-2">
          I couldn&apos;t turn that into a rule yet. Use words like a genre (country, rap, worship), a decade (90s), a mood (happy, chill, workout), love songs, clean, slow, or an artist in your library.
        </p>
      ) : (
        <div className="tnum flex flex-col gap-3">
          <p className="m-0 flex flex-wrap items-center gap-1.5 text-[13px] text-text-2">
            <span className="font-bold text-text-1">{ask.name}:</span>
            {ruleChips(ask.rule).map((c) => (
              <span key={c} className="rounded-pill bg-accent/[0.14] px-2.5 py-0.5 text-[12px] font-bold text-accent-soft">
                {c}
              </span>
            ))}
          </p>
          <p className="m-0 text-[15px]">
            <strong>{matches.length.toLocaleString('en-US')}</strong> of your songs match.
            {matches.length > 0 && !enough ? ` That's a short playlist; it grows as you add songs.` : ''}
          </p>
          {matches.length > 0 ? (
            <ul className="m-0 flex list-none flex-col gap-1 p-0">
              {matches.slice(0, 5).map((t) => (
                <li key={t.id} className="flex items-center gap-3">
                  <Art url={t.album.imageUrl} size={32} />
                  <span className="truncate text-[14px]">
                    <span className="font-semibold">{t.name}</span> <span className="text-text-2">· {t.artists.map((a) => a.name).join(', ')}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="flex flex-wrap items-center gap-3">
            {enough || anyway ? (
              <button type="button" disabled={saving || matches.length === 0} onClick={create} className={buttonClass('primary', 'md', 'disabled:opacity-60')}>
                {saving ? <Spinner /> : null}
                {saving ? 'Creating in Spotify…' : `Create “${ask.name}”`}
              </button>
            ) : matches.length > 0 ? (
              <button type="button" onClick={() => setAnyway(true)} className={buttonClass('secondary', 'md')}>
                Create it anyway
              </button>
            ) : (
              <span className="text-[14px] text-text-2">No songs match yet, so there&apos;s nothing to create.</span>
            )}
          </div>
          {error ? (
            <p role="alert" className="m-0 text-[14px] text-error-text">
              {error}
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}
