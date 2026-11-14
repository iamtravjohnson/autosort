import { enrichTracks, type EnrichOptions, type EnrichResult } from './enrich.js';
import { matchesRule, ruleChips, type Rule } from './rules.js';
import { sortTracks, type OrderSpec } from './sort.js';
import type { SpotifyClient } from './spotify/client.js';
import type { TrackFacts, TrackRef } from './types.js';

export interface SyncSettings {
  /** File newly matching songs into the playlist. Default true. */
  addNew: boolean;
  /** Take songs out when they leave the source or stop matching. Default true. */
  removeMissing: boolean;
  /** Keep songs the user added to the smart playlist by hand. Default true. */
  keepManualAdds: boolean;
  /**
   * When the user deletes a song AutoSort added, don't add it back: report it in
   * `userRemovedTrackIds` so the app can store it in `exclude`. Default true.
   */
  rememberRemovals: boolean;
}

export const DEFAULT_SYNC: SyncSettings = { addNew: true, removeMissing: true, keepManualAdds: true, rememberRemovals: true };

export interface SmartPlaylistDefinition {
  id: string;
  name: string;
  rule: Rule;
  order: OrderSpec;
  sync?: Partial<SyncSettings>;
  /** Track ids always included (if in the source) or always left out. */
  include?: string[];
  exclude?: string[];
  /** Lock tracks to positions: track id → index. */
  pinned?: Record<string, number>;
}

/** What AutoSort remembers about a smart playlist between runs. Store it with the definition. */
export interface SyncState {
  /** Track ids AutoSort put in the playlist (everything else there was added by hand). */
  managedTrackIds: string[];
}

export type Change =
  | { kind: 'noop' }
  | { kind: 'prepend'; uris: string[] }
  | { kind: 'append'; uris: string[] }
  | { kind: 'remove'; uris: string[] }
  | { kind: 'replace'; uris: string[] };

export interface SmartPlaylistPlan {
  desiredUris: string[];
  currentUris: string[];
  addedTrackIds: string[];
  removedTrackIds: string[];
  /** Songs the user deleted from the playlist that still match. Add them to `exclude`. */
  userRemovedTrackIds: string[];
  change: Change;
  nextState: SyncState;
}

/** Minimal facts for a track that isn't in the source (e.g. added to the smart playlist by hand). */
function bareFacts(ref: TrackRef): TrackFacts {
  return { ...ref, genres: [], tags: [], genreBuckets: [], genreNear: [], genreScores: {}, genreConfidence: 'low', genreReasons: [], year: null, yearSource: null, decade: null, audio: null, camelot: null, moods: [], themes: [] };
}

