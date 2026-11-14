'use client';

import { useCallback, useState } from 'react';
import { autopilotNow } from '@/app/app/sources/[id]/actions';
import type { ExtraStep } from './analyze-progress';
import { useAnalysis } from './use-analysis';

/** Analyze a source with live progress, then let Autopilot create the playlists it recommends. */
export function useAnalyzeAndAutopilot() {
  const analysis = useAnalysis();
  const [extra, setExtra] = useState<ExtraStep | null>(null);
  const { run: analyze } = analysis;

  const run = useCallback(
    async (sourceId: string): Promise<{ ok: boolean; created: string[] }> => {
      setExtra(null);
      const ok = await analyze(sourceId);
      if (!ok) return { ok: false, created: [] };
      setExtra({ label: 'Creating your smart playlists', detail: 'in Spotify…', state: 'working' });
      const result = await autopilotNow(sourceId).catch(() => null);
      const created = result && result.ok ? result.created : [];
      setExtra(
        created.length
          ? { label: `Created ${created.length} smart playlist${created.length === 1 ? '' : 's'}`, detail: created.slice(0, 4).join(', ') + (created.length > 4 ? '…' : ''), state: 'done' }
          : { label: 'Smart playlists', detail: 'nothing new to create', state: 'done' },
      );
      return { ok: true, created };
    },
    [analyze],
  );

  return { state: analysis.state, extra, run };
}
