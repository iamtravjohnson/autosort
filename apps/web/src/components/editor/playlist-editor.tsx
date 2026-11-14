'use client';

import { matchesRule, ruleChips, ruleSchema, sortTracks, type OrderSpec, type SyncSettings, type TrackFacts } from '@autosort/core';
import Link from 'next/link';
import { useDeferredValue, useMemo, useRef, useState, useTransition, type KeyboardEvent, type ReactNode } from 'react';
import { deleteSmartPlaylist, regenerateCover, saveSmartPlaylist, setPlaylistPaused } from '@/app/app/playlists/actions';
import { ExternalIcon, MusicIcon, XIcon } from '@/components/icons';
import { buttonClass, KeyChip, SpotifyLogo } from '@/components/ui';
import { coverGradient, timeAgo } from '@/lib/format';
import {
  coverStops,
  factsFromCompact,
  friendlyLastError,
  mergeTracks,
  ORDER_DEFAULTS,
  orderChoice,
  orderLabel,
  shortDate,
  spotifyPlaylistUrl,
  spotifyTrackUrl,
  stableJson,
  type ActionResult,
  type OrderChoice,
} from '@/lib/rules-ui';
import { ActionNotice, Art, Panel, Segmented, Spinner } from './bits';
import { RulesBuilder, type RuleHints } from './rules-builder';
import { SongsPanel } from './songs-panel';
import { StickyBar } from './sticky-bar';
import type { EditorDraft, EditorPlaylist, EditorSource, SongRow, SongsResult } from './types';

const PREVIEW_PAGE = 50;

function omit(map: Record<string, number>, key: string): Record<string, number> {
  const next = { ...map };
  delete next[key];
  return next;
}

/** Songs from the chosen sources that the draft's rules (and overrides) put in the playlist, in order. */
function previewOf(facts: TrackFacts[], d: Pick<EditorDraft, 'rule' | 'order' | 'include' | 'exclude' | 'pinned'>): TrackFacts[] {
  try {
    const inc = new Set(d.include);
    const exc = new Set(d.exclude);
    const matched = facts.filter((t) => !exc.has(t.id) && (inc.has(t.id) || matchesRule(t, d.rule)));
    return sortTracks(matched, d.order, { pinned: d.pinned });
  } catch {
    return [];
  }
}

function setDiff(a: string[], b: string[]): number {
  const sa = new Set(a);
  const sb = new Set(b);
  return [...sa].filter((x) => !sb.has(x)).length + [...sb].filter((x) => !sa.has(x)).length;
}

/** How many separate things differ between the saved state and the draft. */
function countChanges(a: EditorDraft, b: EditorDraft): number {
  let n = 0;
  if (a.name.trim() !== b.name.trim()) n++;
  if (setDiff(a.sourceIds, b.sourceIds)) n++;
  if (a.rule.match !== b.rule.match) n++;
  const len = Math.max(a.rule.conditions.length, b.rule.conditions.length);
  for (let i = 0; i < len; i++) if (stableJson(a.rule.conditions[i]) !== stableJson(b.rule.conditions[i])) n++;
  if (stableJson(a.order) !== stableJson(b.order)) n++;
  for (const k of ['addNew', 'removeMissing', 'keepManualAdds'] as const) if (a.sync[k] !== b.sync[k]) n++;
  n += setDiff(a.include, b.include) + setDiff(a.exclude, b.exclude);
  const pins = new Set([...Object.keys(a.pinned), ...Object.keys(b.pinned)]);
  for (const id of pins) if (a.pinned[id] !== b.pinned[id]) n++;
  return n;
}

/** Most common values first, for autocomplete. */
function topValues(lists: string[][], limit: number): string[] {
  const counts = new Map<string, number>();
  for (const list of lists) for (const v of list) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts]
    .sort((x, y) => y[1] - x[1])
    .slice(0, limit)
    .map(([v]) => v);
}

