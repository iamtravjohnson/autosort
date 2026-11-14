import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { syncEveryone } from '@/lib/sync';

export const maxDuration = 300;

/**
 * The daily sync, called by Vercel Cron (see vercel.json). If CRON_SECRET is set, Vercel sends it
 * as a Bearer token and it's required. Without it, the job still runs but at most every 30 minutes,
 * so a stray request can't hammer Spotify.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    if (request.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  } else {
    const [last] = await db().select().from(schema.appSettings).where(eq(schema.appSettings.key, 'last_cron_at'));
    if (last && Date.now() - Date.parse(String(last.value)) < 30 * 60_000) return NextResponse.json({ skipped: 'ran recently' });
  }
  const result = await syncEveryone();
  return NextResponse.json(result);
}
