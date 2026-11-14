// Measures the genre analyzer against songs with known genres (Billboard genre-chart number ones,
// from Wikipedia: see data/SOURCES.md). Nobody labels anything by hand.
//
//   pnpm --filter @autosort/core build
//   node --env-file=../../apps/web/.env.local eval/run.mjs        (needs SPOTIFY_CLIENT_ID/SECRET, LASTFM_API_KEY)
//
// Spotify and Last.fm lookups are cached in eval/.cache (git-ignored; Spotify data isn't published).
// Re-runs only re-classify, so tuning src/genre.ts and rebuilding takes seconds.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cleanTitle, enrichTracks, LastfmClient, toTrackRef } from '../dist/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = join(here, '.cache');
await mkdir(CACHE_DIR, { recursive: true });

/** File-backed Cache (the engine's Cache interface), written after each batch. */
async function fileCache(file) {
  let store = {};
  try { store = JSON.parse(await readFile(file, 'utf8')); } catch {}
  let dirty = false;
  const flush = async () => { if (dirty) { await writeFile(file, JSON.stringify(store)); dirty = false; } };
  return {
    async getMany(ns, keys) {
      const out = new Map();
      for (const k of keys) { const hit = store[`${ns}\u0000${k}`]; if (hit) out.set(k, hit.v); }
      return out;
    },
    async setMany(ns, entries) {
      for (const [k, v] of entries) store[`${ns}\u0000${k}`] = { v };
      dirty = true; await flush();
    },
    flush,
  };
}

const songs = JSON.parse(await readFile(process.env.DATA ?? join(here, 'data/chart-songs.json'), 'utf8'));
const { SPOTIFY_CLIENT_ID: id, SPOTIFY_CLIENT_SECRET: secret, LASTFM_API_KEY: lastfmKey } = process.env;
if (!id || !secret || !lastfmKey) throw new Error('Set SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET and LASTFM_API_KEY');

// 1. Find each chart song on Spotify (app token, no user data).
const searchFile = join(CACHE_DIR, 'spotify-search.json');
let found = {};
try { found = JSON.parse(await readFile(searchFile, 'utf8')); } catch {}
const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
  method: 'POST',
  headers: { Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' },
  body: 'grant_type=client_credentials',
});
const { access_token: token } = await tokenRes.json();
const norm = (s) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const mainArtistOf = (credit) => credit.split(/\s+(?:featuring|feat\.?|ft\.?|with)\s+|,\s+/i)[0].trim();
const firstNameOf = (credit) => mainArtistOf(credit).split(/\s+(?:&|and|x|\+)\s+/i)[0].trim();