export function PlaylistEditor({
  initial,
  playlist,
  sources,
  songs,
}: {
  initial: EditorDraft;
  /** The saved row (null on /new). */
  playlist: EditorPlaylist | null;
  sources: EditorSource[];
  /** Current Spotify order, streamed (only when the playlist exists in Spotify). */
  songs: Promise<SongsResult> | null;
}) {
  const [draft, setDraft] = useState<EditorDraft>(initial);
  const [baseline, setBaseline] = useState<EditorDraft>(initial);
  const [tab, setTab] = useState<'rules' | 'songs'>('rules');
  const [names, setNames] = useState<Record<string, { name: string; artist: string }>>({});
  const [result, setResult] = useState<ActionResult | null>(null);
  const [saving, startSaving] = useTransition();
  const [busy, startBusy] = useTransition();
  const [showAll, setShowAll] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [copied, setCopied] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [exportText, setExportText] = useState<string | null>(null);
  const [deleteResult, setDeleteResult] = useState<ActionResult | null>(null);
  const sheet = useRef<HTMLDialogElement>(null);
  const deleteDialog = useRef<HTMLDialogElement>(null);

  const isNew = playlist === null;
  const set = <K extends keyof EditorDraft>(key: K, value: EditorDraft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  /* ----- Facts and live preview (runs in the browser with the engine) ----- */
  const factsBySource = useMemo(() => new Map(sources.map((s) => [s.id, s.tracks.map(factsFromCompact)])), [sources]);
  const allById = useMemo(() => {
    const m = new Map<string, TrackFacts>();
    for (const list of factsBySource.values()) for (const t of list) m.set(t.id, t);
    return m;
  }, [factsBySource]);

  const deferred = useDeferredValue(draft);
  const { sourceIds: dSources, rule: dRule, order: dOrder, include: dInclude, exclude: dExclude, pinned: dPinned } = deferred;
  const preview = useMemo(
    () => previewOf(mergeTracks(dSources.map((id) => factsBySource.get(id) ?? [])), { rule: dRule, order: dOrder, include: dInclude, exclude: dExclude, pinned: dPinned }),
    [factsBySource, dSources, dRule, dOrder, dInclude, dExclude, dPinned],
  );
  const baselineCount = useMemo(() => previewOf(mergeTracks(baseline.sourceIds.map((id) => factsBySource.get(id) ?? [])), baseline).length, [factsBySource, baseline]);
  const stale = deferred !== draft;

  const hints: RuleHints = useMemo(() => {
    const facts = draft.sourceIds.flatMap((id) => factsBySource.get(id) ?? []);
    return {
      genres: topValues(facts.map((t) => t.genres), 200),
      artists: topValues(facts.map((t) => t.artists.map((a) => a.name)), 300),
      tags: topValues(facts.map((t) => t.tags), 150),
    };
  }, [factsBySource, draft.sourceIds]);

  /* ----- Saving ----- */
  const ruleOk = useMemo(() => ruleSchema.safeParse(draft.rule).success, [draft.rule]);
  const changes = countChanges(baseline, draft);
  const problem = !draft.name.trim() ? 'Give it a name.' : draft.sourceIds.length === 0 ? 'Pick at least one source.' : !ruleOk ? 'One of the rules is incomplete.' : null;
  const canSave = !problem && !saving && (isNew || changes > 0);

  const save = () => {
    if (!canSave) return;
    const sent: EditorDraft = { ...draft, name: draft.name.trim() };
    setResult(null);
    startSaving(async () => {
      const res = await saveSmartPlaylist({ id: playlist?.id, draft: sent });
      if (!res) return; // redirected
      setResult(res);
      if (res.saved) {
        setBaseline(sent);
        setDraft((d) => (d === draft ? sent : d));
      }
    });
  };

  const discard = () => {
    setDraft(baseline);
    setResult(null);
  };

  const togglePause = () => {
    if (!playlist) return;
    startBusy(async () => setResult(await setPlaylistPaused({ id: playlist.id, paused: !playlist.paused })));
  };

  const newCover = () => {
    if (!playlist) return;
    startBusy(async () => setResult(await regenerateCover({ id: playlist.id })));
  };

  const remove = (removeFromSpotify: boolean) => {
    if (!playlist) return;
    startBusy(async () => {
      const res = await deleteSmartPlaylist({ id: playlist.id, removeFromSpotify });
      if (res) setDeleteResult(res);
    });
  };

  const exportRecipe = async () => {
    const json = JSON.stringify({ name: draft.name.trim(), description: ruleChips(draft.rule).join(' · '), rule: draft.rule, order: draft.order }, null, 2);
    try {
      await navigator.clipboard.writeText(json);
      setCopied('copied');
      setExportText(null);
      window.setTimeout(() => setCopied('idle'), 2000);
    } catch {
      setCopied('failed');
      setExportText(json);
    }
  };

  /* ----- Overrides ----- */
  const remember = (s: SongRow) => setNames((n) => ({ ...n, [s.id]: { name: s.name, artist: s.artist } }));
  const songName = (id: string) => {
    const known = names[id];
    if (known) return known;
    const t = allById.get(id);
    return t ? { name: t.name, artist: t.artists.map((a) => a.name).join(', ') } : { name: 'A song not in your sources', artist: '' };
  };
  const unpin = (id: string) => setDraft((d) => ({ ...d, pinned: omit(d.pinned, id) }));
  const restore = (id: string) => setDraft((d) => ({ ...d, exclude: d.exclude.filter((x) => x !== id) }));
  const unInclude = (id: string) => setDraft((d) => ({ ...d, include: d.include.filter((x) => x !== id) }));

  /* ----- Header ----- */
  const cover = coverGradient(draft.name || 'Smart playlist');
  const [stopA, stopB] = coverStops(cover);
  const selectedSources = sources.filter((s) => draft.sourceIds.includes(s.id));
  const showSongsTab = Boolean(playlist?.spotifyPlaylistId && songs);
  const today = playlist?.lastAddedCount && playlist.lastSyncedAt ? playlist.lastAddedCount : 0;

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const next = tab === 'rules' ? 'songs' : 'rules';
      setTab(next);
      document.getElementById(`tab-${next}`)?.focus();
    }
  };

  const openSheet = () => {
    setSheetOpen(true);
    sheet.current?.showModal();
  };

  const matchToggle = (
    <Segmented
      label="Match"
      value={draft.rule.match}
      options={[
        { value: 'all', label: 'Match all' },
        { value: 'any', label: 'Any' },
      ]}
      onChange={(m) => set('rule', { ...draft.rule, match: m })}
      size="sm"
    />
  );
  const chips = ruleChips(draft.rule);

  return (
    <div className="flex flex-col">
      <h1 className="sr-only">{isNew ? 'New smart playlist' : `Edit ${baseline.name}`}</h1>
      <header
        className="flex flex-wrap items-end gap-6 px-6 pb-7 pt-8 sm:gap-7 sm:px-8 sm:pt-14"
        style={{ background: `linear-gradient(180deg, color-mix(in srgb, ${stopA} 42%, #141416) 0%, color-mix(in srgb, ${stopB} 38%, #141416) 55%, #141416 100%)` }}
      >
        <div
          aria-hidden="true"
          className="flex size-[148px] shrink-0 flex-col justify-between rounded-sm p-4 shadow-[0_24px_64px_rgba(0,0,0,0.5)] sm:size-[184px] sm:p-[18px]"
          style={{ background: cover }}
        >
          <MusicIcon size={30} className="text-bg" />
          <span className="line-clamp-3 break-words text-[24px] font-extrabold leading-none tracking-[-0.03em] text-bg sm:text-[30px]">{draft.name || 'New playlist'}</span>
        </div>

        <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-2.5">
          <span className="text-[13px] font-bold">Smart playlist</span>
          <label className="flex flex-col">
            <span className="sr-only">Playlist name</span>
            <input
              type="text"
              value={draft.name}
              maxLength={100}
              placeholder="Name it"
              onChange={(e) => set('name', e.target.value)}
              className="-ml-2 w-full min-w-0 rounded-sm border border-transparent bg-transparent px-2 py-1 text-[32px] font-extrabold leading-[1.05] tracking-[-0.04em] text-text-1 placeholder:text-white/40 hover:border-white/12 focus:border-accent sm:text-[clamp(40px,5.5vw,72px)]"
            />
          </label>
          <p className="m-0 text-[13px] text-text-2">
            Shows in Spotify as “{draft.name.trim() || 'Name'} (AutoSort)”.
            {isNew ? ' Spotify may make new playlists public; you can make it private in the Spotify app.' : ''}
          </p>
          <div className="tnum flex flex-wrap items-center gap-2.5 text-[14px] text-[#E4E4E7]">
            {selectedSources.length ? (
              <span className="flex items-center gap-1.5 rounded-pill bg-black/35 py-1 pl-1 pr-2.5">
                <span className="size-[22px] rounded-art" style={{ background: 'linear-gradient(90deg,#4A3B2A 50%,#2F3B4A 50%)' }} aria-hidden="true" />
                From {selectedSources.map((s) => s.name).join(', ')}
              </span>
            ) : null}
            {playlist ? (
              <span>
                {(playlist.trackCount ?? 0).toLocaleString('en-US')} songs
                {today ? (
                  <>
                    {' '}
                    · <strong>+{today} last sync</strong>
                  </>
                ) : null}
                {playlist.lastSyncedAt ? ` · synced ${timeAgo(playlist.lastSyncedAt)}` : ''}
              </span>
            ) : (
              <span>New · not in Spotify yet</span>
            )}
            {playlist?.paused ? <span className="rounded-pill bg-black/35 px-2.5 py-1 text-[13px] font-semibold">Paused</span> : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button type="button" onClick={exportRecipe} className={buttonClass('secondary', 'sm', 'h-11 px-[18px]')}>
            {copied === 'copied' ? 'Copied' : 'Export as recipe'}
          </button>
          {playlist ? (
            <>
              <button type="button" onClick={togglePause} disabled={busy} className={buttonClass('secondary', 'sm', 'h-11 px-[18px] disabled:opacity-60')}>
                {playlist.paused ? 'Resume' : 'Pause'}
              </button>
              {playlist.spotifyPlaylistId ? (
                <button type="button" onClick={newCover} disabled={busy} className={buttonClass('secondary', 'sm', 'h-11 px-[18px] disabled:opacity-60')}>
                  New cover
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setDeleteResult(null);
                  deleteDialog.current?.showModal();
                }}
                className={buttonClass('ghost', 'sm', 'h-11 px-3 text-error-text hover:text-error')}
              >
                Delete
              </button>
            </>
          ) : null}
          {playlist?.spotifyPlaylistId ? (
            <a
              href={spotifyPlaylistUrl(playlist.spotifyPlaylistId)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${baseline.name} in Spotify`}
              className="flex size-11 items-center justify-center rounded-pill bg-black/40 text-text-1 hover:bg-black/60 hover:text-text-1"
            >
              <ExternalIcon size={18} />
            </a>
          ) : null}
        </div>
      </header>

      <div className="flex flex-col gap-2 px-6 sm:px-8">
        {exportText ? (
          <div className="flex flex-col gap-2 rounded-card bg-surface-2 p-4">
            <label htmlFor="recipe-json" className="text-[13px] font-semibold text-text-2">
              Copying didn&apos;t work in this browser. Select the recipe below and copy it.
            </label>
            <textarea id="recipe-json" readOnly value={exportText} rows={6} className="w-full rounded-card border border-white/12 bg-bg p-3 font-mono text-[12px] text-text-1" />
          </div>
        ) : null}
        {busy ? (
          <p role="status" className="m-0 flex items-center gap-2 text-[14px] text-text-2">
            <Spinner /> Working on it… this can take a minute.
          </p>
        ) : null}
        {playlist?.lastError && !playlist.paused ? (
          <p role="note" className="m-0 rounded-card border border-error/40 bg-error/[0.08] px-4 py-3 text-[14px] text-error-text">
            The last sync hit a problem: {friendlyLastError(playlist.lastError)}
          </p>
        ) : null}
        {playlist && !playlist.spotifyPlaylistId && !playlist.lastError ? (
          <p role="note" className="m-0 rounded-card border border-info/30 bg-info/[0.08] px-4 py-3 text-[14px] text-[#E0F2FE]">
            Not in Spotify yet. Save to create it. Spotify may make new playlists public; you can make it private in the Spotify app.
          </p>
        ) : null}
        {playlist?.paused ? (
          <p role="note" className="m-0 rounded-card border border-warning/35 bg-warning/[0.08] px-4 py-3 text-[14px] text-[#FEF3C7]">
            Paused: AutoSort isn&apos;t changing this playlist in Spotify. Resume to catch it up.
          </p>
        ) : null}
      </div>

      {showSongsTab ? (
        <div role="tablist" aria-label="Editor sections" className="mx-6 mt-4 flex gap-6 border-b border-line sm:mx-8">
          {(
            [
              ['rules', 'Rules & preview'],
              ['songs', 'Songs in Spotify'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              id={`tab-${id}`}
              type="button"
              role="tab"
              aria-selected={tab === id}
              aria-controls={`panel-${id}`}
              tabIndex={tab === id ? 0 : -1}
              onClick={() => setTab(id)}
              onKeyDown={onTabKey}
              className={`-mb-px h-10 border-b-2 text-[14px] ${tab === id ? 'border-accent font-bold text-text-1' : 'border-transparent font-semibold text-text-2 hover:text-text-1'}`}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex flex-col px-6 pb-8 pt-4 sm:px-8">
        {tab === 'songs' && showSongsTab && songs ? (
          <div id="panel-songs" role="tabpanel" aria-labelledby="tab-songs">
            <SongsPanel
              songs={songs}
              overrides={{ pinned: draft.pinned, exclude: draft.exclude }}
              onPin={(s, i) => {
                remember(s);
                setDraft((d) => ({ ...d, pinned: { ...d.pinned, [s.id]: i }, exclude: d.exclude.filter((x) => x !== s.id) }));
              }}
              onUnpin={(s) => unpin(s.id)}
              onExclude={(s) => {
                remember(s);
                setDraft((d) => ({ ...d, exclude: [...new Set([...d.exclude, s.id])], include: d.include.filter((x) => x !== s.id), pinned: omit(d.pinned, s.id) }));
              }}
              onRestore={(s) => restore(s.id)}
            />
          </div>
        ) : (
          <div id="panel-rules" role={showSongsTab ? 'tabpanel' : undefined} aria-labelledby={showSongsTab ? 'tab-rules' : undefined} className="flex flex-wrap items-start gap-6">
            <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-5">
              <Panel id="sources-title" title="Sources">
                {sources.length === 0 ? (
                  <p className="m-0 text-[14px] text-text-2">
                    You don&apos;t have a source yet. <Link href="/app/sources">Pick one</Link> (a playlist you own, or Liked Songs) first.
                  </p>
                ) : (
                  <div role="group" aria-labelledby="sources-title" className="flex flex-wrap gap-2">
                    {sources.map((s) => {
                      const on = draft.sourceIds.includes(s.id);
                      return (
                        <label
                          key={s.id}
                          className={`flex h-10 cursor-pointer items-center gap-2 rounded-pill pl-3 pr-4 text-[14px] font-semibold transition-colors duration-200 ${on ? 'bg-accent-tint text-accent-soft' : 'bg-surface-3 text-text-1'}`}
                        >
                          <input
                            type="checkbox"
                            checked={on}
                            onChange={(e) => set('sourceIds', e.target.checked ? [...draft.sourceIds, s.id] : draft.sourceIds.filter((x) => x !== s.id))}
                            className="m-0 size-4 accent-accent"
                          />
                          {s.name}
                          <span className="tnum text-[12px] font-normal text-text-3">{s.analyzed ? s.tracks.length.toLocaleString('en-US') : 'not analyzed'}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
                {selectedSources.some((s) => !s.analyzed) ? (
                  <p className="m-0 text-[13px] text-text-3">
                    Sources that haven&apos;t been analyzed yet can&apos;t show in the preview. They fill in at the next sync.
                  </p>
                ) : null}
              </Panel>

              <Panel id="rules-title" title="Rules" aside={<span className="hidden md:inline-flex">{matchToggle}</span>}>
                <div className="hidden md:block">
                  <RulesBuilder rule={draft.rule} onChange={(r) => set('rule', r)} hints={hints} />
                </div>
                <div className="flex flex-col gap-3 md:hidden">
                  {chips.length ? (
                    <ul aria-label="Current rules" className="m-0 flex list-none flex-wrap gap-1.5 p-0">
                      <li className="rounded-pill bg-surface-3 px-3 py-1 text-[13px] font-semibold text-text-2">{draft.rule.match === 'all' ? 'Match all' : 'Match any'}</li>
                      {chips.map((c) => (
                        <li key={c} className="rounded-pill bg-surface-3 px-3 py-1 text-[13px] font-semibold">
                          {c}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="m-0 text-[14px] text-text-2">No rules yet, so every song in your sources matches.</p>
                  )}
                  <button type="button" onClick={openSheet} className={buttonClass('secondary', 'sm', 'self-start')}>
                    Edit rules
                  </button>
                </div>
              </Panel>

              <OrderPanel order={draft.order} onChange={(o) => set('order', o)} />

              <SyncPanel sync={draft.sync} sourceName={selectedSources[0]?.name ?? 'your source'} onChange={(s) => set('sync', s)} />

              <Panel id="overrides-title" title="Manual overrides">
                {Object.keys(draft.pinned).length + draft.include.length + draft.exclude.length === 0 ? (
                  <p className="m-0 text-[14px] text-text-2">
                    Nothing pinned or excluded.{' '}
                    {showSongsTab ? 'Use the Songs in Spotify tab to pin a song to its spot or keep one out.' : 'Once the playlist is in Spotify, you can pin songs to a spot or keep them out.'}
                  </p>
                ) : (
                  <ul className="m-0 flex list-none flex-col gap-1 p-0">
                    {Object.entries(draft.pinned)
                      .sort((x, y) => x[1] - y[1])
                      .map(([id, pos]) => (
                        <OverrideRow key={`p-${id}`} tone="pin" label={`Pinned at #${pos + 1}`} song={songName(id)} action="Unpin" onAction={() => unpin(id)} />
                      ))}
                    {draft.include.map((id) => (
                      <OverrideRow key={`i-${id}`} tone="pin" label="Pinned in" song={songName(id)} action="Remove" onAction={() => unInclude(id)} />
                    ))}
                    {draft.exclude.map((id) => (
                      <OverrideRow key={`e-${id}`} tone="out" label="Excluded" song={songName(id)} action="Restore" onAction={() => restore(id)} />
                    ))}
                  </ul>
                )}
              </Panel>
            </div>

            <section aria-labelledby="preview-title" className="flex min-w-0 flex-[1.4_1_480px] flex-col gap-3.5 rounded-card bg-surface-2 p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id="preview-title" className="tnum m-0 text-[18px] font-bold" aria-live="polite">
                  Live preview · {preview.length.toLocaleString('en-US')} song{preview.length === 1 ? '' : 's'} match
                </h2>
                <span className="text-[13px] text-text-2">{orderLabel(draft.order)}</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="m-0 text-[13px] text-text-3">
                  {isNew ? 'From your sources, before it goes to Spotify.' : `Was ${baselineCount.toLocaleString('en-US')} · updates as you change the rules.`}
                </p>
                <SpotifyLogo width={72} />
              </div>
              {preview.length === 0 ? (
                <p className="m-0 rounded-card border border-dashed border-white/16 p-4 text-[14px] text-text-2">
                  {draft.sourceIds.length === 0 ? 'Pick a source to see which songs match.' : 'No songs match these rules yet. Try loosening one.'}
                </p>
              ) : (
                <PreviewTable tracks={showAll ? preview : preview.slice(0, PREVIEW_PAGE)} pinned={draft.pinned} dim={stale} />
              )}
              {preview.length > PREVIEW_PAGE ? (
                <button type="button" onClick={() => setShowAll((v) => !v)} className="tnum self-start text-[13px] font-bold text-accent-hover hover:text-accent-soft">
                  {showAll ? `Show the first ${PREVIEW_PAGE}` : `Show all ${preview.length.toLocaleString('en-US')}`}
                </button>
              ) : null}
            </section>
          </div>
        )}

        <StickyBar label="Save changes">
          <div className="flex min-w-0 flex-col gap-1">
            <span className="flex items-center gap-2 text-[13px]">
              {saving ? (
                <>
                  <Spinner className="text-text-2" />
                  <span className="text-text-2">Saving to Spotify… this can take a minute.</span>
                </>
              ) : problem ? (
                <>
                  <span className="size-2 rounded-pill bg-warning" aria-hidden="true" />
                  <span className="text-warning-text">{problem}</span>
                </>
              ) : changes > 0 || isNew ? (
                <>
                  <span className="size-2 rounded-pill bg-warning" aria-hidden="true" />
                  <span className="text-warning-text">{isNew ? 'Not saved yet' : `${changes} unsaved change${changes === 1 ? '' : 's'}`}</span>
                </>
              ) : (
                <span className="text-text-3">All changes saved</span>
              )}
            </span>
            <ActionNotice result={result} />
          </div>
          <div className="flex items-center gap-2">
            {!isNew && changes > 0 && !saving ? (
              <button type="button" onClick={discard} className={buttonClass('ghost', 'sm', 'h-11 px-4')}>
                Discard
              </button>
            ) : null}
            <button
              type="button"
              onClick={save}
              disabled={!canSave}
              className={`${buttonClass('primary', 'sm', 'h-11 flex-1 px-[22px] sm:flex-none')} disabled:cursor-not-allowed disabled:bg-surface-3 disabled:text-text-3`}
            >
              {saving ? <Spinner /> : null}
              {saving ? 'Saving…' : 'Save to Spotify'}
            </button>
          </div>
        </StickyBar>
      </div>

      <dialog
        ref={sheet}
        aria-labelledby="sheet-title"
        onClose={() => setSheetOpen(false)}
        className="m-0 mt-auto max-h-[88dvh] w-full max-w-full rounded-t-2xl bg-surface-2 p-0 text-text-1 shadow-[0_-24px_64px_rgba(0,0,0,0.65)] backdrop:bg-black/60"
      >
        {sheetOpen ? (
          <div className="flex max-h-[88dvh] flex-col">
            <span aria-hidden="true" className="mx-auto mb-1 mt-2.5 h-1 w-10 rounded-pill bg-[#3A3A40]" />
            <div className="flex items-center justify-between gap-3 border-b border-line px-4 pb-3 pt-2">
              <h2 id="sheet-title" className="m-0 text-[18px] font-bold">
                Rules
              </h2>
              {matchToggle}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3.5">
              <RulesBuilder rule={draft.rule} onChange={(r) => set('rule', r)} hints={hints} />
            </div>
            <div className="tnum flex items-center justify-between gap-3 border-t border-line px-4 pb-7 pt-3">
              <span className="flex flex-col">
                <span className="text-[16px] font-extrabold" aria-live="polite">
                  {preview.length.toLocaleString('en-US')} song{preview.length === 1 ? '' : 's'} match
                </span>
                <span className="text-[12px] text-text-2">{isNew ? 'preview updates live' : `was ${baselineCount.toLocaleString('en-US')} · preview updates live`}</span>
              </span>
              <button type="button" onClick={() => sheet.current?.close()} className={buttonClass('primary', 'md')}>
                Done
              </button>
            </div>
          </div>
        ) : null}
      </dialog>

      {playlist ? (
        <dialog
          ref={deleteDialog}
          aria-labelledby="delete-title"
          className="m-auto w-[min(92vw,460px)] rounded-panel bg-surface-2 p-0 text-text-1 shadow-e3 backdrop:bg-black/60"
        >
          <div className="flex flex-col gap-4 p-6">
            <div className="flex items-start justify-between gap-3">
              <h2 id="delete-title" className="m-0 text-[20px] font-bold">
                Delete {baseline.name}?
              </h2>
              <button type="button" aria-label="Close" onClick={() => deleteDialog.current?.close()} className="flex size-8 shrink-0 items-center justify-center rounded-pill text-text-2 hover:bg-white/10 hover:text-text-1">
                <XIcon size={16} />
              </button>
            </div>
            <p className="m-0 text-[15px] leading-[1.6] text-text-2">
              AutoSort will stop updating it.{' '}
              {playlist.spotifyPlaylistId
                ? 'Do you also want to remove the playlist from your Spotify library? If you keep it, it stays in Spotify as a normal playlist.'
                : "It isn't in Spotify yet, so nothing changes there."}
            </p>
            <ActionNotice result={deleteResult} />
            <div className="flex flex-col gap-2 sm:flex-row-reverse sm:flex-wrap">
              {playlist.spotifyPlaylistId ? (
                <>
                  <button type="button" disabled={busy} onClick={() => remove(true)} className={`${buttonClass('primary', 'sm', 'h-11')} disabled:opacity-60`}>
                    {busy ? <Spinner /> : null}
                    Delete and remove from Spotify
                  </button>
                  <button type="button" disabled={busy} onClick={() => remove(false)} className={`${buttonClass('secondary', 'sm', 'h-11')} disabled:opacity-60`}>
                    Delete, keep it in Spotify
                  </button>
                </>
              ) : (
                <button type="button" disabled={busy} onClick={() => remove(false)} className={`${buttonClass('primary', 'sm', 'h-11')} disabled:opacity-60`}>
                  {busy ? <Spinner /> : null}
                  Delete
                </button>
              )}
              <button type="button" onClick={() => deleteDialog.current?.close()} className={buttonClass('ghost', 'sm', 'h-11')}>
                Cancel
              </button>
            </div>
          </div>
        </dialog>
      ) : null}
    </div>
  );
}

