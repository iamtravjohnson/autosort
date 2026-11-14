'use client';

import { useCallback, useRef, useState } from 'react';
import { withBase } from '@/lib/base-path';

type Step = 'audio' | 'years' | 'tags' | 'albumTags' | 'artistTags' | 'artists';
type Count = { done: number; total: number };

export interface AnalysisState {
  status: 'idle' | 'running' | 'done' | 'error';
  /** 1 for the first round; later rounds finish genre lookups. */
  round: number;
  songs: number | null;
  /** This round's lookups per step. */
  steps: Partial<Record<Step, Count>>;
  /** Genre lookups still to do after the last finished round. */
  genresLeft: number | null;
  /** Genre lookups finished in earlier rounds (so counts keep climbing across rounds). */
  genresDoneBefore: number;
  /** What was still pending after the last finished round, per step. */
  lastPending: Partial<Record<Step, number>> | null;
  startedAt: number | null;
  message?: string;
  reconnect?: boolean;
}

const MAX_ROUNDS = 5;
const IDLE: AnalysisState = { status: 'idle', round: 0, songs: null, steps: {}, genresLeft: null, genresDoneBefore: 0, lastPending: null, startedAt: null };

/**
 * Runs an analysis through the streaming route and keeps live counts. Each request is one round;
 * it keeps going while songs still need genre lookups (and each round made progress).
 */
export function useAnalysis() {
  const [state, setState] = useState<AnalysisState>(IDLE);
  const running = useRef(false);

  const run = useCallback(async (sourceId: string): Promise<boolean> => {
    if (running.current) return false;
    running.current = true;
    setState({ ...IDLE, status: 'running', round: 1, startedAt: Date.now() });
    let lastLeft = Infinity;
    try {
      for (let round = 1; round <= MAX_ROUNDS; round++) {
        setState((s) => ({ ...s, round, steps: {} }));
        const res = await fetch(withBase(`/api/sources/${sourceId}/analyze`), { method: 'POST' });
        if (!res.ok || !res.body) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? 'Something went wrong. Try again.');
        }
        let left: number | null = null;
        const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
        let buffer = '';
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += value;
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.trim()) continue;
            const e = JSON.parse(line) as
              | { type: 'read'; total: number }
              | { type: 'step'; step: Step; done: number; total: number }
              | { type: 'done'; songs: number; pending: Record<Step, number> }
              | { type: 'error'; message: string; reconnect?: boolean };
            if (e.type === 'error') {
              setState((s) => ({ ...s, status: 'error', message: e.message, reconnect: e.reconnect }));
              return false;
            }
            if (e.type === 'read') setState((s) => ({ ...s, songs: e.total }));
            if (e.type === 'step') setState((s) => ({ ...s, steps: { ...s.steps, [e.step]: { done: e.done, total: e.total } } }));
            if (e.type === 'done') {
              const leftNow = (e.pending.tags ?? 0) + (e.pending.albumTags ?? 0) + (e.pending.artistTags ?? 0);
              left = leftNow;
              setState((s) => {
                const roundGenres = (['tags', 'albumTags', 'artistTags'] as const).reduce((n, k) => n + (s.steps[k]?.total ?? 0), 0);
                return { ...s, songs: e.songs, genresLeft: leftNow, genresDoneBefore: s.genresDoneBefore + roundGenres, lastPending: e.pending };
              });
            }
          }
        }
        if (left === null) throw new Error('The analysis stopped early. Try again.');
        if (left === 0 || left >= lastLeft) break;
        lastLeft = left;
      }
      setState((s) => ({ ...s, status: 'done' }));
      return true;
    } catch (err) {
      setState((s) => ({ ...s, status: 'error', message: err instanceof Error ? err.message : 'Something went wrong. Try again.' }));
      return false;
    } finally {
      running.current = false;
    }
  }, []);

  return { state, run };
}
