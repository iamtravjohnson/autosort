import 'server-only';
import { missingScopes, SPOTIFY_ALL_SCOPES } from '@autosort/core';
import { and, asc, desc, eq, gt, isNull, ne, sql } from 'drizzle-orm';
import { db, schema } from '@/db';
import vercelConfig from '../../vercel.json';
import { DOCS_URL, spotifyCredentials } from './config';

/** Invite links work once and expire after this many days. */
export const INVITE_DAYS = 7;
const DAY = 86_400_000;

export const SPOTIFY_DASHBOARD_URL = 'https://developer.spotify.com/dashboard';
/** Where people remove AutoSort's access from their own Spotify account. */
export const SPOTIFY_MANAGE_APPS_URL = 'https://www.spotify.com/account/apps/';

/** A page on the docs site, e.g. docsUrl('troubleshooting'). */
export function docsUrl(slug: string): string {
  return new URL(`/docs/${slug}`, DOCS_URL).toString();
}

/** The User Management tab of this instance's Spotify app (falls back to the dashboard). */
export function userManagementUrl(): string {
  const creds = spotifyCredentials();
  return creds ? `${SPOTIFY_DASHBOARD_URL}/${encodeURIComponent(creds.clientId)}/users` : SPOTIFY_DASHBOARD_URL;
}

export type ConnectionState = 'connected' | 'reconnect' | 'missing';

/** Same rule as the app shell's reconnect banner: signed out, or missing permissions. */
export function connectionState(account: { status: 'connected' | 'reconnect'; scope: string } | null | undefined): ConnectionState {
  if (!account?.status) return 'missing';
  if (account.status === 'reconnect' || missingScopes(account.scope, SPOTIFY_ALL_SCOPES).length > 0) return 'reconnect';
  return 'connected';
}

export interface FamilyMember {
  id: string;
  name: string;
  role: 'owner' | 'member';
  createdAt: Date;
  connection: ConnectionState;
  smartPlaylists: number;
}

/** Everyone on this AutoSort, oldest first (the owner is normally first). */
export async function familyMembers(): Promise<FamilyMember[]> {
  const d = db();
  const [rows, counts] = await Promise.all([
    d
      .select({
        id: schema.users.id,
        displayName: schema.users.displayName,
        role: schema.users.role,
        createdAt: schema.users.createdAt,
        status: schema.spotifyAccounts.status,
        scope: schema.spotifyAccounts.scope,
      })
      .from(schema.users)
      .leftJoin(schema.spotifyAccounts, eq(schema.spotifyAccounts.userId, schema.users.id))
      .orderBy(asc(schema.users.createdAt)),
    d
      .select({ userId: schema.smartPlaylists.userId, n: sql<number>`count(*)::int` })
      .from(schema.smartPlaylists)
      .groupBy(schema.smartPlaylists.userId),
  ]);
  const byUser = new Map(counts.map((c) => [c.userId, c.n]));
  return rows
    .map((r) => ({
      id: r.id,
      name: r.displayName || 'Spotify user',
      role: r.role,
      createdAt: r.createdAt,
      connection: connectionState(r.status ? { status: r.status, scope: r.scope ?? '' } : null),
      smartPlaylists: byUser.get(r.id) ?? 0,
    }))
    .sort((a, b) => (a.role === b.role ? 0 : a.role === 'owner' ? -1 : 1));
}

export interface OpenInvite {
  token: string;
  name: string;
  email: string | null;
  createdAt: Date;
  expiresAt: Date;
  expired: boolean;
  /** "Invited 2d ago · expires in 5 days" style line. */
  meta: string;
}

function daysLeft(expiresAt: Date): number {
  return Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / DAY));
}

function ago(date: Date): string {
  const days = Math.floor((Date.now() - date.getTime()) / DAY);
  if (days <= 0) return 'today';
  return days === 1 ? 'yesterday' : `${days} days ago`;
}

