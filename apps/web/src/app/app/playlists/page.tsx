import { RECIPES, ruleChips } from '@autosort/core';
import type { Metadata } from 'next';
import Link from 'next/link';
import { AskPlaylist } from '@/components/editor/ask-playlist';
import { NewCoversButton } from '@/components/editor/new-covers-button';
import { SmartPlaylistCard } from '@/components/editor/playlist-card';
import { ChevronDownIcon } from '@/components/icons';
import { buttonClass } from '@/components/ui';
import { userSmartPlaylists, userSources } from '@/lib/queries';
import { aiCoversEnabled } from '@/lib/covers';
import { requireUser } from '@/lib/session';
import { editorSources } from './load';

export const metadata: Metadata = { title: 'Smart playlists' };

export default async function PlaylistsPage() {
  const user = await requireUser();
  const [playlists, sources, askSources] = await Promise.all([userSmartPlaylists(user.id), userSources(user.id), editorSources(user.id)]);
  const sourceName = new Map(sources.map((s) => [s.id, s.name]));
  const starter = sources.find((s) => s.snapshot) ?? sources[0];

  return (
    <div className="flex flex-col">
      <header className="flex flex-wrap items-end justify-between gap-6 px-6 pb-7 pt-8 sm:px-8 sm:pt-12" style={{ background: 'linear-gradient(180deg, #221B33 0px, #141416 100%)' }}>
        <div className="flex max-w-[640px] flex-col gap-2.5">
          <h1 className="m-0 text-[30px] font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-[44px] sm:tracking-[-0.035em]">Smart playlists</h1>
          <p className="m-0 text-[15px] leading-[1.55] text-text-2 sm:text-[16px]">
            Each one is a set of rules over your sources. AutoSort keeps them filled and in order in Spotify every day.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <details className="group relative">
            <summary className={buttonClass('secondary', 'sm')}>
              Start from a recipe
              <ChevronDownIcon size={16} className="transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <ul className="absolute left-0 top-full z-30 m-0 mt-2 flex max-h-[min(70dvh,480px)] w-[min(90vw,360px)] list-none flex-col gap-0.5 overflow-y-auto rounded-card bg-surface-3 p-1.5 shadow-e3 sm:left-auto sm:right-0">
              {RECIPES.map((r) => (
                <li key={r.slug}>
                  <Link href={`/app/playlists/new?recipe=${r.slug}`} className="flex flex-col gap-1 rounded-sm px-3 py-2.5 text-text-1 no-underline hover:bg-[#3A3A40] hover:text-text-1">
                    <span className="text-[14px] font-bold">{r.name}</span>
                    <span className="text-[13px] leading-[1.45] text-text-2">{r.description}</span>
                    <span className="text-[12px] text-text-3">{ruleChips(r.rule).join(' · ') || 'Every song'}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </details>
          <Link href="/app/playlists/new" className={buttonClass('primary', 'sm')}>
            New smart playlist
          </Link>
        </div>
      </header>

      <div className="flex flex-col gap-6 px-6 pb-8 sm:px-8">
        <AskPlaylist sources={askSources} />
        {playlists.some((p) => p.spotifyPlaylistId) ? (
          <NewCoversButton count={playlists.filter((p) => p.spotifyPlaylistId).length} photos={aiCoversEnabled()} />
        ) : null}
        {playlists.length === 0 ? (
          <div className="flex flex-col items-start gap-3 rounded-card bg-surface-2 p-6">
            <h2 className="m-0 text-[18px] font-bold">No smart playlists yet</h2>
            <p className="m-0 max-w-[600px] text-[15px] leading-[1.6] text-text-2">
              {starter
                ? `The quickest start: let AutoSort look through ${starter.name} and suggest a few.`
                : 'Pick a source first (one of your playlists, or Liked Songs). Then AutoSort can suggest smart playlists from it.'}
            </p>
            {starter ? (
              <Link href={`/app/sources/${starter.id}/suggestions`} className={buttonClass('primary', 'sm')}>
                See suggestions
              </Link>
            ) : (
              <Link href="/app/sources" className={buttonClass('primary', 'sm')}>
                Pick a source
              </Link>
            )}
          </div>
        ) : (
          <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] sm:gap-6">
            {playlists.map((p) => (
              <SmartPlaylistCard
                key={p.id}
                playlist={p}
                sourceNames={p.sourceIds
                  .map((id) => sourceName.get(id))
                  .filter(Boolean)
                  .join(', ')}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
