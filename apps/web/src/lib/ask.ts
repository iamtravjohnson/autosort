/**
 * "Ask for a playlist": turn a plain request ("90s country love songs", "clean rap for the gym",
 * "songs by Chris Stapleton") into an AutoSort rule. A small word-matching parser, so it runs in the
 * browser for a live preview and never sends anything (including Spotify data) to an AI model.
 */
import type { Condition, GenreBucket, Mood, Rule, Theme } from '@autosort/core';

const GENRE_WORDS: Array<[RegExp, GenreBucket]> = [
  [/\b(hip[- ]?hop|rap|rapper|trap)\b/, 'hip-hop'],
  [/\b(country|americana|bluegrass|honky[- ]tonk)\b/, 'country'],
  [/\b(worship|christian|gospel|praise|church|ccm|hymns?)\b/, 'worship'],
  [/(\br&b\b|\brnb\b|\br and b\b|\bsoul\b|\bmotown\b)/, 'r&b'],
  [/\b(metal)\b/, 'metal'],
  [/\b(rock|punk|grunge|alt[- ]rock|alternative)\b/, 'rock'],
  [/\b(edm|electronic|techno|house music|trance|dubstep)\b/, 'electronic'],
  [/\b(latin|reggaeton|spanish|bachata|salsa)\b/, 'latin'],
  [/\b(jazz)\b/, 'jazz'],
  [/\b(classical|orchestral|symphony)\b/, 'classical'],
  [/\b(folk|singer[- ]songwriter)\b/, 'folk'],
  [/\b(reggae)\b/, 'reggae'],
  [/\b(blues)\b/, 'blues'],
  [/\b(pop)\b/, 'pop'],
  [/\b(indie)\b/, 'indie'],
  [/\b(soundtracks?|movie|disney|musicals?|broadway)\b/, 'soundtrack'],
];

const MOOD_WORDS: Array<[RegExp, Mood]> = [
  [/\b(happy|upbeat|feel[- ]good|cheerful|sunny|good vibes)\b/, 'happy'],
  [/\b(sad|melancholy|melancholic|crying|depressing)\b/, 'sad'],
  [/\b(chill|chilled|relax|relaxing|mellow|calm|lo[- ]?fi|sleep|sleepy)\b/, 'chill'],
  [/\b(energetic|high[- ]energy|hype|pump(ed)?|amped)\b/, 'energetic'],
  [/\b(party|dance|dancing|club)\b/, 'party'],
  [/\b(workout|work out|gym|running|run|lifting|exercise|cardio)\b/, 'workout'],
  [/\b(study|studying|focus|concentrat\w*)\b/, 'focus'],
];

const THEME_WORDS: Array<[RegExp, Theme]> = [
  [/\b(love|romantic|romance|wedding|date night)\b/, 'love'],
  [/\b(break[- ]?ups?|heartbreak|heartbroken|exes?)\b/, 'breakup'],
  [/\b(christmas|xmas|holiday|holidays)\b/, 'christmas'],
];

const DECADE_WORDS: Record<string, number> = { sixties: 1960, seventies: 1970, eighties: 1980, nineties: 1990 };

export interface AskResult {
  /** A playlist name from the request, title-cased. */
  name: string;
  rule: Rule | null;
}