/** Invites nobody has used yet, newest first (expired ones included so they can be cleared). */
export async function openInvites(): Promise<OpenInvite[]> {
  const rows = await db().select().from(schema.invites).where(isNull(schema.invites.usedBy)).orderBy(desc(schema.invites.createdAt));
  return rows.map((i) => {
    const expired = i.expiresAt.getTime() <= Date.now();
    const left = daysLeft(i.expiresAt);
    return {
      token: i.token,
      name: i.name,
      email: i.email,
      createdAt: i.createdAt,
      expiresAt: i.expiresAt,
      expired,
      meta: expired
        ? `Expired ${i.expiresAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        : `Invited ${ago(i.createdAt)} · expires in ${left === 1 ? '1 day' : `${left} days`}`,
    };
  });
}

/** People plus live invites: both take one of Spotify's spots. */
export async function spotsUsed(): Promise<{ people: number; pending: number; used: number }> {
  const d = db();
  const [[people], [pending]] = await Promise.all([
    d.select({ n: sql<number>`count(*)::int` }).from(schema.users),
    d
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.invites)
      .where(and(isNull(schema.invites.usedBy), gt(schema.invites.expiresAt, new Date()))),
  ]);
  const p = people?.n ?? 0;
  const q = pending?.n ?? 0;
  return { people: p, pending: q, used: p + q };
}

/** The owner's Spotify display name (null if there's no owner or no name). */
export async function ownerName(): Promise<string | null> {
  const [owner] = await db().select({ name: schema.users.displayName }).from(schema.users).where(eq(schema.users.role, 'owner')).limit(1);
  return owner?.name || null;
}

/** Who becomes owner if this user leaves: the longest-standing other member. */
export async function nextOwner(userId: string): Promise<{ id: string; name: string } | null> {
  const [next] = await db()
    .select({ id: schema.users.id, name: schema.users.displayName })
    .from(schema.users)
    .where(ne(schema.users.id, userId))
    .orderBy(asc(schema.users.createdAt))
    .limit(1);
  return next ? { id: next.id, name: next.name || 'Another member' } : null;
}

export type InviteLookup =
  | { state: 'valid'; name: string; email: string | null; inviter: string; expiresAt: Date }
  | { state: 'used' | 'expired'; inviter: string }
  | { state: 'missing' };

/** Look up an invite link for /join/[token]. */
export async function findInvite(token: string): Promise<InviteLookup> {
  if (!/^[A-Za-z0-9_-]{8,128}$/.test(token)) return { state: 'missing' };
  const [row] = await db()
    .select({ invite: schema.invites, inviter: schema.users.displayName })
    .from(schema.invites)
    .leftJoin(schema.users, eq(schema.users.id, schema.invites.createdBy))
    .where(eq(schema.invites.token, token));
  if (!row) return { state: 'missing' };
  const inviter = row.inviter || 'Your family';
  if (row.invite.usedBy) return { state: 'used', inviter };
  if (row.invite.expiresAt.getTime() <= Date.now()) return { state: 'expired', inviter };
  return { state: 'valid', name: row.invite.name, email: row.invite.email, inviter, expiresAt: row.invite.expiresAt };
}

/**
 * Delete everything AutoSort stored for one person: Spotify tokens, sources, smart playlists,
 * runs and the user row. If the owner leaves while others remain, the oldest member becomes
 * owner (and inherits the open invites). The invite they joined with is deleted too, so the
 * link can't be reused. Playlists in Spotify are left alone.
 */
export async function deleteUserEverywhere(userId: string): Promise<{ deleted: boolean; newOwnerId: string | null }> {
  return db().transaction(async (tx) => {
    const [user] = await tx.select({ role: schema.users.role }).from(schema.users).where(eq(schema.users.id, userId));
    if (!user) return { deleted: false, newOwnerId: null };
    let newOwnerId: string | null = null;
    if (user.role === 'owner') {
      const [next] = await tx
        .select({ id: schema.users.id })
        .from(schema.users)
        .where(ne(schema.users.id, userId))
        .orderBy(asc(schema.users.createdAt))
        .limit(1);
      if (next) {
        newOwnerId = next.id;
        await tx.update(schema.users).set({ role: 'owner' }).where(eq(schema.users.id, next.id));
        await tx
          .update(schema.invites)
          .set({ createdBy: next.id })
          .where(and(eq(schema.invites.createdBy, userId), isNull(schema.invites.usedBy)));
      }
    }
    await tx.delete(schema.invites).where(eq(schema.invites.usedBy, userId));
    await tx.delete(schema.syncRuns).where(eq(schema.syncRuns.userId, userId));
    await tx.delete(schema.smartPlaylists).where(eq(schema.smartPlaylists.userId, userId));
    await tx.delete(schema.sources).where(eq(schema.sources.userId, userId));
    await tx.delete(schema.spotifyAccounts).where(eq(schema.spotifyAccounts.userId, userId));
    await tx.delete(schema.users).where(eq(schema.users.id, userId));
    return { deleted: true, newOwnerId };
  });
}

export interface InstanceInfo {
  dbSize: string | null;
  lastCronAt: Date | null;
  deployment: string | null;
  onVercel: boolean;
  lastfm: boolean;
}

export async function instanceInfo(): Promise<InstanceInfo> {
  const d = db();
  let dbSize: string | null = null;
  try {
    const rows = await d.execute<{ size: string }>(sql`select pg_size_pretty(pg_database_size(current_database())) as size`);
    dbSize = rows[0]?.size ?? null;
  } catch {
    // Some hosts don't allow pg_database_size; the row just shows "Connected".
  }
  const [cron] = await d.select().from(schema.appSettings).where(eq(schema.appSettings.key, 'last_cron_at'));
  const last = cron ? new Date(String(cron.value)) : null;
  return {
    dbSize,
    lastCronAt: last && !Number.isNaN(last.getTime()) ? last : null,
    deployment: process.env.VERCEL_URL ?? null,
    onVercel: Boolean(process.env.VERCEL),
    lastfm: Boolean(process.env.LASTFM_API_KEY),
  };
}

/** The daily sync schedule, read from vercel.json so it stays right if someone edits it. */
export function dailySchedule(): { cron: string | null; utcHour: number | null; utcMinute: number | null; label: string } {
  const crons = (vercelConfig as { crons?: Array<{ path: string; schedule: string }> }).crons ?? [];
  const cron = crons.find((c) => c.path === '/api/sync')?.schedule ?? null;
  const m = cron ? /^(\d{1,2})\s+(\d{1,2})\s+\*\s+\*\s+\*$/.exec(cron.trim()) : null;
  if (!m) return { cron, utcHour: null, utcMinute: null, label: cron ? `On a custom schedule (${cron})` : 'Not scheduled' };
  const utcMinute = Number(m[1]);
  const utcHour = Number(m[2]);
  return { cron, utcHour, utcMinute, label: `Daily at ${String(utcHour).padStart(2, '0')}:${String(utcMinute).padStart(2, '0')} UTC` };
}
