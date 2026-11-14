'use client';

import Link from 'next/link';
import { useActionState, useId, useState, useSyncExternalStore } from 'react';
import { AlertCircleGlyph, CheckGlyph, ChevronDownGlyph, SyncGlyph, UndoGlyph } from '@/components/home/glyphs';
import { ActionMessage } from '@/components/home/action-message';
import { buttonClass } from '@/components/ui';
import type { ActionState } from '@/lib/stats';
import { undoRunAction } from './actions';

export interface RunLine {
  key: string;
  name: string;
  cover: string;
  count: string;
  note: string | null;
  tone: 'error' | 'muted';
  href?: string;
}

export interface RunView {
  id: string;
  kindLabel: string;
  tone: 'sync' | 'save' | 'problem' | 'restore';
  startedAt: string;
  ago: string;
  title: string;
  summary: string;
  running: boolean;
  lines: RunLine[];
  empty: string | null;
  undo: { label: string; note: string; confirm: string | null } | null;
  undoneAgo: string | null;
}

const TONES: Record<RunView['tone'], { bg: string; fg: string }> = {
  sync: { bg: 'rgba(45,212,191,0.14)', fg: '#5EEAD4' },
  save: { bg: '#241A3D', fg: '#C4B5FD' },
  restore: { bg: '#241A3D', fg: '#C4B5FD' },
  problem: { bg: 'rgba(251,191,36,0.14)', fg: '#FCD34D' },
};

const subscribe = () => () => {};

/** "Today · 6:00 AM" in the viewer's time zone. */
function localWhen(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const dayStart = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((dayStart(now) - dayStart(d)) / 86_400_000);
  const day = days === 0 ? 'Today' : days === 1 ? 'Yesterday' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${day} · ${d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
}

function When({ iso, ago }: { iso: string; ago: string }) {
  const isClient = useSyncExternalStore(subscribe, () => true, () => false);
  return <time dateTime={iso}>{isClient ? localWhen(iso) : ago}</time>;
}

function RunIcon({ tone }: { tone: RunView['tone'] }) {
  const t = TONES[tone];
  const Glyph = tone === 'sync' ? SyncGlyph : tone === 'problem' ? AlertCircleGlyph : tone === 'restore' ? UndoGlyph : CheckGlyph;
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-pill" style={{ background: t.bg, color: t.fg }}>
      <Glyph size={16} strokeWidth={2.5} />
    </span>
  );
}

function UndoButton({ runId, undo }: { runId: string; undo: NonNullable<RunView['undo']> }) {
  const [state, formAction, pending] = useActionState<ActionState | null, FormData>(undoRunAction, null);
  const [confirming, setConfirming] = useState(false);
  const ask = Boolean(undo.confirm) && !confirming;
  return (
    <div className="flex flex-col gap-2.5">
      {confirming && undo.confirm ? (
        <p role="alert" className="m-0 rounded-card bg-error/[0.08] px-3.5 py-2.5 text-[14px] leading-[1.5] text-[#FECACA]">
          {undo.confirm}
        </p>
      ) : null}
      <form action={formAction} className="flex flex-wrap items-center gap-2.5">
        <input type="hidden" name="runId" value={runId} />
        {ask ? (
          <button type="button" onClick={() => setConfirming(true)} className={buttonClass('secondary', 'sm')}>
            <UndoGlyph size={14} />
            {undo.label}
          </button>
        ) : (
          <button type="submit" disabled={pending} className={buttonClass('secondary', 'sm', 'disabled:cursor-wait disabled:opacity-70')}>
            <UndoGlyph size={14} />
            {pending ? 'Undoing…' : confirming ? `Yes, ${undo.label.charAt(0).toLowerCase()}${undo.label.slice(1)}` : undo.label}
          </button>
        )}
        {confirming && !pending ? (
          <button type="button" onClick={() => setConfirming(false)} className={buttonClass('ghost', 'sm')}>
            Cancel
          </button>
        ) : null}
        <span className="text-[12px] text-text-3">{pending ? 'Talking to Spotify… this can take a minute.' : undo.note}</span>
      </form>
      <ActionMessage state={state} />
    </div>
  );
}

function RunItem({ run, open, onToggle }: { run: RunView; open: boolean; onToggle: () => void }) {
  const id = useId();
  return (
    <li className="overflow-hidden rounded-card bg-surface-2">
      <h2 className="m-0 text-[16px]">
        <button
          type="button"
          id={`${id}-h`}
          aria-expanded={open}
          aria-controls={`${id}-p`}
          onClick={onToggle}
          className="flex w-full items-center gap-3.5 p-4 text-left text-text-1 hover:bg-white/[0.02]"
        >
          <RunIcon tone={run.tone} />
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-[13px] font-bold text-text-3">
              {run.kindLabel} · <When iso={run.startedAt} ago={run.ago} />
            </span>
            <span className="text-[16px] font-bold">{run.title}</span>
            {run.summary ? <span className="text-[13px] font-normal text-text-2 sm:hidden">{run.summary}</span> : null}
          </span>
          {run.summary ? <span className="hidden max-w-[45%] text-right text-[13px] font-normal text-text-2 sm:block">{run.summary}</span> : null}
          {run.undoneAgo ? (
            <span className="shrink-0 rounded-pill bg-surface-3 px-2.5 py-1 text-[12px] font-bold text-text-2">Undone {run.undoneAgo}</span>
          ) : run.running ? (
            <span className="shrink-0 rounded-pill bg-info/[0.14] px-2.5 py-1 text-[12px] font-bold text-info-text">Running</span>
          ) : null}
          <ChevronDownGlyph size={18} className={`shrink-0 text-text-2 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>
      </h2>
      {open ? (
        <div id={`${id}-p`} role="region" aria-labelledby={`${id}-h`} className="flex flex-col gap-3 px-4 pb-4 sm:pl-[66px]">
          {run.lines.map((l) => (
            <div key={l.key} className="flex flex-col gap-1.5 rounded-card bg-surface-3 p-3">
              <span className="flex items-center gap-2.5">
                <span className="size-6 shrink-0 rounded-art" style={{ background: l.cover }} aria-hidden="true" />
                <span className="min-w-0 truncate text-[14px] font-bold">{l.name}</span>
                <span className="shrink-0 text-[13px] text-text-2">{l.count}</span>
              </span>
              {l.note || l.href ? (
                <span className={`pl-[34px] text-[13px] ${l.tone === 'error' ? 'text-error-text' : 'text-text-2'}`}>
                  {l.note}
                  {l.href ? (
                    <>
                      {l.note ? ' ' : ''}
                      <Link href={l.href} className="font-bold">
                        See unmatched songs
                      </Link>
                    </>
                  ) : null}
                </span>
              ) : null}
            </div>
          ))}
          {run.empty ? <p className="m-0 text-[14px] text-text-2">{run.empty}</p> : null}
          {run.undo ? <UndoButton runId={run.id} undo={run.undo} /> : null}
        </div>
      ) : null}
    </li>
  );
}

/** The Activity accordion: one run open at a time (the newest by default). */
export function RunList({ runs }: { runs: RunView[] }) {
  const [open, setOpen] = useState<string | null>(runs[0]?.id ?? null);
  return (
    <ol className="tnum m-0 flex list-none flex-col gap-3 p-0">
      {runs.map((r) => (
        <RunItem key={r.id} run={r} open={open === r.id} onToggle={() => setOpen(open === r.id ? null : r.id)} />
      ))}
    </ol>
  );
}