const SMALL = new Set(['a', 'an', 'and', 'by', 'for', 'from', 'in', 'of', 'on', 'or', 'the', 'to', 'with']);
const titleCase = (s: string) =>
  s
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((w, i) => (i > 0 && SMALL.has(w.toLowerCase()) ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ')
    .replace(/\bR&b\b/gi, 'R&B')
    .replace(/\bbpm\b/gi, 'BPM')
    .slice(0, 60);

/** Build a rule from a request. `artists` are the names in the user's library, for "songs by …". */
export function ruleFromRequest(text: string, artists: readonly string[]): AskResult {
  const raw = text.trim();
  const q = ` ${raw.toLowerCase()} `;
  const conditions: Condition[] = [];

  const genres = GENRE_WORDS.filter(([re]) => re.test(q)).map(([, g]) => g);
  if (genres.length) conditions.push({ field: 'genre', in: [...new Set(genres)] });

  // Decades: "90s", "1990s", "80's", "2010s", "nineties".
  const decades = new Set<number>();
  for (const m of q.matchAll(/\b(19|20)?(\d)0'?s\b/g)) {
    const century = m[1] ? Number(m[1]) * 100 : Number(m[2]) <= 2 ? 2000 : 1900;
    decades.add(century + Number(m[2]) * 10);
  }
  for (const [word, decade] of Object.entries(DECADE_WORDS)) if (q.includes(word)) decades.add(decade);
  if (decades.size) conditions.push({ field: 'decade', in: [...decades].sort() });

  // Years: "since 2015", "after 2015", "before 2000", "2015-2020".
  const range = /\b((?:19|20)\d\d)\s*(?:-|–|to)\s*((?:19|20)\d\d)\b/.exec(q);
  const since = /\b(?:since|after|from)\s+((?:19|20)\d\d)\b/.exec(q);
  const before = /\b(?:before|until|pre)\s+((?:19|20)\d\d)\b/.exec(q);
  if (range) conditions.push({ field: 'year', min: Number(range[1]), max: Number(range[2]) });
  else if (since || before) conditions.push({ field: 'year', ...(since ? { min: Number(since[1]) } : {}), ...(before ? { max: Number(before[1]) - 1 } : {}) });

  const moods = MOOD_WORDS.filter(([re]) => re.test(q)).map(([, m]) => m);
  if (moods.length) conditions.push({ field: 'mood', in: [...new Set(moods)] });

  const themes = THEME_WORDS.filter(([re]) => re.test(q)).map(([, t]) => t);
  if (themes.length) conditions.push({ field: 'theme', in: [...new Set(themes)] });

  if (/\b(clean|no explicit|non[- ]explicit|kid[- ]friendly|family[- ]friendly|for (the )?kids)\b/.test(q)) conditions.push({ field: 'explicit', is: false });
  else if (/\b(explicit|dirty|uncensored)\b/.test(q)) conditions.push({ field: 'explicit', is: true });

  // Tempo: "under 100 bpm", "over 120 bpm", "120 bpm", "slow", "fast".
  const under = /\b(?:under|below|less than|slower than)\s+(\d{2,3})\s*bpm\b/.exec(q);
  const over = /\b(?:over|above|more than|faster than)\s+(\d{2,3})\s*bpm\b/.exec(q);
  const exact = !under && !over ? /\b(\d{2,3})\s*bpm\b/.exec(q) : null;
  if (under || over) conditions.push({ field: 'bpm', ...(over ? { min: Number(over[1]) } : {}), ...(under ? { max: Number(under[1]) } : {}) });
  else if (exact) conditions.push({ field: 'bpm', min: Number(exact[1]) - 5, max: Number(exact[1]) + 5 });
  else if (/\b(slow|slower|ballads?|low[- ]energy|quiet|soft)\b/.test(q)) conditions.push({ field: 'energy', max: 0.45 });
  else if (/\b(fast|faster|uptempo|up[- ]tempo)\b/.test(q)) conditions.push({ field: 'bpm', min: 120 });

  if (/\b(acoustic|unplugged)\b/.test(q)) conditions.push({ field: 'acousticness', min: 0.6 });

  // Recently added: "new", "recent", "latest", "added this year".
  if (/\badded this year\b/.test(q)) conditions.push({ field: 'addedAt', after: `${new Date().getFullYear()}-01-01T00:00:00Z` });
  else if (/\b(recent|recently added|latest|newest|new songs|new adds?)\b/.test(q)) conditions.push({ field: 'addedAt', after: new Date(Date.now() - 90 * 86_400_000).toISOString() });

  // Artists from the library named in the request (longest names first, so "Florida Georgia Line" beats "Florida").
  const named: string[] = [];
  let rest = q;
  for (const a of [...new Set(artists)].filter((a) => a.length >= 3).sort((x, y) => y.length - x.length)) {
    const needle = a.toLowerCase();
    const at = rest.indexOf(needle);
    if (at === -1) continue;
    const before = rest[at - 1] ?? ' ';
    const after = rest[at + needle.length] ?? ' ';
    if (/[a-z0-9]/.test(before) || /[a-z0-9]/.test(after)) continue;
    named.push(a);
    rest = rest.slice(0, at) + ' '.repeat(needle.length) + rest.slice(at + needle.length);
  }
  if (named.length) conditions.push({ field: 'artist', in: named });

  return { name: titleCase(raw) || 'My playlist', rule: conditions.length ? { match: 'all', conditions } : null };
}
