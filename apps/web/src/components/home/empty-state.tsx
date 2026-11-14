import { ButtonLink } from '@/components/ui';
import { MusicGlyph } from './glyphs';

/** AppStates "No playlists yet": nothing to organize until a source is picked. */
export function NoSourcesYet() {
  return (
    <section aria-labelledby="empty" className="flex flex-col items-center justify-center gap-4 rounded-panel bg-surface-2/60 px-4 py-12 text-center sm:px-8 sm:py-16">
      <span className="flex size-[88px] items-center justify-center rounded-pill bg-surface-2 text-text-3">
        <MusicGlyph size={36} />
      </span>
      <h2 id="empty" className="m-0 text-[22px] font-extrabold tracking-[-0.02em]">
        No playlists yet
      </h2>
      <p className="m-0 max-w-[340px] text-[15px] leading-[1.5] text-text-2">
        Pick the playlist you always add to, or your Liked Songs. AutoSort reads it and suggests smart playlists. It never changes that playlist.
      </p>
      <ButtonLink href="/app/sources/new" className="h-auto! min-h-12 py-3 text-center whitespace-normal!">
        Pick the playlist you always add to
      </ButtonLink>
      <a href="https://open.spotify.com" target="_blank" rel="noopener noreferrer" className="text-[14px] font-bold">
        Open Spotify ↗
      </a>
    </section>
  );
}
