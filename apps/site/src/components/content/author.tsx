import { site } from '@/lib/site';

const initials = site.founder.name
  .split(/\s+/)
  .map((w) => w[0])
  .join('')
  .slice(0, 2)
  .toUpperCase();

/** Violet initials avatar standing in for the founder photo. */
export function AuthorAvatar({ size = 48 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-pill bg-accent font-extrabold text-bg"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
    >
      {initials}
    </span>
  );
}

/** "About the author" box at the end of a guide. */
export function AuthorBox() {
  const host = new URL(site.founder.url).host;
  return (
    <div className="flex gap-4 rounded-panel border border-line bg-surface-1 p-5">
      <AuthorAvatar size={64} />
      <div className="flex min-w-0 flex-col gap-1.5">
        <span className="text-[12px] font-bold uppercase tracking-[0.06em] text-text-3">About the author</span>
        <span className="text-[17px] font-extrabold">{site.founder.name}</span>
        <p className="m-0 text-[14px] leading-[1.55] text-text-2">
          {site.founder.name.split(' ')[0]} built AutoSort to keep his family&apos;s playlists in order without changing how anyone
          saves songs. It&apos;s free and open source.
        </p>
        <span className="flex flex-wrap gap-x-4 gap-y-1">
          <a href={site.founder.url} target="_blank" rel="noopener noreferrer author" className="text-[14px] font-bold">
            {host} ↗
          </a>
          <a href={site.founder.twitterUrl} target="_blank" rel="noopener noreferrer me" className="text-[14px] font-bold">
            {site.founder.twitter} ↗
          </a>
        </span>
      </div>
    </div>
  );
}
