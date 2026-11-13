// Live check of the keyless data sources against the built package: `pnpm smoke`.
// Spotify isn't called (that needs your own app credentials).
import {
  camelotToKeyName,
  classifyTrack,
  MusicBrainzClient,
  ReccoBeatsClient,
  sortTracks,
} from '../packages/core/dist/index.js';

const songs = [
  { id: '003vvx7Niy0yvhvHt4a68B', name: 'Mr. Brightside', artist: 'The Killers', isrc: 'USIR20400274', album: '2004-06-07' },
  { id: '4uLU6hMCjMI75M1A2tKUQC', name: 'Never Gonna Give You Up', artist: 'Rick Astley', isrc: 'GBARL9300135', album: '1987-11-12' },
  { id: '7ouMYWpwJ422jRcDASZB7P', name: 'Track 3', artist: 'Unknown', isrc: 'GBAHT0500600', album: '2005-01-01' },
];

const features = await new ReccoBeatsClient().audioFeatures(songs.map((s) => s.id));
const mb = new MusicBrainzClient();

const facts = [];
for (const s of songs) {
  const year = await mb.originalYear(s.isrc);
  const track = {
    id: s.id,
    uri: `spotify:track:${s.id}`,
    name: s.name,
    artists: [{ id: null, name: s.artist }],
    album: { name: '', releaseDate: s.album, releaseDatePrecision: 'day', imageUrl: null },
    durationMs: 0,
    explicit: false,
    isrc: s.isrc,
    addedAt: null,
  };
  const f = classifyTrack({ track, audio: features.get(s.id) ?? null, originalYear: year });
  facts.push(f);
  console.log(
    `${s.name.padEnd(26)} BPM ${f.audio?.tempo.toFixed(0) ?? '?'}  key ${f.camelot ?? '?'} (${f.camelot ? camelotToKeyName(f.camelot) : '?'})  energy ${f.audio?.energy ?? '?'}  year ${f.year} [${f.yearSource}]  moods ${f.moods.join(',') || '-'}`,
  );
}

console.log('\nHarmonic order:', sortTracks(facts, { by: 'harmonic' }).map((t) => `${t.name} (${t.camelot})`).join(' → '));
if (facts.filter((f) => f.audio).length < 2) {
  console.error('Expected audio features for at least 2 songs');
  process.exit(1);
}
