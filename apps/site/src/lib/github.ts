import { cacheLife } from 'next/cache';
import { site } from './site';

export interface RepoStats {
  stars: number | null;
  forks: number | null;
  contributors: number | null;
}

/** Public repo stats, cached for a few hours. Returns nulls if GitHub can't be reached. */
export async function getRepoStats(): Promise<RepoStats> {
  'use cache';
  cacheLife('hours');
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'autosort.app' };
  try {
    const [repo, contributors] = await Promise.all([
      fetch(`https://api.github.com/repos/${site.githubRepo}`, { headers }),
      fetch(`https://api.github.com/repos/${site.githubRepo}/contributors?per_page=100&anon=0`, { headers }),
    ]);
    const data = repo.ok ? ((await repo.json()) as { stargazers_count?: number; forks_count?: number }) : null;
    const people = contributors.ok ? ((await contributors.json()) as unknown[]) : null;
    return {
      stars: data?.stargazers_count ?? null,
      forks: data?.forks_count ?? null,
      contributors: Array.isArray(people) ? people.length : null,
    };
  } catch {
    return { stars: null, forks: null, contributors: null };
  }
}

export function formatCount(n: number | null): string {
  if (n === null) return '—';
  return n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k` : String(n);
}
