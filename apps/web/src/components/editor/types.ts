import type { OrderSpec, Rule, SyncSettings } from '@autosort/core';
import type { ActionError, ActionResult, CompactTrack } from '@/lib/rules-ui';

/** Everything the editor lets you change (what gets saved). */
export interface EditorDraft {
  name: string;
  sourceIds: string[];
  rule: Rule;
  order: OrderSpec;
  sync: SyncSettings;
  include: string[];
  exclude: string[];
  pinned: Record<string, number>;
}

export interface EditorSource {
  id: string;
  name: string;
  analyzed: boolean;
  tracks: CompactTrack[];
}

/** The saved row's status (edit mode). Dates are ISO strings. */
export interface EditorPlaylist {
  id: string;
  spotifyPlaylistId: string | null;
  paused: boolean;
  trackCount: number | null;
  lastAddedCount: number | null;
  lastSyncedAt: string | null;
  lastError: string | null;
}

/** A row in the "Songs in Spotify" tab, in the playlist's current Spotify order. */
export interface SongRow {
  id: string;
  name: string;
  artist: string;
  imageUrl: string | null;
  /** Added by hand in Spotify (AutoSort didn't put it there). */
  manual: boolean;
}

export type SongsResult = { ok: true; tracks: SongRow[] } | ActionError;

/** Save result: `saved` is true when the row was stored, even if Spotify then failed. */
export type SaveResult = ActionResult & { saved?: boolean };