async function search(q) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(`https://api.spotify.com/v1/search?type=track&limit=5&q=${encodeURIComponent(q)}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 429) { await new Promise((r) => setTimeout(r, (Number(res.headers.get('retry-after')) || 2) * 1000)); continue; }
    if (!res.ok) return [];
    return (await res.json()).tracks?.items ?? [];
  }
  return [];
}
let searched = 0;
for (const s of songs) {
  const key = `${s.title}\u0000${s.artist}`;
  if (key in found) continue;
  // NO_SEARCH=1 measures only songs already found (Spotify rate-limits heavy searching).
  if (process.env.NO_SEARCH) continue;
  const main = mainArtistOf(s.artist), first = firstNameOf(s.artist), title = norm(cleanTitle(s.title));
  let pick = null;
  for (const q of [`track:"${s.title}" artist:"${main}"`, `track:"${s.title}" artist:"${first}"`, `${s.title} ${first}`]) {
    const items = await search(q);
    pick = items.find((t) => norm(cleanTitle(t.name)).startsWith(title.slice(0, 12)) && t.artists.some((a) => norm(a.name).includes(norm(first)) || norm(first).includes(norm(a.name))));
    if (pick) break;
  }
  found[key] = pick ? toTrackRef(pick, null) : null;
  if (++searched % 25 === 0) { await writeFile(searchFile, JSON.stringify(found)); process.stderr.write(`spotify ${searched}\n`); }
  await new Promise((r) => setTimeout(r, 120));
}
await writeFile(searchFile, JSON.stringify(found));

// 2. Enrich and classify with the real engine (same code the app runs).
const rows = songs.map((s) => ({ ...s, ref: found[`${s.title}\u0000${s.artist}`] })).filter((r) => r.ref);
const searchedCount = songs.filter((s) => `${s.title}\u0000${s.artist}` in found).length;
const cache = await fileCache(join(CACHE_DIR, 'enrich.json'));
const big = 100000;
const { tracks, pending } = await enrichTracks(rows.map((r) => r.ref), {
  lastfm: new LastfmClient({ apiKey: lastfmKey }),
  musicbrainz: null,
  cache,
  budget: { audio: big, tags: big, albumTags: big, artistTags: big },
  onProgress: ({ step, done, total }) => { if (done % 50 === 0 || done === total) process.stderr.write(`${step} ${done}/${total}\n`); },
});
await cache.flush();
const byId = new Map(tracks.map((t) => [t.id, t]));

// 3. Score. A placement is "wrong" when every chart the song topped clearly contradicts the genre.
const CONTRA = {
  'hip-hop': ['country', 'worship', 'rock'],
  country: ['hip-hop', 'r&b', 'latin', 'electronic'],
  worship: ['hip-hop', 'r&b', 'latin', 'electronic', 'country', 'rock', 'pop'],
  rock: ['hip-hop', 'r&b', 'latin', 'country', 'worship', 'electronic'],
  metal: ['hip-hop', 'r&b', 'latin', 'country', 'worship', 'electronic', 'pop'],
  latin: ['country', 'worship', 'rock'],
  electronic: ['country', 'worship', 'rock'],
  'r&b': ['country', 'worship', 'rock', 'latin'],
};
const LABEL_BUCKETS = { rock: ['rock', 'metal'] };
const labels = ['hip-hop', 'country', 'worship', 'rock', 'r&b', 'latin', 'electronic', 'pop'];
const stat = Object.fromEntries([...labels, 'metal'].map((l) => [l, { labeled: 0, covered: 0, placed: 0, wrong: 0, noGenre: 0 }]));
const wrongList = [];
for (const r of rows) {
  const f = byId.get(r.ref.id);
  if (!f) continue;
  for (const l of r.labels) {
    const st = stat[l]; if (!st) continue;
    st.labeled++;
    if ((LABEL_BUCKETS[l] ?? [l]).some((b) => f.genreBuckets.includes(b))) st.covered++;
    if (f.genreBuckets.length === 0) st.noGenre++;
  }
  for (const b of f.genreBuckets) {
    if (!stat[b]) continue;
    stat[b].placed++;
    const contra = CONTRA[b];
    if (contra && r.labels.length && r.labels.every((l) => contra.includes(l))) {
      stat[b].wrong++;
      wrongList.push({ placedIn: b, title: r.title, artist: r.artist, labels: r.labels.join('+'), scores: f.genreScores, reasons: f.genreReasons });
    }
  }
}
const pct = (a, b) => (b ? `${((a / b) * 100).toFixed(1)}%` : '–');
const lines = [
  `Chart songs: ${songs.length} · searched on Spotify: ${searchedCount} · found: ${rows.length} · lookups still pending: ${JSON.stringify(pending)}`,
  '',
  '| Genre | Chart songs | Got the genre | No genre (left out) | Placed in genre | Wrong placements |',
  '|---|---|---|---|---|---|',
  ...[...labels, 'metal'].map((l) => { const s = stat[l]; return `| ${l} | ${s.labeled} | ${pct(s.covered, s.labeled)} | ${pct(s.noGenre, s.labeled)} | ${s.placed} | ${s.wrong} (${pct(s.wrong, s.placed)}) |`; }),
];
console.log(lines.join('\n'));
if (process.env.DETAIL) for (const r of rows) { const f = byId.get(r.ref.id); console.log(`  ${r.title} — ${r.artist} [${r.labels}] → ${f.genreBuckets.join('+') || '(none)'}${f.genreNear.length ? ` near ${f.genreNear}` : ''} ${JSON.stringify(f.genreScores)} · ${f.genreReasons.join('; ')}`); }
console.log(`\nWrong placements (${wrongList.length}):`);
for (const w of wrongList.slice(0, Number(process.env.SHOW ?? 40))) console.log(`- [${w.placedIn}] ${w.title} — ${w.artist} (charts: ${w.labels}) ${JSON.stringify(w.scores)} ${w.reasons.join('; ')}`);
await writeFile(join(here, 'RESULTS.md'), `# Genre accuracy\n\nMeasured by \`eval/run.mjs\` on Billboard genre-chart number ones (2010–2025). "Wrong" means every chart the song topped clearly contradicts the genre (for example, a song that only topped the country chart placed in Rap).\n\n${lines.join('\n')}\n`);
