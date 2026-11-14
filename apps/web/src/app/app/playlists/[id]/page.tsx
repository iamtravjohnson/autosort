import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PlaylistEditor } from '@/components/editor/playlist-editor';
import type { EditorDraft, EditorPlaylist } from '@/components/editor/types';
import { getSmartPlaylist } from '@/lib/queries';
import { fullSync } from '@/lib/rules-ui';
import { requireUser } from '@/lib/session';
import { editorSources, loadSongs } from '../load';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const user = await requireUser();
  const p = UUID.test(id) ? await getSmartPlaylist(user.id, id) : null;
  return { title: p ? p.name : 'Smart playlist' };
}

export default async function EditPlaylistPage({ params }: Props) {
  const user = await requireUser();
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const p = await getSmartPlaylist(user.id, id);
  if (!p) notFound();
  const sources = await editorSources(user.id);

  const initial: EditorDraft = {
    name: p.name,
    sourceIds: p.sourceIds,
    rule: p.rule,
    order: p.order,
    sync: fullSync(p.sync),
    include: p.include,
    exclude: p.exclude,
    pinned: p.pinned,
  };
  const playlist: EditorPlaylist = {
    id: p.id,
    spotifyPlaylistId: p.spotifyPlaylistId,
    paused: p.paused,
    trackCount: p.trackCount,
    lastAddedCount: p.lastAddedCount,
    lastSyncedAt: p.lastSyncedAt?.toISOString() ?? null,
    lastError: p.lastError,
  };
  // Streamed: the editor renders right away and the Songs tab fills in when Spotify answers.
  const songs = p.spotifyPlaylistId ? loadSongs(user.id, p.spotifyPlaylistId, p.managedTrackIds) : null;

  return <PlaylistEditor key={p.id} initial={initial} playlist={playlist} sources={sources} songs={songs} />;
}
