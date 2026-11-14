import type { OrderSpec, Rule, SourceRef, SyncSettings } from '@autosort/core';
import { boolean, index, integer, jsonb, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/** People who use this AutoSort. The first to connect becomes the owner (max 5: Spotify's Development Mode limit). */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  spotifyId: text('spotify_id').notNull().unique(),
  displayName: text('display_name'),
  role: text('role', { enum: ['owner', 'member'] }).notNull().default('member'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/** Encrypted Spotify tokens, one row per user. Deleted when the user disconnects. */
export const spotifyAccounts = pgTable('spotify_accounts', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  scope: text('scope').notNull().default(''),
  status: text('status', { enum: ['connected', 'reconnect'] }).notNull().default('connected'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/** Family invites created by the owner. */
export const invites = pgTable('invites', {
  token: text('token').primaryKey(),
  name: text('name').notNull(),
  email: text('email'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedBy: uuid('used_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/** Compact per-track facts kept from the last analysis (overwritten each sync; Spotify content isn't kept forever). */
export interface TrackSnapshot {
  id: string;
  uri: string;
  name: string;
  artists: string[];
  album: string;
  imageUrl: string | null;
  addedAt: string | null;
  explicit: boolean;
  durationMs: number;
  year: number | null;
  decade: number | null;
  genres: string[];
  genreBuckets: string[];
  /** Likely genres that didn't make the cut (optional review). Missing in older snapshots. */
  genreNear?: string[];
  genreConfidence?: 'high' | 'medium' | 'low';
  /** Why the song got its genre, e.g. "Album tagged country". */
  genreReasons?: string[];
  tags: string[];
  moods: string[];
  themes: string[];
  camelot: string | null;
  tempo: number | null;
  energy: number | null;
  valence: number | null;
  danceability: number | null;
}

/** Playlists (or Liked Songs) a user organizes from. */
export const sources = pgTable(
  'sources',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    kind: text('kind', { enum: ['playlist', 'liked'] }).notNull(),
    playlistId: text('playlist_id'),
    name: text('name').notNull(),
    imageUrl: text('image_url'),
    snapshot: jsonb('snapshot').$type<TrackSnapshot[]>(),
    snapshotAt: timestamp('snapshot_at', { withTimezone: true }),
    /** Lookups still pending from the last analysis (BPM/key, years, tags). */
    pending: jsonb('pending').$type<Record<string, number>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('sources_user_idx').on(t.userId)],
);

/** Smart playlists: a rule over one or more sources, kept in sync with a Spotify playlist. */
export const smartPlaylists = pgTable(
  'smart_playlists',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    sourceIds: jsonb('source_ids').$type<string[]>().notNull(),
    name: text('name').notNull(),
    rule: jsonb('rule').$type<Rule>().notNull(),
    order: jsonb('order').$type<OrderSpec>().notNull(),
    sync: jsonb('sync').$type<Partial<SyncSettings>>().notNull().default({}),
    include: jsonb('include').$type<string[]>().notNull().default([]),
    exclude: jsonb('exclude').$type<string[]>().notNull().default([]),
    pinned: jsonb('pinned').$type<Record<string, number>>().notNull().default({}),
    spotifyPlaylistId: text('spotify_playlist_id'),
    managedTrackIds: jsonb('managed_track_ids').$type<string[]>().notNull().default([]),
    trackCount: integer('track_count'),
    paused: boolean('paused').notNull().default(false),
    lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
    lastAddedCount: integer('last_added_count'),
    lastError: text('last_error'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('smart_playlists_user_idx').on(t.userId)],
);

export interface RunPlaylistResult {
  smartPlaylistId?: string;
  playlistId: string | null;
  name: string;
  added: number;
  removed: number;
  /** Songs the user deleted in Spotify, now kept out. */
  keptOut?: number;
  created?: boolean;
  error?: string;
}

/** Every sync, save and restore, with what's needed to undo it (kept 30 days). */
export const syncRuns = pgTable(
  'sync_runs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    kind: text('kind', { enum: ['daily', 'manual', 'create', 'sort', 'restore', 'edit'] }).notNull(),
    status: text('status', { enum: ['running', 'ok', 'partial', 'error'] }).notNull().default('running'),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
    summary: text('summary'),
    results: jsonb('results').$type<RunPlaylistResult[]>().notNull().default([]),
    unmatched: integer('unmatched'),
    /** Spotify playlist id → its order before this run. */
    restore: jsonb('restore').$type<Record<string, string[]>>().notNull().default({}),
    /** Playlists this run created (undo deletes them). */
    createdPlaylistIds: jsonb('created_playlist_ids').$type<string[]>().notNull().default([]),
    undoneAt: timestamp('undone_at', { withTimezone: true }),
    error: text('error'),
  },
  (t) => [index('sync_runs_user_idx').on(t.userId, t.startedAt)],
);

/** Lookup cache for the engine (artist genres, audio features, years, tags), with expiry. */
export const cacheEntries = pgTable(
  'cache_entries',
  {
    namespace: text('namespace').notNull(),
    key: text('key').notNull(),
    value: jsonb('value'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.namespace, t.key] }), index('cache_expires_idx').on(t.expiresAt)],
);

/** Instance settings: generated secrets, sync time, last cron run. */
export const appSettings = pgTable('app_settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Source = typeof sources.$inferSelect;
export type SmartPlaylist = typeof smartPlaylists.$inferSelect;
export type SyncRun = typeof syncRuns.$inferSelect;
export type { SourceRef };