function OverrideRow({ tone, label, song, action, onAction }: { tone: 'pin' | 'out'; label: string; song: { name: string; artist: string }; action: string; onAction: () => void }) {
  return (
    <li className="flex items-center gap-2.5 text-[14px]">
      <span className={`shrink-0 rounded-pill px-2.5 py-[3px] text-[12px] font-bold ${tone === 'pin' ? 'bg-warning/[0.14] text-warning-text' : 'bg-surface-3 text-text-2'}`}>{label}</span>
      <span className={`min-w-0 flex-1 truncate ${tone === 'out' ? 'text-text-2' : ''}`}>
        {song.name}
        {song.artist ? <span className="text-text-3"> · {song.artist}</span> : null}
      </span>
      <button type="button" onClick={onAction} aria-label={`${action} ${song.name}`} className="shrink-0 px-1.5 py-1.5 text-[13px] font-bold text-accent-hover hover:text-accent-soft">
        {action}
      </button>
    </li>
  );
}

const ORDER_OPTIONS: Array<{ choice: Exclude<OrderChoice, 'custom'>; name: string; desc: string }> = [
  { choice: 'newest', name: 'Newest added first', desc: 'Default. Matches how you add songs to your source.' },
  { choice: 'bpm', name: 'BPM', desc: 'Slowest to fastest, or the reverse.' },
  { choice: 'energyArc', name: 'Energy arc', desc: 'Warm-up → peak → cool-down, or a steady build.' },
  { choice: 'harmonic', name: 'Harmonic flow', desc: 'Each key mixes into the next (Camelot).' },
  { choice: 'year', name: 'Release year', desc: 'Oldest to newest, or the reverse.' },
];

