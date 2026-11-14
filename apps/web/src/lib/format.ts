/** "just now", "6m ago", "6h ago", "3d ago", or a date. */
export function timeAgo(date: Date | string | null | undefined): string {
  if (!date) return 'never';
  const d = typeof date === 'string' ? new Date(date) : date;
  const s = Math.round((Date.now() - d.getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86_400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 7 * 86_400) return `${Math.floor(s / 86_400)}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function count(n: number, word: string, plural = `${word}s`): string {
  return `${n.toLocaleString('en-US')} ${n === 1 ? word : plural}`;
}

export function duration(ms: number): string {
  const totalMin = Math.round(ms / 60_000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h ? `${h} hr ${m} min` : `${m} min`;
}

export function trackTime(ms: number): string {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Cover gradient for a smart playlist, from the design's palette, picked by name. */
const COVERS: Array<[RegExp, [string, string]]> = [
  [/90s country/i, ['#B45309', '#451A03']],
  [/country/i, ['#F59E0B', '#7C2D12']],
  [/clean rap/i, ['#38BDF8', '#1E3A8A']],
  [/rap|hip/i, ['#0284C7', '#0C1E3E']],
  [/worship/i, ['#FDE68A', '#B45309']],
  [/workout|running/i, ['#F97316', '#7F1D1D']],
  [/happy/i, ['#FBBF24', '#F472B6']],
  [/love/i, ['#F472B6', '#831843']],
  [/sad/i, ['#818CF8', '#312E81']],
  [/harmonic/i, ['#8B5CF6', '#1E1B4B']],
  [/rock/i, ['#EF4444', '#450A0A']],
  [/r&b/i, ['#A78BFA', '#2E1065']],
  [/pop/i, ['#F472B6', '#7C2D12']],
  [/chill/i, ['#38BDF8', '#0F172A']],
  [/new|month|recent/i, ['#2DD4BF', '#134E4A']],
];

export function coverGradient(name: string): string {
  const [from, to] = COVERS.find(([re]) => re.test(name))?.[1] ?? ['#8B5CF6', '#1E1B4B'];
  return `linear-gradient(145deg, ${from}, ${to})`;
}

/** CSS background for a playlist tile: its Spotify cover when known, else AutoSort's gradient. */
export function coverBackground(name: string, imageUrl?: string | null): string {
  return imageUrl ? `center / cover no-repeat url("${imageUrl.replace(/"/g, '%22')}"), ${coverGradient(name)}` : coverGradient(name);
}
