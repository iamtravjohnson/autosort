import { DEFAULT_SYNC, findRecipe } from '@autosort/core';
import type { Metadata } from 'next';
import { PlaylistEditor } from '@/components/editor/playlist-editor';
import type { EditorDraft } from '@/components/editor/types';
import { ORDER_DEFAULTS } from '@/lib/rules-ui';
import { requireUser } from '@/lib/session';
import { editorSources } from '../load';

export const metadata: Metadata = { title: 'New smart playlist' };

export default async function NewPlaylistPage({ searchParams }: { searchParams: Promise<{ recipe?: string | string[]; source?: string | string[] }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const recipe = typeof sp.recipe === 'string' ? findRecipe(sp.recipe) : undefined;
  const sources = await editorSources(user.id);
  const wanted = typeof sp.source === 'string' ? sources.find((s) => s.id === sp.source) : undefined;
  const first = wanted ?? sources.find((s) => s.analyzed) ?? sources[0];

  const initial: EditorDraft = {
    name: recipe?.name ?? '',
    sourceIds: first ? [first.id] : [],
    rule: recipe?.rule ?? { match: 'all', conditions: [] },
    order: recipe?.order ?? ORDER_DEFAULTS.newest,
    sync: { ...DEFAULT_SYNC },
    include: [],
    exclude: [],
    pinned: {},
  };

  return <PlaylistEditor key={recipe?.slug ?? 'blank'} initial={initial} playlist={null} sources={sources} songs={null} />;
}