function sameList(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

/** Pick the smallest Spotify write that turns `current` into `desired`. */
export function diffPlaylist(current: readonly string[], desired: readonly string[]): Change {
  if (sameList(current, desired)) return { kind: 'noop' };
  if (new Set(current).size !== current.length) return { kind: 'replace', uris: [...desired] };
  if (desired.length > current.length) {
    const extra = desired.length - current.length;
    if (sameList(desired.slice(extra), current)) return { kind: 'prepend', uris: desired.slice(0, extra) };
    if (sameList(desired.slice(0, current.length), current)) return { kind: 'append', uris: desired.slice(current.length) };
  }
  if (desired.length < current.length) {
    const keep = new Set(desired);
    if (sameList(current.filter((u) => keep.has(u)), desired)) return { kind: 'remove', uris: current.filter((u) => !keep.has(u)) };
  }
  return { kind: 'replace', uris: [...desired] };
}

/**
 * Work out what a smart playlist should contain and the write needed to get there.
 * Pure: no network calls. Running it twice on the same inputs yields a no-op the second time.
 */
export function planSmartPlaylist(input: {
  definition: SmartPlaylistDefinition;
  /** Enriched tracks from the source playlist(s). */
  sourceTracks: readonly TrackFacts[];
  /** What's in the Spotify playlist now. */
  currentTracks: readonly TrackRef[];
  state?: SyncState | null;
}): SmartPlaylistPlan {
  const { definition: def } = input;
  const settings = { ...DEFAULT_SYNC, ...def.sync };
  const managed = new Set(input.state?.managedTrackIds ?? []);
  const exclude = new Set(def.exclude ?? []);
  const include = new Set(def.include ?? []);
  const current = [...new Map(input.currentTracks.map((t) => [t.id, t])).values()];
  const currentIds = new Set(current.map((t) => t.id));
  const source = new Map(input.sourceTracks.map((t) => [t.id, t]));

  // Songs AutoSort added that are gone from the playlist were deleted by the user. Skip this when
  // the playlist reads back empty or most songs vanished at once (a failed read or a cleared
  // playlist), so a glitch can't exclude a whole playlist.
  const vanished = current.length > 0 ? [...managed].filter((id) => !currentIds.has(id) && !include.has(id)) : [];
  const userRemoved = new Set(settings.rememberRemovals && vanished.length <= Math.max(10, managed.size / 2) ? vanished : []);

  let matches = [...source.values()].filter((t) => !exclude.has(t.id) && (include.has(t.id) || matchesRule(t, def.rule)));
  const userRemovedTrackIds = matches.filter((t) => userRemoved.has(t.id)).map((t) => t.id);
  matches = matches.filter((t) => !userRemoved.has(t.id));
  if (!settings.addNew) matches = matches.filter((t) => currentIds.has(t.id));
  const matchIds = new Set(matches.map((t) => t.id));

  const keep: TrackFacts[] = [];
  for (const t of current) {
    if (matchIds.has(t.id) || exclude.has(t.id)) continue;
    const isManual = !managed.has(t.id);
    if ((isManual && settings.keepManualAdds) || (!isManual && !settings.removeMissing)) {
      keep.push(source.get(t.id) ?? bareFacts(t));
    }
  }

  const members = [...matches, ...keep];
  const ordered = sortTracks(members, def.order, def.pinned ? { pinned: def.pinned } : {});
  const desiredUris = ordered.map((t) => t.uri);
  const currentUris = input.currentTracks.map((t) => t.uri);
  const desiredIds = new Set(ordered.map((t) => t.id));

  return {
    desiredUris,
    currentUris,
    addedTrackIds: ordered.filter((t) => !currentIds.has(t.id)).map((t) => t.id),
    removedTrackIds: current.filter((t) => !desiredIds.has(t.id)).map((t) => t.id),
    userRemovedTrackIds,
    change: diffPlaylist(currentUris, desiredUris),
    nextState: { managedTrackIds: ordered.filter((t) => matchIds.has(t.id) || managed.has(t.id)).map((t) => t.id) },
  };
}

type Writer = Pick<SpotifyClient, 'addItems' | 'replaceItems' | 'removeItems'>;

/** Apply a planned change to a Spotify playlist. */
export async function applyChange(client: Writer, playlistId: string, change: Change): Promise<string | null> {
  switch (change.kind) {
    case 'noop':
      return null;
    case 'prepend':
      return client.addItems(playlistId, change.uris, 0);
    case 'append':
      return client.addItems(playlistId, change.uris);
    case 'remove':
      return client.removeItems(playlistId, change.uris);
    case 'replace':
      return client.replaceItems(playlistId, change.uris);
  }
}

/** Put a playlist back to an earlier order (an undo point saved from a sync). */
export function restorePlaylist(client: Writer, playlistId: string, uris: readonly string[]): Promise<string | null> {
  return client.replaceItems(playlistId, uris);
}

export type SourceRef = { type: 'playlist'; id: string } | { type: 'liked' };

export interface SyncTarget extends SmartPlaylistDefinition {
  /** Spotify playlist id, once created. */
  playlistId?: string | null;
  state?: SyncState | null;
}

export interface SyncOutcome {
  definitionId: string;
  playlistId: string | null;
  created: boolean;
  plan: SmartPlaylistPlan | null;
  applied: boolean;
  /** The playlist's order before this run, for undo. Empty when nothing changed. */
  previousUris: string[];
  error?: string;
}

export interface SyncResult {
  outcomes: SyncOutcome[];
  sourceTracks: TrackFacts[];
  /** Source tracks no smart playlist claims. */
  unmatched: TrackFacts[];
  enrichment: Pick<EnrichResult, 'pending' | 'complete' | 'errors'>;
}

/** Read and merge sources, newest `addedAt` wins for tracks found in more than one. */
export async function readSources(
  client: Pick<SpotifyClient, 'playlistTracks' | 'savedTracks'>,
  sources: readonly SourceRef[],
): Promise<TrackRef[]> {
  const merged = new Map<string, TrackRef>();
  for (const source of sources) {
    const tracks = source.type === 'liked' ? await client.savedTracks() : await client.playlistTracks(source.id);
    for (const t of tracks) {
      const prev = merged.get(t.id);
      if (!prev || (t.addedAt ?? '') > (prev.addedAt ?? '')) merged.set(t.id, t);
    }
  }
  return [...merged.values()];
}

/**
 * One full run: read the source(s), enrich, then bring every smart playlist up to date.
 * Persist each outcome's `plan.nextState` (and `playlistId` when created) after the run.
 */
export async function syncSmartPlaylists(input: {
  client: SpotifyClient;
  sources: readonly SourceRef[];
  targets: readonly SyncTarget[];
  enrich?: Omit<EnrichOptions, 'spotify'>;
  /** Create Spotify playlists for targets without a `playlistId`. Default true. */
  createMissing?: boolean;
  /** Plan only; don't write to Spotify. */
  dryRun?: boolean;
  /** Text appended to new playlists' descriptions. */
  descriptionSuffix?: string;
}): Promise<SyncResult> {
  const { client } = input;
  const refs = await readSources(client, input.sources);
  const enriched = await enrichTracks(refs, { ...input.enrich, spotify: client });
  const outcomes: SyncOutcome[] = [];

  for (const target of input.targets) {
    const outcome: SyncOutcome = {
      definitionId: target.id,
      playlistId: target.playlistId ?? null,
      created: false,
      plan: null,
      applied: false,
      previousUris: [],
    };
    try {
      let current: TrackRef[] = [];
      if (outcome.playlistId) {
        current = await client.playlistTracks(outcome.playlistId);
      } else if ((input.createMissing ?? true) && !input.dryRun) {
        const description = `${ruleChips(target.rule).join(' · ')}${input.descriptionSuffix ?? ' · Kept in sync by AutoSort'}`.slice(0, 300);
        outcome.playlistId = (await client.createPlaylist({ name: target.name, description })).id;
        outcome.created = true;
      }
      const plan = planSmartPlaylist({ definition: target, sourceTracks: enriched.tracks, currentTracks: current, state: target.state ?? null });
      outcome.plan = plan;
      if (outcome.playlistId && !input.dryRun && plan.change.kind !== 'noop') {
        outcome.previousUris = plan.currentUris;
        await applyChange(client, outcome.playlistId, plan.change);
        outcome.applied = true;
      }
    } catch (err) {
      outcome.error = err instanceof Error ? err.message : String(err);
    }
    outcomes.push(outcome);
  }

  const rules = input.targets.map((t) => t.rule);
  return {
    outcomes,
    sourceTracks: enriched.tracks,
    unmatched: enriched.tracks.filter((t) => !rules.some((r) => matchesRule(t, r))),
    enrichment: { pending: enriched.pending, complete: enriched.complete, errors: enriched.errors },
  };
}
