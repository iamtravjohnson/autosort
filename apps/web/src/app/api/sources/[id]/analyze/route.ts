import { z } from 'zod';
import { getSource } from '@/lib/queries';
import { currentUser } from '@/lib/session';
import { spotifyFor } from '@/lib/spotify';
import { friendlyError } from '@/lib/stats';
import { analyzeSource, type AnalyzeEvent } from '@/lib/sync';

export const maxDuration = 300;

/**
 * Analyze a source and stream progress as newline-delimited JSON, one event per line, so the page
 * can show real counts. One request is one round; the page calls again while genre lookups remain.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return Response.json({ error: 'Sign in again.' }, { status: 401 });
  const id = z.uuid().safeParse((await params).id);
  const source = id.success ? await getSource(user.id, id.data) : null;
  if (!source) return Response.json({ error: "We couldn't find that source." }, { status: 404 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (e: AnalyzeEvent | { type: 'error'; message: string; reconnect?: boolean }) => controller.enqueue(encoder.encode(`${JSON.stringify(e)}\n`));
      try {
        // Pages render per request, so the page just refreshes when it's done.
        await analyzeSource(await spotifyFor(user.id), source, { interactive: true, onEvent: send });
      } catch (err) {
        console.error('analyze stream failed', err);
        const e = friendlyError(err);
        send({ type: 'error', message: e.message ?? 'Something went wrong. Try again.', ...(e.reconnect ? { reconnect: true } : {}) });
      }
      controller.close();
    },
  });
  return new Response(stream, {
    headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store, no-transform', 'X-Accel-Buffering': 'no' },
  });
}