function OrderPanel({ order, onChange }: { order: OrderSpec; onChange: (o: OrderSpec) => void }) {
  const current = orderChoice(order);
  const options = current === 'custom' ? [...ORDER_OPTIONS, { choice: 'custom' as const, name: 'Custom', desc: orderLabel(order) }] : ORDER_OPTIONS;
  return (
    <Panel id="order-title" title="Order inside the playlist">
      <div role="radiogroup" aria-labelledby="order-title" className="flex flex-col gap-1">
        {options.map((o) => {
          const on = current === o.choice;
          return (
            <div key={o.choice} className={`flex flex-col gap-2 rounded-card px-3 py-2.5 ${on ? 'bg-surface-3' : ''}`}>
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="radio"
                  name="order"
                  checked={on}
                  onChange={() => {
                    if (o.choice !== 'custom') onChange(ORDER_DEFAULTS[o.choice]);
                  }}
                  className="m-0 size-[18px] shrink-0 accent-accent"
                />
                <span className="flex flex-col">
                  <span className="text-[14px] font-bold">{o.name}</span>
                  <span className="text-[13px] text-text-2">{o.desc}</span>
                </span>
              </label>
              {on ? <OrderOptions order={order} onChange={onChange} /> : null}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function OrderOptions({ order, onChange }: { order: OrderSpec; onChange: (o: OrderSpec) => void }) {
  const wrap = (node: ReactNode) => <div className="pl-[30px]">{node}</div>;
  if (order.by === 'bpm')
    return wrap(
      <Segmented
        label="BPM direction"
        size="sm"
        value={order.direction ?? 'asc'}
        options={[
          { value: 'asc', label: 'Slowest first' },
          { value: 'desc', label: 'Fastest first' },
        ]}
        onChange={(direction) => onChange({ by: 'bpm', direction })}
      />,
    );
  if (order.by === 'year')
    return wrap(
      <Segmented
        label="Year direction"
        size="sm"
        value={order.direction ?? 'asc'}
        options={[
          { value: 'asc', label: 'Oldest first' },
          { value: 'desc', label: 'Newest first' },
        ]}
        onChange={(direction) => onChange({ by: 'year', direction })}
      />,
    );
  if (order.by === 'energyArc')
    return wrap(
      <Segmented
        label="Energy shape"
        size="sm"
        value={order.shape}
        options={[
          { value: 'mountain', label: 'Warm-up → peak → cool-down' },
          { value: 'build', label: 'Build-up' },
          { value: 'windDown', label: 'Wind down' },
        ]}
        onChange={(shape) => onChange({ by: 'energyArc', shape })}
      />,
    );
  if (order.by === 'harmonic')
    return wrap(
      <label className="flex items-center gap-2 text-[13px] text-text-2">
        BPM tolerance
        <select
          value={order.bpmTolerance ?? 8}
          onChange={(e) => onChange({ ...order, bpmTolerance: Number(e.target.value) })}
          className="tnum h-8 rounded-card border border-transparent bg-surface-2 px-2 text-[13px] font-semibold text-text-1 focus:border-accent"
        >
          {[4, 6, 8, 10, 12, 16].map((n) => (
            <option key={n} value={n}>
              ± {n} BPM
            </option>
          ))}
        </select>
      </label>,
    );
  return null;
}

const SYNC_OPTIONS: Array<{ key: keyof SyncSettings; name: string; desc: (source: string) => string }> = [
  { key: 'addNew', name: 'Add new matches daily', desc: (s) => `New songs in ${s} that fit get added at each daily sync.` },
  { key: 'removeMissing', name: 'Remove songs that leave the source', desc: (s) => `If you remove a song from ${s}, it leaves here too.` },
  { key: 'keepManualAdds', name: 'Keep songs I add manually', desc: () => 'Songs you add in Spotify stay, even if they don’t match.' },
];

function SyncPanel({ sync, sourceName, onChange }: { sync: SyncSettings; sourceName: string; onChange: (s: SyncSettings) => void }) {
  return (
    <Panel id="sync-title" title="Sync options">
      <div className="flex flex-col gap-3.5">
        {SYNC_OPTIONS.map((o) => (
          <label key={o.key} className="flex cursor-pointer items-center justify-between gap-4">
            <span className="flex flex-col">
              <span className="text-[14px] font-bold">{o.name}</span>
              <span className="text-[13px] text-text-2">{o.desc(sourceName)}</span>
            </span>
            <input type="checkbox" checked={sync[o.key]} onChange={(e) => onChange({ ...sync, [o.key]: e.target.checked })} className="m-0 size-5 shrink-0 accent-accent" />
          </label>
        ))}
      </div>
    </Panel>
  );
}

function PreviewTable({ tracks, pinned, dim }: { tracks: TrackFacts[]; pinned: Record<string, number>; dim: boolean }) {
  return (
    <div className={`transition-opacity duration-200 ${dim ? 'opacity-70' : ''}`}>
      {/* Phones: compact rows (BPM + key only). */}
      <ol className="tnum m-0 flex list-none flex-col gap-0.5 p-0 md:hidden">
        {tracks.map((t, i) => (
          <li key={t.id} className={`-mx-2 flex items-center gap-3 rounded-sm px-2 py-1.5 ${pinned[t.id] !== undefined ? 'bg-warning/[0.08]' : ''}`}>
            <Art url={t.album.imageUrl} size={40} />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[15px] font-semibold">{t.name}</span>
              <span className="truncate text-[12px] text-text-2">
                {t.artists.map((a) => a.name).join(', ')}
                {pinned[t.id] !== undefined ? ' · pinned' : ''}
              </span>
            </span>
            <span className="w-8 text-right text-[13px] font-semibold">{t.audio ? Math.round(t.audio.tempo) : '—'}</span>
            <span className="w-11 text-center">
              <KeyChip code={t.camelot} size="sm" />
            </span>
            <span className="sr-only">Number {i + 1}</span>
          </li>
        ))}
      </ol>

      {/* Wider screens: the board's table. */}
      <div className="hidden overflow-x-auto md:block">
        <table className="tnum w-full min-w-[540px] border-collapse text-left text-[13px] text-text-2">
          <thead>
            <tr className="border-b border-line text-[11px] font-bold uppercase tracking-[0.06em] text-text-3">
              <th scope="col" className="w-9 py-2 pr-2.5 text-right font-bold">
                #
              </th>
              <th scope="col" className="py-2 pr-2.5 font-bold">
                Title
              </th>
              <th scope="col" className="w-[52px] py-2 pr-2.5 font-bold">
                Year
              </th>
              <th scope="col" className="w-[52px] py-2 pr-2.5 text-right font-bold">
                BPM
              </th>
              <th scope="col" className="w-[56px] py-2 pr-2.5 font-bold">
                Key
              </th>
              <th scope="col" className="w-[104px] py-2 pr-2.5 font-bold">
                Added
              </th>
              <th scope="col" className="w-9 py-2">
                <span className="sr-only">Open in Spotify</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {tracks.map((t, i) => {
              const isPinned = pinned[t.id] !== undefined;
              return (
                <tr key={t.id} className={isPinned ? 'bg-warning/[0.08]' : 'hover:bg-surface-3/50'}>
                  <td className="rounded-l-sm py-1.5 pr-2.5 text-right">{i + 1}</td>
                  <td className="max-w-0 py-1.5 pr-2.5">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <Art url={t.album.imageUrl} size={36} />
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-[14px] font-semibold text-text-1">{t.name}</span>
                        <span className="truncate">
                          {t.artists.map((a) => a.name).join(', ')}
                          {isPinned ? <span className="text-warning-text"> · pinned</span> : null}
                        </span>
                      </span>
                    </span>
                  </td>
                  <td className="py-1.5 pr-2.5">{t.year ?? '—'}</td>
                  <td className="py-1.5 pr-2.5 text-right text-text-1">{t.audio ? Math.round(t.audio.tempo) : '—'}</td>
                  <td className="py-1.5 pr-2.5">
                    <KeyChip code={t.camelot} size="sm" />
                  </td>
                  <td className="whitespace-nowrap py-1.5 pr-2.5">{shortDate(t.addedAt)}</td>
                  <td className="rounded-r-sm py-1.5">
                    <a href={spotifyTrackUrl(t.id)} target="_blank" rel="noopener noreferrer" aria-label={`Open ${t.name} in Spotify`} className="flex size-8 items-center justify-center rounded-pill text-text-2 hover:bg-white/10 hover:text-text-1">
                      <ExternalIcon size={15} />
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

