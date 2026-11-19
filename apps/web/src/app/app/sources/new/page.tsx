import type { PlaylistSummary } from '@autosort/core';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { type PickerOption, SourcePicker } from '@/components/home/source-picker';
import { SpotifyLogo } from '@/components/ui';
import type { Source, User } from '@/db/schema';
import { userSmartPlaylists, userSources } from '@/lib/queries';
import { requireUser } from '@/lib/session';
import { listMyPlaylists } from '@/lib/spotify';
import { friendlyError } from '@/lib/stats';
import { SPOTIFY_NAME_SUFFIX } from '@/lib/sync';
import { withBase } from '@/lib/base-path';

export const metadata: Metadata = { title: 'Add a source · AutoSort' };

const ART = ['#4A3B2A', '#2F3B4A', '#3A2F4A', '#4A4530', '#2F4A40', '#4A302F', '#3E2F4A'];

async function PickerList({ user, sources }: { user: User; sources: Source[] }) {
  let lists: PlaylistSummary[];
  try {
    lists = await listMyPlaylists(user.id);
  } catch (err) {
    const e = friendlyError(err);
    return (
      <p role="alert" className="m-0 rounded-card bg-error/[0.14] px-4 py-3.5 text-[14px] text-error-text">
        We couldn&apos;t load your playlists. {e.message}{' '}
        {e.reconnect ? (
          <a href={withBase('/api/auth/login')} className="font-bold text-current underline">
            Reconnect Spotify
          </a>
        ) : null}
      </p>
    );
  }
  const smart = await userSmartPlaylists(user.id);
  const autosortIds = new Set(smart.map((p) => p.spotifyPlaylistId));
  const liked = sources.find((s) => s.kind === 'liked');
  const usable = lists.filter((p) => (p.ownerId === user.spotifyId || p.collaborative) && !autosortIds.has(p.id) && !p.name.endsWith(SPOTIFY_NAME_SUFFIX));
  // Biggest first: the playlist someone always adds to is usually their largest.
  usable.sort((a, b) => (b.itemCount ?? 0) - (a.itemCount ?? 0));

  const options: PickerOption[] = [
    {
      value: 'liked',
      name: 'Liked Songs',
      meta: 'Every song you’ve hearted in Spotify',
      songs: null,
      imageUrl: null,
      art: 'linear-gradient(135deg, #8B5CF6, #241A3D)',
      existingId: liked?.id ?? null,
    },
    ...usable.map((p, i) => ({
      value: `playlist:${p.id}`,
      name: p.name,
      meta: `${p.ownerId === user.spotifyId && !p.collaborative ? 'Yours' : 'Collaborative'}${p.itemCount === null ? '' : ` · ${p.itemCount.toLocaleString('en-US')} ${p.itemCount === 1 ? 'song' : 'songs'}`}`,
      songs: p.itemCount,
      imageUrl: p.imageUrl,
      art: ART[i % ART.length]!,
      existingId: sources.find((s) => s.kind === 'playlist' && s.playlistId === p.id)?.id ?? null,
    })),
  ];
  const followed = lists.length - usable.length;

  return (
    <div className="flex flex-col gap-4">
      <SourcePicker options={options} />
      {followed > 0 ? (
        <p className="m-0 text-[13px] text-text-3">
          Playlists you follow but don&apos;t own aren&apos;t listed: Spotify only lets apps read playlists you own or collaborate on.
        </p>
      ) : null}
    </div>
  );
}

function PickerSkeleton() {
  return (
    <div aria-busy="true" className="grid grid-cols-1 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
      {[70, 55, 80, 62, 74, 50].map((w) => (
        <div key={w} className="flex items-center gap-3.5 rounded-card bg-surface-2 p-2.5">
          <span className="size-14 shrink-0 rounded-art bg-surface-3" />
          <span className="flex flex-1 flex-col gap-1.5">
            <span className="h-3 rounded-art bg-surface-3" style={{ width: `${w}%` }} />
            <span className="h-2.5 w-2/5 rounded-art bg-[#202024]" />
          </span>
        </div>
      ))}
      <span className="sr-only">Loading your playlists…</span>
    </div>
  );
}

export default async function NewSourcePage() {
  const user = await requireUser();
  const sources = await userSources(user.id);
  return (
    <div className="flex min-h-full flex-col gap-6 p-6 sm:p-8" style={{ background: 'linear-gradient(180deg, #1F1A2E 0px, #141416 320px)' }}>
      <div className="flex flex-col gap-2">
        <nav aria-label="Breadcrumb" className="flex gap-2 text-[13px] text-text-2">
          <Link href="/app/sources" className="text-text-2 no-underline hover:text-text-1">
            Sources
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-text-1" aria-current="page">
            Add a source
          </span>
        </nav>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="m-0 max-w-[720px] text-[30px] font-extrabold leading-[1.1] tracking-[-0.03em] sm:text-[44px] sm:tracking-[-0.035em]">
            Pick the playlist you always add to
          </h1>
          <SpotifyLogo width={78} />
        </div>
        <p className="m-0 max-w-[640px] text-[15px] leading-[1.5] text-text-2">
          AutoSort reads it, looks up genres, tempo, key and mood, then suggests smart playlists. It never changes this playlist.
        </p>
      </div>
      <Suspense fallback={<PickerSkeleton />}>
        <PickerList user={user} sources={sources} />
      </Suspense>
    </div>
  );
}
