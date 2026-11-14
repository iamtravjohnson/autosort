import 'server-only';
import { suggestPlaylists, type TrackFacts } from '@autosort/core';
import { db, schema } from '@/db';
import type { SmartPlaylist, Source } from '@/db/schema';

/**
 * The playlists Autopilot would create for a source right now (nothing saved yet). Sizes scale
 * with the library (see `suggestionSizes` in the engine), near-duplicates are skipped, and the
 * list is capped, so it creates what's worth having without flooding Spotify.
 */
export function autopilotPicks(source: Pick<Source, 'autopilot' | 'dismissedRules'>, facts: readonly TrackFacts[], existing: readonly Pick<SmartPlaylist, 'rule'>[]) {
  if (!source.autopilot || facts.length === 0) return [];
  const dismissed = new Set(source.dismissedRules ?? []);
  return suggestPlaylists(facts, { existingRules: existing.map((p) => p.rule) }).filter((s) => !dismissed.has(s.key));
}

/** Save Autopilot's picks as smart playlists for the source. Returns the new rows (not yet in Spotify). */
export async function saveAutopilotPicks(userId: string, source: Pick<Source, 'id' | 'autopilot' | 'dismissedRules'>, facts: readonly TrackFacts[], existing: readonly Pick<SmartPlaylist, 'rule'>[]) {
  const picks = autopilotPicks(source, facts, existing);
  if (picks.length === 0) return [];
  return db()
    .insert(schema.smartPlaylists)
    .values(picks.map((p) => ({ userId, sourceIds: [source.id], name: p.name, rule: p.rule, order: p.order, sync: {} })))
    .returning();
}
