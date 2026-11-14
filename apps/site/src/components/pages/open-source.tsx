import { cacheLife } from 'next/cache';
import { VERSION } from '@autosort/core';
import { formatCount, getRepoStats } from '@/lib/github';
import { site } from '@/lib/site';

const STAT = 'flex flex-col rounded-card bg-surface-2 p-4';
const NUM = 'block text-[26px] font-extrabold';
const LABEL = 'text-[13px] text-text-2';

/** Stars / forks / contributors (live from GitHub) + latest engine version (npm). */
export async function RepoStatsGrid() {
  const { stars, forks, contributors } = await getRepoStats();
  return <StatsGrid stars={formatCount(stars)} forks={formatCount(forks)} contributors={formatCount(contributors)} />;
}

export function StatsGrid({ stars = '—', forks = '—', contributors = '—' }: { stars?: string; forks?: string; contributors?: string }) {
  return (
    <dl className="tnum m-0 grid flex-[0_1_300px] grid-cols-2 gap-2.5">
      <div className={STAT}>
        <dt className={`${LABEL} order-2`}>stars</dt>
        <dd className={`${NUM} order-1 m-0`}>{stars}</dd>
      </div>
      <div className={STAT}>
        <dt className={`${LABEL} order-2`}>forks</dt>
        <dd className={`${NUM} order-1 m-0`}>{forks}</dd>
      </div>
      <div className={STAT}>
        <dt className={`${LABEL} order-2`}>contributors</dt>
        <dd className={`${NUM} order-1 m-0`}>{contributors}</dd>
      </div>
      <div className={STAT}>
        <dt className={`${LABEL} order-2`}>
          <a href={site.npm} target="_blank" rel="noopener noreferrer">
            latest engine on npm ↗
          </a>
        </dt>
        <dd className={`${NUM} order-1 m-0`}>v{VERSION}</dd>
      </div>
    </dl>
  );
}

interface Contributor {
  login: string;
  url: string;
  contributions: number;
}

/** Public contributors list, cached for a few hours. Null if GitHub can't be reached. */
async function getContributors(): Promise<Contributor[] | null> {
  'use cache';
  cacheLife('hours');
  try {
    const res = await fetch(`https://api.github.com/repos/${site.githubRepo}/contributors?per_page=100`, {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'autosort.app' },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ login?: string; html_url?: string; contributions?: number; type?: string }>;
    if (!Array.isArray(data)) return null;
    return data.flatMap((d) =>
      d.login && d.type !== 'Bot' ? [{ login: d.login, url: d.html_url ?? `https://github.com/${d.login}`, contributions: d.contributions ?? 0 }] : [],
    );
  } catch {
    return null;
  }
}

const AVATAR_BG = ['#3A2F4A', '#2F3B4A', '#4A3B2A', '#2F4A40', '#4A302F', '#4A4530', '#3A3A40'];

function Avatar({ login, url, i }: { login: string; url: string; i: number }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title={login}
      aria-label={`${login} on GitHub`}
      className="flex size-[52px] items-center justify-center rounded-pill text-[18px] font-extrabold uppercase text-text-1 no-underline ring-accent hover:text-text-1 hover:ring-2"
      style={{ background: AVATAR_BG[i % AVATAR_BG.length] }}
    >
      {login.charAt(0)}
    </a>
  );
}

/**
 * Contributors as initials avatars (no third-party image requests). Falls back to the
 * founder when GitHub can't be reached.
 */
export async function ContributorList() {
  const people = await getContributors();
  const list = people && people.length > 0 ? people : [{ login: 'iamtravjohnson', url: 'https://github.com/iamtravjohnson', contributions: 0 }];
  return (
    <ul className="m-0 flex list-none flex-wrap gap-3 p-0">
      {list.map((p, i) => (
        <li key={p.login}>
          <Avatar login={p.login} url={p.url} i={i} />
        </li>
      ))}
    </ul>
  );
}

export function ContributorListFallback() {
  return (
    <div className="flex flex-wrap gap-3" aria-hidden="true">
      {AVATAR_BG.map((bg, i) => (
        <span key={i} className="size-[52px] rounded-pill" style={{ background: bg }} />
      ))}
    </div>
  );
}

/** Pink outline heart from the board (Sponsor). */
export function SponsorHeart({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#F472B6" strokeWidth={2} strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
    </svg>
  );
}
