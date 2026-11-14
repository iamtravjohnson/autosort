/**
 * Content for the high-intent feature pages: /split/[slug] and /sort/[slug].
 *
 * Every song, artist and number in the examples is made up for illustration. Facts about how
 * AutoSort works mirror @autosort/core (rules, sort modes, data sources) and the product brief.
 */
import type { FaqItem } from '@/lib/seo';

export type FeatureKind = 'split' | 'sort';

export interface FeatureStep {
  title: string;
  text: string;
}

export interface UseCase {
  title: string;
  text: string;
  chips: string[];
}

export interface RelatedLink {
  kind: 'Split' | 'Sort' | 'Guide' | 'Recipe' | 'Tool' | 'Docs' | 'Compare';
  label: string;
  href: string;
}

/** The visual on the right of the hero. */
export type HeroVisual =
  | {
      /** One source playlist fanning out into several smart playlists. */
      type: 'fanout';
      ariaLabel: string;
      note: string;
      source: { name: string; sub: string; cover: 'mosaic' | 'liked' };
      targets: Array<{ name: string; count: number; cover: string }>;
    }
  | {
      /** A bar chart of one value per track, in sorted order. */
      type: 'bars';
      ariaLabel: string;
      note: string;
      title: string;
      caption: string;
      range: string;
      max: number;
      bars: Array<{ value: number; label: string }>;
      axis: [string, string, string];
    }
  | {
      /** A harmonic-mix sequence with Camelot key chips; transitions are computed with `transition()`. */
      type: 'harmonic';
      note: string;
      title: string;
      caption: string;
      /** Extra detail after each title: the musical key name or the track's BPM. */
      detail?: 'keyName' | 'bpm';
      tracks: Array<{ key: string; title: string; bpm?: number }>;
    }
  | {
      /** A short track list with one value per row (dates, years). */
      type: 'list';
      ariaLabel: string;
      note: string;
      title: string;
      caption: string;
      rows: Array<{ title: string; artist: string; value: string; note?: string }>;
    };

export interface TrackRow {
  title: string;
  artist: string;
  /** Display value: BPM, energy, a date, a year or a Camelot code. */
  value: string;
  /** Numeric sort key for sorted examples. */
  sort?: number;
  /** Small muted note under the artist (e.g. a compilation date). */
  note?: string;
}

/** "Where each song goes" table for split pages. */
export interface WhereExample {
  type: 'where';
  title: string;
  lead: string;
  caption: string;
  /** First column heading. Default "Song". */
  songColumn?: string;
  /** Middle columns, between the song and "Goes to". */
  columns: string[];
  rows: Array<{ song: string; artist: string; cells: string[]; to: string }>;
}

/** Before-and-after tables for sort pages. */
export interface BeforeAfterExample {
  type: 'beforeAfter';
  title: string;
  lead: string;
  valueLabel: string;
  valueType: 'text' | 'key';
  /** For key values, show the musical key name or the Open Key code next to the chip. */
  keyDetail?: 'name' | 'openKey';
  /** Add a column with the transition into each song (key values only). */
  transitions?: boolean;
  before: { caption: string; rows: TrackRow[] };
  after: { caption: string; rows: TrackRow[] };
}

/** An optional reference table (typical BPM ranges, mood rules, energy shapes). */
export interface ReferenceTable {
  title: string;
  lead: string;
  caption: string;
  columns: [string, string, string];
  rows: Array<[string, string, string]>;
  /** Render the third column as a chip (an AutoSort setting). */
  lastColumnChip?: boolean;
  note?: string;
}

export interface FeaturePage {
  kind: FeatureKind;
  slug: string;
  /** Breadcrumb label for this page. */
  label: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  /** 40–60 words, answers the query plainly. */
  quickAnswer: string;
  hero: HeroVisual;
  /** An extra text link in the hero (the key pages link the Camelot guide). */
  heroLink?: { label: string; href: string };
  /** Key-sort variant: show "What the transition labels mean" right after the hero. */
  transitionGuide?: boolean;
  how: { title: string; steps: FeatureStep[] };
  uses: { title: string; cards: UseCase[] };
  reference?: ReferenceTable;
  example: WhereExample | BeforeAfterExample;
  related: RelatedLink[];
  faq: FaqItem[];
  cta: { title: string; body: string };
}

/* ---------- Helpers ---------- */

const g = (a: string, b: string) => `linear-gradient(145deg, ${a}, ${b})`;

/** Playlist cover gradients from the design tokens. */
const COVER = {
  country: g('#F59E0B', '#7C2D12'),
  country90s: g('#B45309', '#451A03'),
  rap: g('#38BDF8', '#1E3A8A'),
  worship: g('#FDE68A', '#B45309'),
  workout: g('#F97316', '#7F1D1D'),
  happy: g('#FBBF24', '#F472B6'),
  love: g('#F472B6', '#831843'),
  sad: g('#818CF8', '#312E81'),
  harmonic: g('#8B5CF6', '#1E1B4B'),
  rock: g('#EF4444', '#450A0A'),
  rnb: g('#A78BFA', '#2E1065'),
  pop2000s: g('#F472B6', '#7C2D12'),
  chill: g('#38BDF8', '#0F172A'),
  fresh: g('#2DD4BF', '#134E4A'),
  unmatched: '#3A3A40',
};

/** Sort rows by their numeric `sort` key (stable). */
function sortRows(rows: TrackRow[], direction: 'asc' | 'desc'): TrackRow[] {
  return rows
    .map((r, i) => ({ r, i }))
    .sort((a, b) => ((a.r.sort ?? 0) - (b.r.sort ?? 0)) * (direction === 'asc' ? 1 : -1) || a.i - b.i)
    .map(({ r }) => r);
}

/**
 * Warm-up → peak → cool-down, built the way @autosort/core's `energyArc('mountain')` does it:
 * line tracks up by energy, deal them alternately to the way up and the way down.
 */
function mountain(rows: TrackRow[]): TrackRow[] {
  const rising = sortRows(rows, 'asc');
  const up = rising.filter((_, i) => i % 2 === 0);
  const down = rising.filter((_, i) => i % 2 === 1).reverse();
  return [...up, ...down];
}

function mountainValues(values: number[]): number[] {
  const rising = [...values].sort((a, b) => a - b);
  return [...rising.filter((_, i) => i % 2 === 0), ...rising.filter((_, i) => i % 2 === 1).reverse()];
}

const bpmBars = (values: number[]) => values.map((v) => ({ value: v, label: `${v} BPM` }));

/** Reorder rows to match a list of titles (for hand-built orders like a harmonic mix). */
function inOrder(rows: TrackRow[], titles: string[]): TrackRow[] {
  return titles.map((t) => {
    const row = rows.find((r) => r.title === t);
    if (!row) throw new Error(`features.ts: no example row titled "${t}"`);
    return row;
  });
}

const FREE_BODY = 'Free, open source, and it runs on your own Spotify account.';

/* ---------- Example data shared across sort pages ---------- */

const BPM_BEFORE: TrackRow[] = [
  { title: 'Concrete Halo', artist: 'Lil Tremaine', value: '128', sort: 128 },
  { title: 'Tin Roof Lullaby', artist: 'June Calloway', value: '84', sort: 84 },
  { title: 'Overdrive City', artist: 'Volt Avenue', value: '146', sort: 146 },
  { title: 'Static on the Radio', artist: 'The Wire Birds', value: '98', sort: 98 },
  { title: 'Red Line Run', artist: 'Volt Avenue', value: '174', sort: 174 },
  { title: 'Daylight Over Jordan', artist: 'Mercy Hill Collective', value: '72', sort: 72 },
];

const ENERGY_BEFORE: TrackRow[] = [
  { title: 'Overdrive City', artist: 'Volt Avenue', value: '0.88', sort: 0.88 },
  { title: 'Slow Tide', artist: 'Coastal Hours', value: '0.31', sort: 0.31 },
  { title: 'Friday Lights', artist: 'DJ Marisol', value: '0.76', sort: 0.76 },
  { title: 'Rainy Window Seat', artist: 'Ivy Marlowe', value: '0.28', sort: 0.28 },
  { title: 'Red Line Run', artist: 'Volt Avenue', value: '0.78', sort: 0.78 },
  { title: 'Lemonade Skies', artist: 'Pearl & the Porch Lights', value: '0.62', sort: 0.62 },
];

const KEY_ROWS: TrackRow[] = [
  { title: 'Concrete Halo', artist: 'Lil Tremaine', value: '1A' },
  { title: 'Midnight Feed Store', artist: 'Hollis Dean', value: '8A' },
  { title: 'Overdrive City', artist: 'Volt Avenue', value: '12B' },
  { title: 'Lemonade Skies', artist: 'Pearl & the Porch Lights', value: '9A' },
  { title: 'Red Line Run', artist: 'Volt Avenue', value: '12A' },
  { title: 'Static on the Radio', artist: 'The Wire Birds', value: '8A' },
  { title: 'Tailgate Summer', artist: 'Kacey Lynn Dorsey', value: '10B' },
  { title: 'Neon Porchlight', artist: 'Sadie Vale', value: '9B' },
];
const KEY_MIX = ['Midnight Feed Store', 'Static on the Radio', 'Lemonade Skies', 'Neon Porchlight', 'Tailgate Summer', 'Overdrive City', 'Red Line Run', 'Concrete Halo'];

const CAMELOT_ROWS: TrackRow[] = [
  { title: 'Night Market', artist: 'Lumen Park', value: '8A' },
  { title: 'Porch Swing Hymn', artist: 'Mercy Hill Collective', value: '4A' },
  { title: 'Halftime Parade', artist: 'The Brass Hollow', value: '9B' },
  { title: 'Glasshouse', artist: 'Odessa Cole', value: '5B' },
  { title: 'Gravel & Grace', artist: 'June Calloway', value: '6A' },
  { title: 'Red Clay Radio', artist: 'Hollis Dean', value: '5A' },
  { title: 'Sunday Drive', artist: 'Sadie Vale', value: '8B' },
  { title: 'Paper Lanterns', artist: 'Ivy Marlowe', value: '6B' },
];
const CAMELOT_MIX = ['Porch Swing Hymn', 'Red Clay Radio', 'Glasshouse', 'Paper Lanterns', 'Gravel & Grace', 'Night Market', 'Sunday Drive', 'Halftime Parade'];

const ADDED_BEFORE: TrackRow[] = [
  { title: 'Daylight Over Jordan', artist: 'Mercy Hill Collective', value: 'Mar 3, 2024', sort: 20240303 },
  { title: 'Midnight Feed Store', artist: 'Hollis Dean', value: 'Jan 19, 2025', sort: 20250119 },
  { title: 'Red Clay Radio', artist: 'Hollis Dean', value: 'Jun 8, 2025', sort: 20250608 },
  { title: 'Glasshouse', artist: 'Odessa Cole', value: 'Feb 2, 2026', sort: 20260202 },
  { title: 'Tailgate Summer', artist: 'Kacey Lynn Dorsey', value: 'Aug 30, 2026', sort: 20260830 },
  { title: 'Neon Porchlight', artist: 'Sadie Vale', value: 'Nov 12, 2026', sort: 20261112 },
];

const RELEASE_BEFORE: TrackRow[] = [
  { title: 'Neon Porchlight', artist: 'Sadie Vale', value: '2025', sort: 2025 },
  { title: 'Dance Hall Saturday', artist: 'Billy Ray Cantrell', value: '1994', sort: 1994, note: 'Spotify album: 2015 Greatest Hits' },
  { title: 'Static on the Radio', artist: 'The Wire Birds', value: '2003', sort: 2003, note: 'Spotify album: 2011 remaster' },
  { title: 'Concrete Halo', artist: 'Lil Tremaine', value: '2022', sort: 2022 },
  { title: 'Tin Roof Lullaby', artist: 'June Calloway', value: '1998', sort: 1998 },
  { title: 'Midnight Feed Store', artist: 'Hollis Dean', value: '1987', sort: 1987 },
];

const ENERGY_ARC = mountainValues([32, 35, 41, 47, 55, 60, 63, 72, 74, 84, 86, 91]);

/* ---------- Split pages ---------- */

export const splitPages: FeaturePage[] = [
  {
    kind: 'split',
    slug: 'by-genre',
    label: 'By genre',
    h1: 'Split a Spotify playlist by genre, automatically',
    metaTitle: 'Split a Spotify playlist by genre, automatically',
    metaDescription:
      'Turn one big Spotify playlist into Country, Rap, Worship and other genre playlists that refill themselves every day. Free, open-source and self-hosted.',
    quickAnswer:
      'AutoSort reads every song in a Spotify playlist, looks up each artist’s genres, and creates one playlist per genre, such as Country, Rap or Worship. It’s free and open source. Songs you add later are filed into the right genre playlist by a daily sync, so the split stays current.',
    hero: {
      type: 'fanout',
      ariaLabel: 'Example: a made-up 2,431-song playlist called Everything split into six genre playlists, with 257 songs left unmatched',
      note: 'Example counts for a made-up 2,431-song playlist.',
      source: { name: 'Everything', sub: '2,431 songs, every genre', cover: 'mosaic' },
      targets: [
        { name: 'Rap', count: 520, cover: COVER.rap },
        { name: 'Pop', count: 468, cover: COVER.love },
        { name: 'Country', count: 412, cover: COVER.country },
        { name: 'Rock', count: 356, cover: COVER.rock },
        { name: 'R&B', count: 330, cover: COVER.rnb },
        { name: 'Worship', count: 88, cover: COVER.worship },
        { name: 'Unmatched', count: 257, cover: COVER.unmatched },
      ],
    },
    how: {
      title: 'How AutoSort splits by genre',
      steps: [
        { title: 'Pick the playlist', text: 'Choose any playlist you own, or your Liked Songs, as the source. AutoSort reads it and never changes it.' },
        {
          title: 'AutoSort reads the genres',
          text: 'Spotify tags artists, not songs, so AutoSort uses each artist’s genres. With a free Last.fm key, crowd tags fill the gaps.',
        },
        { title: 'Accept Smart suggestions', text: 'Related tags (country, americana, red dirt) become one playlist you can rename, edit or skip.' },
        { title: 'It keeps them updated', text: 'A daily sync files new songs into the right genre playlist and removes songs you take out of the source.' },
      ],
    },
    uses: {
      title: 'When splitting by genre helps',
      cards: [
        {
          title: 'One giant “everything” playlist',
          text: 'You add every song you like to one place and only ever hear the top of it. Genre playlists bring the rest back.',
          chips: ['Genre: Country', 'Genre: Rap'],
        },
        {
          title: 'Different tastes in one household',
          text: 'Worship for Sunday, rap for the gym, country for the truck, without keeping three playlists by hand.',
          chips: ['Worship', 'Rap', 'Country'],
        },
        { title: 'Genre plus decade', text: 'Stack rules for playlists like 90s Country or 2000s Pop.', chips: ['Genre: Country', 'Decade: 90s'] },
      ],
    },
    example: {
      type: 'where',
      title: 'Example: where each song goes',
      lead: 'Made-up songs and artists, shaped like a real catch-all playlist. One song can land in more than one playlist.',
      caption: 'Songs from Everything and the genre playlists they are filed into',
      columns: ['Artist genres', 'Released'],
      rows: [
        { song: 'Tailgate Summer', artist: 'Kacey Lynn Dorsey', cells: ['country, country pop', '2023'], to: 'Country' },
        { song: 'Dance Hall Saturday', artist: 'Billy Ray Cantrell', cells: ['country, honky tonk', '1994'], to: 'Country, 90s Country' },
        { song: 'Front Porch Cypher', artist: 'Deacon Rhodes', cells: ['country rap, country hip hop', '2021'], to: 'Country, Rap' },
        { song: 'Daylight Over Jordan', artist: 'Mercy Hill Collective', cells: ['worship, ccm', '2021'], to: 'Worship' },
        { song: 'Velvet Rearview', artist: 'Odessa Cole', cells: ['r&b, neo soul', '2019'], to: 'R&B' },
        { song: 'Harbor Lights', artist: 'Maren Shaw', cells: ['sea shanty', '2021'], to: 'Unmatched (you decide)' },
      ],
    },
    related: [
      { kind: 'Split', label: 'By decade', href: '/split/by-decade' },
      { kind: 'Split', label: 'By mood', href: '/split/by-mood' },
      { kind: 'Split', label: 'Clean versions', href: '/split/clean-versions' },
      { kind: 'Split', label: 'Organize Liked Songs', href: '/split/liked-songs' },
      { kind: 'Recipe', label: '90s Country', href: '/recipes/90s-country' },
      { kind: 'Guide', label: 'Organize a huge playlist', href: '/guides/organize-a-huge-playlist' },
    ],
    faq: [
      {
        q: 'Can Spotify split a playlist by genre on its own?',
        a: 'Not into separate playlists. Spotify doesn’t turn one of your playlists into genre playlists that update themselves. AutoSort does: it reads the playlist, creates one playlist per genre, and files new songs on a daily sync.',
      },
      {
        q: 'Where does the genre data come from?',
        a: 'Spotify assigns genres to artists, not individual songs, so AutoSort uses each artist’s genres. If you add a free Last.fm API key, crowd tags fill in genres Spotify’s data misses.',
      },
      {
        q: 'What happens to songs that fit no genre?',
        a: 'They go to Unmatched songs, where you can add them to a playlist by hand or let AutoSort suggest a new playlist for them.',
      },
      {
        q: 'Can one song be in two genre playlists?',
        a: 'Yes. A country rap song can land in both Country and Rap. If you want them kept apart, add a rule that leaves out the other genre.',
      },
      {
        q: 'Will it change my original playlist?',
        a: 'No. AutoSort only reads the source and writes to the playlists it creates, which show up in Spotify with names like “Country (AutoSort)”.',
      },
      {
        q: 'Does it cost anything?',
        a: 'No. AutoSort is free and open source under the MIT license. You run your own copy with your own free Spotify developer app, and the app owner needs Spotify Premium.',
      },
    ],
    cta: { title: 'Split your playlist by genre for good', body: FREE_BODY },
  },
  {
    kind: 'split',
    slug: 'by-decade',
    label: 'By decade',
    h1: 'Split a Spotify playlist by decade',
    metaTitle: 'Split a Spotify playlist by decade',
    metaDescription:
      'Make 80s, 90s and 2000s playlists from one Spotify playlist, using original release years so Greatest Hits albums don’t skew the dates. Free and open source.',
    quickAnswer:
      'AutoSort groups the songs in a Spotify playlist by the decade they first came out and creates one playlist per decade, like 90s or 2000s. It checks each song’s original release year on MusicBrainz, so a 1994 hit on a 2015 Greatest Hits album still lands in 90s. New songs are filed daily.',
    hero: {
      type: 'fanout',
      ariaLabel: 'Example: a made-up 2,431-song playlist called Everything split into seven decade playlists, from the 60s to the 2020s',
      note: 'Example counts for a made-up 2,431-song playlist.',
      source: { name: 'Everything', sub: '2,431 songs, 1964 to 2026', cover: 'mosaic' },
      targets: [
        { name: '60s', count: 58, cover: COVER.unmatched },
        { name: '70s', count: 96, cover: COVER.worship },
        { name: '80s', count: 214, cover: COVER.sad },
        { name: '90s', count: 498, cover: COVER.country90s },
        { name: '2000s', count: 611, cover: COVER.pop2000s },
        { name: '2010s', count: 642, cover: COVER.chill },
        { name: '2020s', count: 312, cover: COVER.fresh },
      ],
    },
    how: {
      title: 'How AutoSort splits by decade',
      steps: [
        { title: 'Pick the playlist', text: 'Choose a playlist you own, or your Liked Songs, as the source. AutoSort reads it and never changes it.' },
        {
          title: 'Find the original year',
          text: 'Spotify only knows the album’s date. AutoSort looks up each song’s ISRC on MusicBrainz and keeps the earlier, original year.',
        },
        { title: 'Choose your decades', text: 'Accept a playlist per decade, or stack rules for mixes like 90s Country or 2000s Pop.' },
        { title: 'It keeps them updated', text: 'The daily sync files new songs into the right decade and drops songs you remove from the source.' },
      ],
    },
    uses: {
      title: 'When splitting by decade helps',
      cards: [
        { title: 'Throwback nights', text: 'Put on the 90s playlist for a road trip or a party without digging through everything else.', chips: ['Decade: 90s'] },
        { title: 'Genre plus decade', text: 'Combine rules for playlists like 90s Country or 2000s Pop.', chips: ['Genre: Country', 'Decade: 90s'] },
        {
          title: 'Fixing compilation dates',
          text: 'Remasters and Greatest Hits albums make old songs look new. Original years put them back in the right decade.',
          chips: ['Original year', 'MusicBrainz'],
        },
      ],
    },
    example: {
      type: 'where',
      title: 'Example: where each song goes',
      lead: 'Made-up songs and artists. The original year comes from MusicBrainz; when it isn’t found, AutoSort uses the album year.',
      caption: 'Songs from Everything, their Spotify album date, original year, and the decade playlist they are filed into',
      columns: ['Spotify album date', 'Original year'],
      rows: [
        { song: 'Dance Hall Saturday', artist: 'Billy Ray Cantrell', cells: ['2015 (Greatest Hits)', '1994'], to: '90s' },
        { song: 'Tin Roof Lullaby', artist: 'June Calloway', cells: ['1998', '1998'], to: '90s' },
        { song: 'Midnight Feed Store', artist: 'Hollis Dean', cells: ['1987', '1987'], to: '80s' },
        { song: 'Static on the Radio', artist: 'The Wire Birds', cells: ['2011 (Remastered)', '2003'], to: '2000s' },
        { song: 'Neon Porchlight', artist: 'Sadie Vale', cells: ['2025', '2025'], to: '2020s' },
        { song: 'Harbor Lights', artist: 'Maren Shaw', cells: ['2019', 'Not found'], to: '2010s (album year)' },
      ],
    },
    related: [
      { kind: 'Split', label: 'By genre', href: '/split/by-genre' },
      { kind: 'Split', label: 'By mood', href: '/split/by-mood' },
      { kind: 'Sort', label: 'By release date', href: '/sort/by-release-date' },
      { kind: 'Recipe', label: '90s Country', href: '/recipes/90s-country' },
      { kind: 'Guide', label: 'Organize a huge playlist', href: '/guides/organize-a-huge-playlist' },
    ],
    faq: [
      {
        q: 'Why does a 90s song show up as 2015 on Spotify?',
        a: 'Spotify dates a song by the album it sits on. If that album is a later Greatest Hits, remaster or deluxe edition, you see the newer date. AutoSort looks up the recording’s original release year on MusicBrainz instead.',
      },
      {
        q: 'Where does the original year come from?',
        a: 'From MusicBrainz, the free, open music encyclopedia. AutoSort searches it by each song’s ISRC, a code that identifies the recording. When MusicBrainz has no match, AutoSort falls back to the Spotify album year.',
      },
      {
        q: 'Can I make a 90s Country playlist?',
        a: 'Yes. Combine a genre rule with a decade rule (Genre: Country and Decade: 90s). There is a ready-made 90s Country recipe to start from.',
      },
      {
        q: 'Can I use an exact year range instead of a decade?',
        a: 'Yes. A Year rule takes any range, such as 1995 to 2005, for era playlists that cross a decade line.',
      },
      {
        q: 'Will it change my original playlist?',
        a: 'No. AutoSort only reads the source and writes to the decade playlists it creates. Songs you remove from the source are removed from those playlists on the next sync.',
      },
    ],
    cta: { title: 'Give every decade its own playlist', body: FREE_BODY },
  },
  {
    kind: 'split',
    slug: 'by-mood',
    label: 'By mood',
    h1: 'Split a Spotify playlist by mood',
    metaTitle: 'Split a Spotify playlist by mood',
    metaDescription:
      'Turn one Spotify playlist into Happy, Sad, Chill, Workout, Party and Focus playlists using energy, valence and Last.fm tags. Free, open-source, no AI.',
    quickAnswer:
      'AutoSort files each song into moods like Happy, Sad, Chill, Workout, Party and Focus. It plots energy against valence (how positive a song sounds) using scores from ReccoBeats, adds Last.fm crowd tags if you have a free key, and creates one playlist per mood. The rules are plain and editable, with no AI.',
    hero: {
      type: 'fanout',
      ariaLabel: 'Example: a made-up 2,431-song playlist called Everything split into six mood playlists: Happy, Chill, Workout, Party, Sad and Focus',
      note: 'Example counts for a made-up 2,431-song playlist. A song can fit more than one mood.',
      source: { name: 'Everything', sub: '2,431 songs, every mood', cover: 'mosaic' },
      targets: [
        { name: 'Happy', count: 418, cover: COVER.happy },
        { name: 'Chill', count: 362, cover: COVER.chill },
        { name: 'Workout', count: 297, cover: COVER.workout },
        { name: 'Party', count: 254, cover: COVER.rnb },
        { name: 'Sad', count: 203, cover: COVER.sad },
        { name: 'Focus', count: 96, cover: COVER.fresh },
      ],
    },
    how: {
      title: 'How AutoSort splits by mood',
      steps: [
        { title: 'Pick the playlist', text: 'Choose a playlist you own, or your Liked Songs, as the source. AutoSort reads it and never changes it.' },
        {
          title: 'Measure energy and valence',
          text: 'ReccoBeats, a free audio-data service, scores each song’s energy and valence from 0 to 1, along with tempo and danceability.',
        },
        { title: 'Add crowd tags', text: 'With a free Last.fm key, tags like “chill” or “feel good” back up the numbers and catch songs the scores miss.' },
        { title: 'Accept and sync', text: 'Pick the mood playlists you want. The daily sync files new songs and removes ones that leave the source.' },
      ],
    },
    uses: {
      title: 'When splitting by mood helps',
      cards: [
        {
          title: 'The right playlist for the moment',
          text: 'Chill for dinner, Happy for the drive, Focus for work, all from the same playlist.',
          chips: ['Mood: Chill', 'Mood: Happy', 'Mood: Focus'],
        },
        {
          title: 'A workout playlist that refills itself',
          text: 'High-energy songs between 115 and 165 BPM, counting half and double time. New finds join on the next sync.',
          chips: ['Mood: Workout'],
        },
        { title: 'Mood plus genre', text: 'Stack rules for playlists like Sad Country or Chill R&B.', chips: ['Genre: Country', 'Mood: Sad'] },
      ],
    },
    reference: {
      title: 'How each mood is decided',
      lead: 'Scores run from 0 to 1. A song can match more than one mood. These are the default rules; you can build your own with Energy, Valence and BPM rules.',
      caption: 'Default audio rules and Last.fm tags for each mood',
      columns: ['Mood', 'Default audio rule', 'Last.fm tags that also count'],
      rows: [
        ['Happy', 'Valence 0.6 or more, energy 0.4 or more', 'happy, feel good, upbeat'],
        ['Sad', 'Valence 0.35 or less, energy 0.6 or less', 'sad, melancholy'],
        ['Chill', 'Energy 0.45 or less, valence above 0.3', 'chill, mellow, relaxing'],
        ['Workout', 'Energy 0.7 or more at 115–165 BPM (half or double time counts)', 'workout, gym, running'],
        ['Party', 'Danceability 0.7 or more, energy 0.65 or more', 'party, club'],
        ['Focus', 'Mostly instrumental, energy 0.6 or less', 'study, focus'],
      ],
    },
    example: {
      type: 'where',
      title: 'Example: where each song goes',
      lead: 'Made-up songs with example scores. Energy and valence run from 0 to 1, and one song can match more than one mood.',
      caption: 'Songs from Everything, their energy, valence and tags, and the mood playlists they are filed into',
      columns: ['Energy', 'Valence', 'Last.fm tags'],
      rows: [
        { song: 'Lemonade Skies', artist: 'Pearl & the Porch Lights', cells: ['0.62', '0.86', 'feel good, summer'], to: 'Happy' },
        { song: 'Rainy Window Seat', artist: 'Ivy Marlowe', cells: ['0.28', '0.22', 'sad, melancholy'], to: 'Sad' },
        { song: 'Slow Tide', artist: 'Coastal Hours', cells: ['0.31', '0.58', 'chill, acoustic'], to: 'Chill' },
        { song: 'Red Line Run', artist: 'Volt Avenue', cells: ['0.78', '0.55', 'workout, running'], to: 'Workout' },
        { song: 'Friday Lights', artist: 'DJ Marisol', cells: ['0.76', '0.74', 'party, dance'], to: 'Happy, Party' },
        { song: 'Study Hall Rain', artist: 'Coastal Hours', cells: ['0.22', '0.41', 'study, instrumental'], to: 'Chill, Focus' },
      ],
    },
    related: [
      { kind: 'Split', label: 'By genre', href: '/split/by-genre' },
      { kind: 'Sort', label: 'By energy', href: '/sort/by-energy' },
      { kind: 'Sort', label: 'By BPM', href: '/sort/by-bpm' },
      { kind: 'Split', label: 'Clean versions', href: '/split/clean-versions' },
      { kind: 'Recipe', label: 'Browse smart playlist recipes', href: '/recipes' },
      { kind: 'Docs', label: 'How smart playlists work', href: '/docs/how-it-works' },
    ],
    faq: [
      {
        q: 'How does AutoSort know a song’s mood?',
        a: 'It uses two audio scores from ReccoBeats: energy (how intense a song feels) and valence (how positive it sounds). High valence with some energy reads as Happy; low valence and low energy reads as Sad. Last.fm crowd tags add moods the numbers miss.',
      },
      {
        q: 'Is this AI?',
        a: 'No. Spotify’s Developer Policy forbids feeding Spotify data to AI models, so AutoSort uses plain rules you can read and edit, such as “valence 0.6 or more and energy 0.4 or more”.',
      },
      {
        q: 'Why not use Spotify’s own audio features?',
        a: 'Spotify closed its audio-features endpoint to new apps in November 2024. ReccoBeats is free, needs no key, and provides tempo, key, energy, valence, danceability and acousticness.',
      },
      {
        q: 'Can a song be in two moods?',
        a: 'Yes. A bright dance track can be Happy and Party at once. Add a rule that leaves out the other mood if you want the playlists kept apart.',
      },
      {
        q: 'What if a song has no audio data?',
        a: 'It can still get a mood from Last.fm tags. A song with no scores and no tags doesn’t match a mood rule, so it stays out of mood playlists instead of being guessed.',
      },
    ],
    cta: { title: 'Find the moods hiding in your playlist', body: FREE_BODY },
  },
  {
    kind: 'split',
    slug: 'clean-versions',
    label: 'Clean versions',
    h1: 'Make a clean version of a Spotify playlist',
    metaTitle: 'Make a clean version of a Spotify playlist',
    metaDescription:
      'Create a clean copy of any Spotify playlist that leaves out songs marked explicit and stays in sync as you add music. Free, open-source and self-hosted.',
    quickAnswer:
      'AutoSort makes a clean copy of a Spotify playlist by leaving out every song Spotify marks as explicit. Do it for a whole playlist (Clean Everything) or one genre (Clean Rap). The copy updates daily, so new clean songs are added, explicit ones never get in, and your original stays untouched.',
    hero: {
      type: 'fanout',
      ariaLabel: 'Example: a made-up 2,431-song playlist called Everything, 469 of them explicit, turned into Clean Everything and four clean genre playlists',
      note: 'Example counts for a made-up 2,431-song playlist.',
      source: { name: 'Everything', sub: '2,431 songs, 469 explicit', cover: 'mosaic' },
      targets: [
        { name: 'Clean Everything', count: 1962, cover: COVER.fresh },
        { name: 'Clean Rap', count: 341, cover: COVER.rap },
        { name: 'Clean Pop', count: 437, cover: COVER.love },
        { name: 'Clean Country', count: 405, cover: COVER.country },
        { name: 'Clean R&B', count: 286, cover: COVER.rnb },
      ],
    },
    how: {
      title: 'How AutoSort makes a clean version',
      steps: [
        { title: 'Pick the playlist', text: 'Choose any playlist you own, or your Liked Songs. The original stays exactly as it is.' },
        { title: 'Check the explicit flag', text: 'Spotify marks each track as explicit or not. AutoSort reads that flag for every song.' },
        {
          title: 'Add the Clean only rule',
          text: 'Use it alone for Clean Everything, or with a genre for Clean Rap. AutoSort suggests a clean version when a quarter or more of a genre is explicit.',
        },
        { title: 'It stays clean', text: 'The daily sync adds new songs that aren’t explicit and removes any song you take out of the source.' },
      ],
    },
    uses: {
      title: 'When a clean version helps',
      cards: [
        { title: 'Car rides with the kids', text: 'Play Clean Rap on the school run without reaching for the skip button.', chips: ['Genre: Rap', 'Clean only'] },
        { title: 'Shared spaces', text: 'A clean copy of your main playlist for the office, a family party or the gym floor.', chips: ['Clean only'] },
        { title: 'Clean plus mood', text: 'Combine rules for a clean Workout or a clean Party playlist.', chips: ['Mood: Workout', 'Clean only'] },
      ],
    },
    example: {
      type: 'where',
      title: 'Example: where each song goes',
      lead: 'Made-up songs. In this example the playlists are Rap, Clean Rap, Pop, Country, R&B and Clean Everything.',
      caption: 'Songs from Everything, their explicit flag, and the playlists they are filed into',
      columns: ['Genre', 'Explicit on Spotify'],
      rows: [
        { song: 'Concrete Halo', artist: 'Lil Tremaine', cells: ['Rap', 'Explicit'], to: 'Rap' },
        { song: 'Concrete Halo (Radio Edit)', artist: 'Lil Tremaine', cells: ['Rap', 'Not explicit'], to: 'Rap, Clean Rap, Clean Everything' },
        { song: 'Sunday Cypher', artist: 'Deacon Rhodes', cells: ['Rap', 'Not explicit'], to: 'Rap, Clean Rap, Clean Everything' },
        { song: 'Velvet Rearview', artist: 'Odessa Cole', cells: ['R&B', 'Explicit'], to: 'R&B' },
        { song: 'Tailgate Summer', artist: 'Kacey Lynn Dorsey', cells: ['Country', 'Not explicit'], to: 'Country, Clean Everything' },
        { song: 'Lemonade Skies', artist: 'Pearl & the Porch Lights', cells: ['Pop', 'Not explicit'], to: 'Pop, Clean Everything' },
      ],
    },
    related: [
      { kind: 'Split', label: 'By genre', href: '/split/by-genre' },
      { kind: 'Split', label: 'By mood', href: '/split/by-mood' },
      { kind: 'Recipe', label: 'Clean Rap', href: '/recipes/clean-rap' },
      { kind: 'Split', label: 'Organize Liked Songs', href: '/split/liked-songs' },
      { kind: 'Docs', label: 'How smart playlists work', href: '/docs/how-it-works' },
    ],
    faq: [
      {
        q: 'How does AutoSort know if a song is explicit?',
        a: 'Spotify marks every track as explicit or not, and AutoSort reads that flag. It doesn’t scan lyrics, so a song Spotify hasn’t flagged counts as clean.',
      },
      {
        q: 'Does it swap explicit songs for their clean edits?',
        a: 'No. It leaves explicit tracks out. If the clean edit of a song is in your source as its own track, that version goes into the clean playlist.',
      },
      {
        q: 'Doesn’t Spotify already have a clean setting?',
        a: 'Spotify has an account setting that blocks explicit content everywhere on that account. AutoSort is different: it builds a separate clean playlist, so one account can keep both the full and the clean version.',
      },
      {
        q: 'Will my original playlist change?',
        a: 'No. AutoSort only reads the source and writes to the clean playlist it creates, which shows up in Spotify with a name like “Clean Rap (AutoSort)”.',
      },
      {
        q: 'Can I add or remove a song by hand?',
        a: 'Yes. Songs you add to the clean playlist yourself are kept on every sync, and you can pin or exclude any song.',
      },
    ],
    cta: { title: 'Make a clean copy of your playlist', body: FREE_BODY },
  },
  {
    kind: 'split',
    slug: 'liked-songs',
    label: 'Liked Songs',
    h1: 'Organize your Spotify Liked Songs into playlists',
    metaTitle: 'Organize your Spotify Liked Songs into playlists',
    metaDescription:
      'Use Liked Songs as the source and let AutoSort split it into genre, decade and mood playlists that update every day. Free, open-source and self-hosted.',
    quickAnswer:
      'Connect AutoSort and choose Liked Songs as the source. It reads every song you’ve liked, then creates playlists by genre, decade or mood, such as Country, 90s or Workout. Spotify’s heart always saves to Liked Songs, so keep liking songs as usual and the daily sync files them for you.',
    hero: {
      type: 'fanout',
      ariaLabel: 'Example: a made-up Liked Songs library of 1,284 songs split into six playlists: Country, Rap, Workout, Love Songs, Worship and 90s Country',
      note: 'Example counts for a made-up Liked Songs library. A song can land in more than one playlist.',
      source: { name: 'Liked Songs', sub: '1,284 songs, newest first', cover: 'liked' },
      targets: [
        { name: 'Country', count: 286, cover: COVER.country },
        { name: 'Rap', count: 241, cover: COVER.rap },
        { name: 'Workout', count: 163, cover: COVER.workout },
        { name: 'Love Songs', count: 118, cover: COVER.love },
        { name: 'Worship', count: 74, cover: COVER.worship },
        { name: '90s Country', count: 61, cover: COVER.country90s },
      ],
    },
    how: {
      title: 'How AutoSort organizes Liked Songs',
      steps: [
        { title: 'Choose Liked Songs as the source', text: 'Any playlist you own can be a source. Liked Songs works the same way.' },
        {
          title: 'Accept Smart suggestions',
          text: 'AutoSort looks at genres, decades, moods and themes and suggests playlists like Country, 90s Country, Love Songs or Workout.',
        },
        { title: 'Keep liking songs', text: 'Spotify’s heart always saves to Liked Songs, so it stays your one place to add music.' },
        { title: 'The daily sync files them', text: 'New likes go into every matching playlist, newest added first. Songs you unlike are taken out.' },
      ],
    },
    uses: {
      title: 'When organizing Liked Songs helps',
      cards: [
        {
          title: 'Thousands of likes, no playlists',
          text: 'Years of liking songs left one endless list. Split it without changing how you save music.',
          chips: ['Genre: Country', 'Decade: 90s'],
        },
        {
          title: 'A family of listeners',
          text: 'Each person connects their own Spotify account and organizes their own Liked Songs. One Spotify app allows up to 5 users.',
          chips: ['Up to 5 users'],
        },
        {
          title: 'Moving off a catch-all playlist',
          text: 'The optional Move a playlist into Liked Songs keeps each song’s original date added and backs up Liked Songs first.',
          chips: ['Keeps date added', 'Backs up first'],
        },
      ],
    },
    example: {
      type: 'where',
      title: 'Example: where each song goes',
      lead: 'Made-up songs, newest liked first. One song can land in more than one playlist.',
      caption: 'Songs from Liked Songs, when they were liked, their genres and tags, and the playlists they are filed into',
      songColumn: 'Song in Liked Songs',
      columns: ['Liked on', 'Genres and tags'],
      rows: [
        { song: 'Neon Porchlight', artist: 'Sadie Vale', cells: ['Nov 12, 2026', 'country pop'], to: 'Country' },
        { song: 'Concrete Halo', artist: 'Lil Tremaine', cells: ['Nov 9, 2026', 'hip hop, trap'], to: 'Rap' },
        { song: 'Daylight Over Jordan', artist: 'Mercy Hill Collective', cells: ['Oct 30, 2026', 'worship, ccm'], to: 'Worship' },
        { song: 'Slow Dance in the Kitchen', artist: 'Odessa Cole', cells: ['Oct 21, 2026', 'r&b; tag: love songs'], to: 'R&B, Love Songs' },
        { song: 'Red Line Run', artist: 'Volt Avenue', cells: ['Sep 2, 2026', 'rock; tag: workout'], to: 'Rock, Workout' },
        { song: 'Harbor Lights', artist: 'Maren Shaw', cells: ['Aug 18, 2026', 'sea shanty'], to: 'Unmatched (you decide)' },
      ],
    },
    related: [
      { kind: 'Split', label: 'By genre', href: '/split/by-genre' },
      { kind: 'Split', label: 'By decade', href: '/split/by-decade' },
      { kind: 'Split', label: 'By mood', href: '/split/by-mood' },
      { kind: 'Sort', label: 'By date added', href: '/sort/by-date-added' },
      { kind: 'Guide', label: 'Organize a huge playlist', href: '/guides/organize-a-huge-playlist' },
      { kind: 'Docs', label: 'Add family members', href: '/docs/family' },
    ],
    faq: [
      {
        q: 'Can Liked Songs be split into playlists automatically?',
        a: 'Yes. Pick Liked Songs as AutoSort’s source and accept the suggested playlists. A daily sync files each new like into every playlist it matches.',
      },
      {
        q: 'Why use Liked Songs instead of a playlist?',
        a: 'Spotify’s heart always saves to Liked Songs, from any screen. Using it as the source means you never have to remember which playlist a song belongs in.',
      },
      {
        q: 'Will AutoSort change my Liked Songs?',
        a: 'Not unless you ask. It reads Liked Songs and writes to the playlists it creates. The one exception is the optional Move a playlist into Liked Songs, which backs up Liked Songs before it adds anything.',
      },
      {
        q: 'Can I move my main playlist into Liked Songs?',
        a: 'Yes, as an option. It keeps each song’s original date added, so newest-first order survives the move, and it backs up your Liked Songs first.',
      },
      {
        q: 'Can everyone in my family organize their own Liked Songs?',
        a: 'Yes. Each person connects their own Spotify account. In Spotify’s Development Mode one app allows up to 5 users, added by name and Spotify email under User Management in the Developer Dashboard.',
      },
      {
        q: 'What happens when I unlike a song?',
        a: 'On the next sync it’s removed from the AutoSort playlists it was filed into. Songs you added to those playlists by hand are kept.',
      },
    ],
    cta: { title: 'Turn Liked Songs into playlists', body: FREE_BODY },
  },
];

/* ---------- Sort pages ---------- */

const SORT_STEP_OPEN: FeatureStep = {
  title: 'Open any playlist you own',
  text: 'Followed playlists are read-only: Spotify only lets apps change playlists you own or collaborate on.',
};

export const sortPages: FeaturePage[] = [
  {
    kind: 'sort',
    slug: 'by-bpm',
    label: 'By BPM',
    h1: 'Sort a Spotify playlist by BPM',
    metaTitle: 'Sort a Spotify playlist by BPM',
    metaDescription:
      'Order any Spotify playlist by tempo, slowest or fastest first, or keep only a BPM range like 120–150 for workouts. Free, open-source and self-hosted.',
    quickAnswer:
      'Open the playlist in AutoSort, choose BPM as the sort mode, and pick slowest-first or fastest-first. You can also keep only a tempo range, like 120–150 BPM for a workout. Preview the new order, then save it back to Spotify or as a new playlist. It’s free and open source.',
    hero: {
      type: 'bars',
      ariaLabel: 'Example: twelve made-up tracks sorted from 72 to 174 BPM, shown as rising bars',
      note: 'Example playlist with made-up tracks.',
      title: 'Road Trip Mix',
      caption: 'sorted slowest → fastest',
      range: '72–174 BPM',
      max: 174,
      bars: bpmBars([72, 84, 92, 98, 106, 114, 122, 128, 134, 146, 160, 174]),
      axis: ['72', 'Workout zone 120–150', '174'],
    },
    how: {
      title: 'How BPM sorting works in AutoSort',
      steps: [
        SORT_STEP_OPEN,
        { title: 'Choose BPM', text: 'Slowest first, fastest first, or keep only a tempo range. Tempo comes from ReccoBeats.' },
        { title: 'Preview', text: 'Moved tracks are highlighted. Lock any song to keep it in place.' },
        { title: 'Save', text: 'Reorder the playlist itself, or save the result as a new playlist. Every save is logged with Undo.' },
      ],
    },
    uses: {
      title: 'When sorting by BPM helps',
      cards: [
        { title: 'Workouts and runs', text: 'Keep only 120–150 BPM for the gym or 150–180 for running, in tempo order.', chips: ['BPM: 120–150'] },
        {
          title: 'Smoother transitions',
          text: 'Small tempo steps between songs make a playlist flow. Sort by key as well for a harmonic mix.',
          chips: ['Order: BPM', 'Order: Harmonic mix'],
        },
        { title: 'Winding down', text: 'Fastest first ends a playlist on its slowest songs, for the end of a party or bedtime.', chips: ['Order: BPM, fastest first'] },
      ],
    },
    reference: {
      title: 'Typical BPM ranges',
      lead: 'Rough starting points, not rules. Everyone’s pace is different, so adjust the range to taste.',
      caption: 'Typical tempo ranges and the matching AutoSort BPM setting',
      columns: ['Use', 'Typical range', 'AutoSort setting'],
      rows: [
        ['Slow wind-down', 'under 90 BPM', 'BPM: 60–90'],
        ['Walking', 'about 100–120 BPM', 'BPM: 100–120'],
        ['Gym / workout', 'about 120–150 BPM', 'BPM: 120–150'],
        ['Running', 'about 150–180 BPM', 'BPM: 150–180'],
        ['House / dance sets', 'about 120–130 BPM', 'BPM: 120–130'],
      ],
      lastColumnChip: true,
      note: 'Half and double time: tempo detection can report half or double the beat you feel, so a 140 BPM track may read as 70. AutoSort’s Workout mood and harmonic mix count half and double time; a plain BPM sort uses the number as reported.',
    },
    example: {
      type: 'beforeAfter',
      title: 'Before and after',
      lead: 'Made-up tracks from an example road-trip playlist.',
      valueLabel: 'BPM',
      valueType: 'text',
      before: { caption: 'Original order', rows: BPM_BEFORE },
      after: { caption: 'Sorted by BPM, slowest first', rows: sortRows(BPM_BEFORE, 'asc') },
    },
    related: [
      { kind: 'Sort', label: 'By key (Camelot)', href: '/sort/by-key' },
      { kind: 'Sort', label: 'By energy', href: '/sort/by-energy' },
      { kind: 'Recipe', label: 'Workout', href: '/recipes/workout' },
      { kind: 'Tool', label: 'BPM & key finder', href: '/tools/bpm-key-finder' },
      { kind: 'Guide', label: 'Build a workout playlist by BPM', href: '/guides/build-a-workout-playlist-by-bpm' },
      { kind: 'Split', label: 'By mood', href: '/split/by-mood' },
    ],
    faq: [
      {
        q: 'Can I sort a Spotify playlist by BPM inside Spotify?',
        a: 'Partly. Spotify’s Smart Reorder, launched in February 2026, reorders by BPM and key inside Spotify’s Mix feature for Premium users, as a one-time reorder. AutoSort sorts any playlist you own by BPM, and smart playlists keep their order on every daily sync.',
      },
      {
        q: 'Where do the BPM numbers come from?',
        a: 'From ReccoBeats, a free audio-data service that needs no key. Spotify closed its own audio-features endpoint to new apps in November 2024. AutoSort shows how many tracks have BPM data before you save.',
      },
      {
        q: 'What about half time and double time?',
        a: 'Tempo detection sometimes reports half or double the beat you feel, so a 140 BPM trap song can read as 70. AutoSort’s harmonic mix treats 70 and 140 as close, and the Workout mood counts half and double time. A plain BPM sort uses the number as reported.',
      },
      { q: 'What happens to songs with no BPM?', a: 'They go to the end of the list, whichever direction you sort.' },
      { q: 'Can I undo it?', a: 'Yes. Every save is logged in Activity with an Undo button that puts the previous order back.' },
    ],
    cta: { title: 'Put your playlist in tempo order', body: FREE_BODY },
  },
  {
    kind: 'sort',
    slug: 'by-key',
    label: 'By key',
    h1: 'Sort a Spotify playlist by key',
    metaTitle: 'Sort a Spotify playlist by key',
    metaDescription:
      'Group a Spotify playlist by musical key, or order it so each song flows into a compatible key on the Camelot wheel. Free, open-source and self-hosted.',
    quickAnswer:
      'AutoSort sorts a Spotify playlist by key in two ways. Key order groups songs around the Camelot wheel (1A, 1B, 2A and so on). Harmonic mix goes further: it orders songs so each key flows into a compatible one while keeping tempo changes small. Preview the new order, then save it to Spotify.',
    hero: {
      type: 'harmonic',
      note: 'Example mix with made-up tracks. Transition labels are computed from the keys.',
      title: 'Harmonic mix',
      caption: 'start 8A · ±6 BPM',
      detail: 'keyName',
      tracks: [
        { key: '8A', title: 'Midnight Feed Store' },
        { key: '8A', title: 'Static on the Radio' },
        { key: '9A', title: 'Lemonade Skies' },
        { key: '9B', title: 'Neon Porchlight' },
        { key: '10B', title: 'Tailgate Summer' },
        { key: '12B', title: 'Overdrive City' },
        { key: '12A', title: 'Red Line Run' },
        { key: '1A', title: 'Concrete Halo' },
      ],
    },
    heroLink: { label: 'Learn the Camelot wheel', href: '/guides/camelot-wheel' },
    transitionGuide: true,
    how: {
      title: 'How key sorting works in AutoSort',
      steps: [
        SORT_STEP_OPEN,
        { title: 'Look up each key', text: 'ReccoBeats gives each song’s key and mode. AutoSort turns them into Camelot codes like 8A (A minor).' },
        {
          title: 'Choose Key order or Harmonic mix',
          text: 'Key order groups songs around the wheel. Harmonic mix starts in the key you pick and chooses the best-matching next song each time.',
        },
        { title: 'Preview and save', text: 'Check the transition labels, lock any song in place, then reorder the playlist or save a new one.' },
      ],
    },
    uses: {
      title: 'When sorting by key helps',
      cards: [
        { title: 'Mixes that flow', text: 'Songs in compatible keys blend without a jarring change, even with no DJ software.', chips: ['Order: Harmonic mix'] },
        { title: 'Practice sets for DJs', text: 'Hear how a crate flows before a gig, with a Camelot code on every track.', chips: ['Start key: 8A', 'BPM ±6'] },
        {
          title: 'Songs that fit together',
          text: 'Key order puts songs in the same key side by side, handy for medleys, mashups and worship sets.',
          chips: ['Order: Key'],
        },
      ],
    },
    example: {
      type: 'beforeAfter',
      title: 'Before and after',
      lead: 'Made-up tracks. The transition column shows how each song moves into the next, computed from the keys.',
      valueLabel: 'Key',
      valueType: 'key',
      keyDetail: 'name',
      transitions: true,
      before: { caption: 'Original order', rows: KEY_ROWS },
      after: { caption: 'Harmonic mix, starting at 8A', rows: inOrder(KEY_ROWS, KEY_MIX) },
    },
    related: [
      { kind: 'Sort', label: 'By Camelot key', href: '/sort/by-camelot' },
      { kind: 'Sort', label: 'By BPM', href: '/sort/by-bpm' },
      { kind: 'Guide', label: 'Camelot wheel', href: '/guides/camelot-wheel' },
      { kind: 'Tool', label: 'Camelot converter', href: '/tools/camelot-converter' },
      { kind: 'Tool', label: 'BPM & key finder', href: '/tools/bpm-key-finder' },
      { kind: 'Compare', label: 'vs Spotify Smart Reorder', href: '/compare/smart-reorder' },
    ],
    faq: [
      {
        q: 'Can Spotify sort a playlist by key?',
        a: 'Spotify’s Smart Reorder, launched in February 2026, reorders by BPM and key inside Spotify’s Mix feature for Premium users, as a one-time reorder. AutoSort works on any playlist you own and shows the Camelot code and transition for every song.',
      },
      {
        q: 'Where does the key data come from?',
        a: 'From ReccoBeats, a free audio-data service. Spotify closed its own audio-features endpoint to new apps in November 2024. Songs with no key data go to the end of the list.',
      },
      {
        q: 'What is the Camelot wheel?',
        a: 'A chart that gives each of the 24 musical keys a code from 1A to 12B: A for minor keys, B for major keys. Keys next to each other on the wheel mix smoothly, which makes harmonic mixing easy to read at a glance.',
      },
      {
        q: 'What’s the difference between Key order and Harmonic mix?',
        a: 'Key order simply groups songs by key in wheel order (1A, 1B, 2A and so on). Harmonic mix builds a path: each next song is the best match for the one before it, scored on key, BPM and energy.',
      },
      {
        q: 'Will every transition be Perfect?',
        a: 'Not always. AutoSort picks the best match left at each step, so a playlist with few compatible keys may still have a clash or two. The transition labels show you where.',
      },
    ],
    cta: { title: 'Put your playlist in key order', body: FREE_BODY },
  },
  {
    kind: 'sort',
    slug: 'by-camelot',
    label: 'By Camelot',
    h1: 'Sort a Spotify playlist by Camelot key',
    metaTitle: 'Sort a Spotify playlist by Camelot key',
    metaDescription:
      'Harmonic-mix any Spotify playlist with the Camelot wheel: pick a start key and BPM tolerance, see every transition labeled, then save. Free and open source.',
    quickAnswer:
      'Choose Harmonic mix in AutoSort, pick a starting Camelot key like 8A and a BPM tolerance like ±6, and it orders the playlist so each song moves to a compatible key: the same code, one step around the wheel, or the relative major or minor. Every transition is labeled before you save to Spotify.',
    hero: {
      type: 'harmonic',
      note: 'Example mix with made-up tracks. Transition labels are computed from the keys.',
      title: 'Harmonic mix',
      caption: 'start 4A · ±6 BPM',
      detail: 'bpm',
      tracks: [
        { key: '4A', title: 'Porch Swing Hymn', bpm: 92 },
        { key: '5A', title: 'Red Clay Radio', bpm: 95 },
        { key: '5B', title: 'Glasshouse', bpm: 97 },
        { key: '6B', title: 'Paper Lanterns', bpm: 100 },
        { key: '6A', title: 'Gravel & Grace', bpm: 102 },
        { key: '8A', title: 'Night Market', bpm: 104 },
        { key: '8B', title: 'Sunday Drive', bpm: 108 },
        { key: '9B', title: 'Halftime Parade', bpm: 112 },
      ],
    },
    heroLink: { label: 'Learn the Camelot wheel', href: '/guides/camelot-wheel' },
    transitionGuide: true,
    how: {
      title: 'How Camelot sorting works in AutoSort',
      steps: [
        SORT_STEP_OPEN,
        {
          title: 'Get Camelot codes',
          text: 'Each song’s key and mode from ReccoBeats becomes a Camelot code (8A is A minor, 8B is C major) and an Open Key code (1m, 1d).',
        },
        {
          title: 'Set the start key and tolerance',
          text: 'Harmonic mix starts with the calmest song in your start key, then picks the best next song for key, BPM and energy.',
        },
        { title: 'Read the labels, then save', text: 'Every move is labeled Perfect, Good, Energy boost or Clash. Lock songs if you like, then save to Spotify.' },
      ],
    },
    uses: {
      title: 'When Camelot sorting helps',
      cards: [
        { title: 'DJ prep without DJ software', text: 'Plan a harmonic set from a Spotify playlist and see every transition before the gig.', chips: ['Start key: 8A', 'BPM ±6'] },
        { title: 'Building energy on purpose', text: 'Energy boost moves, like 8A → 10A, lift a set without a clash.', chips: ['Energy boost'] },
        {
          title: 'Smart playlists that stay mixed',
          text: 'Give a smart playlist the Harmonic flow order and every daily sync keeps it mixed as songs come and go.',
          chips: ['Order: Harmonic flow'],
        },
      ],
    },
    example: {
      type: 'beforeAfter',
      title: 'Before and after',
      lead: 'Made-up tracks. Each key is shown in Camelot and Open Key notation, and the transition column is computed from the keys.',
      valueLabel: 'Key',
      valueType: 'key',
      keyDetail: 'openKey',
      transitions: true,
      before: { caption: 'Original order', rows: CAMELOT_ROWS },
      after: { caption: 'Harmonic mix, starting at 4A', rows: inOrder(CAMELOT_ROWS, CAMELOT_MIX) },
    },
    related: [
      { kind: 'Sort', label: 'By key', href: '/sort/by-key' },
      { kind: 'Sort', label: 'By BPM', href: '/sort/by-bpm' },
      { kind: 'Guide', label: 'Camelot wheel', href: '/guides/camelot-wheel' },
      { kind: 'Tool', label: 'Camelot converter', href: '/tools/camelot-converter' },
      { kind: 'Recipe', label: 'Harmonic Flow', href: '/recipes/harmonic-flow' },
      { kind: 'Compare', label: 'vs Spotify Smart Reorder', href: '/compare/smart-reorder' },
    ],
    faq: [
      {
        q: 'What do the Camelot codes mean?',
        a: 'Each of the 24 keys gets a number from 1 to 12 and a letter: A for minor, B for major. 8A is A minor and 8B is C major, its relative major. Moving one number around the wheel keeps the mix in a compatible key.',
      },
      {
        q: 'Which transitions count as compatible?',
        a: 'The same key is Perfect. One step around the wheel (8A to 9A), the relative major or minor (8A to 8B), or a diagonal step (8A to 9B) is Good. Two or seven steps up on the same letter (8A to 10A or 3A) is an Energy boost. Anything else is a Clash.',
      },
      {
        q: 'What does the BPM tolerance do?',
        a: 'It sets how big a tempo jump still counts as small. Inside the tolerance a jump costs a little; beyond it the cost grows quickly, so AutoSort prefers songs close in tempo. Half and double time count as close.',
      },
      {
        q: 'What is Open Key notation?',
        a: 'Another way to label the same wheel, used by some DJ software. 8A in Camelot is 1m in Open Key, and 8B is 1d. The free Camelot converter on this site shows both.',
      },
      {
        q: 'How is this different from Spotify’s Smart Reorder?',
        a: 'Smart Reorder, launched in February 2026, reorders by BPM and key inside Spotify’s Mix feature for Premium users, as a one-time reorder. AutoSort lets you pick the start key, labels every transition, and can keep smart playlists mixed on every daily sync.',
      },
    ],
    cta: { title: 'Mix your playlist around the wheel', body: FREE_BODY },
  },
  {
    kind: 'sort',
    slug: 'by-energy',
    label: 'By energy',
    h1: 'Sort a Spotify playlist by energy',
    metaTitle: 'Sort a Spotify playlist by energy',
    metaDescription:
      'Order a Spotify playlist by energy, low to high or high to low, or shape it into an arc that warms up, peaks and cools down. Free, open-source and self-hosted.',
    quickAnswer:
      'AutoSort orders a Spotify playlist by each song’s energy score from ReccoBeats. Build-up runs from calm to intense, Wind-down runs the other way, and Warm-up → peak → cool-down climbs to the most intense songs in the middle before easing off. Preview the arc, then save it back to Spotify.',
    hero: {
      type: 'bars',
      ariaLabel: 'Example: twelve made-up tracks in an energy arc that rises from 0.32 to a peak of 0.91 in the middle and falls back to 0.35',
      note: 'Example playlist with made-up tracks. Energy runs from 0 to 1.',
      title: 'Saturday Party',
      caption: 'warm-up → peak → cool-down',
      range: 'Energy 0.32–0.91',
      max: 100,
      bars: ENERGY_ARC.map((v) => ({ value: v, label: `Energy ${(v / 100).toFixed(2)}` })),
      axis: ['Warm-up', 'Peak', 'Cool-down'],
    },
    how: {
      title: 'How energy sorting works in AutoSort',
      steps: [
        SORT_STEP_OPEN,
        { title: 'Score each song', text: 'ReccoBeats gives every song an energy score from 0 (calm) to 1 (intense).' },
        { title: 'Pick a shape', text: 'Build-up, Wind-down, or Warm-up → peak → cool-down.' },
        { title: 'Preview and save', text: 'Lock any song in place, then reorder the playlist or save a new one. Every save is logged with Undo.' },
      ],
    },
    uses: {
      title: 'When sorting by energy helps',
      cards: [
        { title: 'Parties', text: 'Warm up while people arrive, peak in the middle, cool down as the night ends.', chips: ['Energy arc: Warm-up → peak → cool-down'] },
        { title: 'Workouts', text: 'Build-up starts easy and finishes with your most intense songs.', chips: ['Energy arc: Build-up'] },
        { title: 'Evenings and bedtime', text: 'Wind-down starts lively and ends on the calmest songs in the playlist.', chips: ['Energy arc: Wind-down'] },
      ],
    },
    reference: {
      title: 'Energy arc shapes',
      lead: 'Every shape uses the same 0–1 energy score. Songs without one go to the end.',
      caption: 'Energy arc shapes and what each one does',
      columns: ['Shape', 'What it does', 'AutoSort setting'],
      rows: [
        ['Build-up', 'Energy rises from the calmest song to the most intense (low to high).', 'Energy arc: Build-up'],
        ['Wind-down', 'Starts with the most intense songs and eases off (high to low).', 'Energy arc: Wind-down'],
        ['Warm-up → peak → cool-down', 'Climbs to the most intense songs in the middle, then comes back down.', 'Energy arc: Peak'],
      ],
      lastColumnChip: true,
    },
    example: {
      type: 'beforeAfter',
      title: 'Before and after',
      lead: 'Made-up tracks with example energy scores from 0 to 1.',
      valueLabel: 'Energy',
      valueType: 'text',
      before: { caption: 'Original order', rows: ENERGY_BEFORE },
      after: { caption: 'Warm-up → peak → cool-down', rows: mountain(ENERGY_BEFORE) },
    },
    related: [
      { kind: 'Sort', label: 'By BPM', href: '/sort/by-bpm' },
      { kind: 'Split', label: 'By mood', href: '/split/by-mood' },
      { kind: 'Sort', label: 'By key', href: '/sort/by-key' },
      { kind: 'Recipe', label: 'Workout', href: '/recipes/workout' },
      { kind: 'Tool', label: 'BPM & key finder', href: '/tools/bpm-key-finder' },
    ],
    faq: [
      {
        q: 'What does energy mean for a song?',
        a: 'It’s a score from 0 to 1 for how intense a song feels. A quiet acoustic ballad scores low; a loud, fast rock or dance track scores high. AutoSort gets the score from ReccoBeats.',
      },
      {
        q: 'What is an energy arc?',
        a: 'An order shaped by energy rather than a straight line. Warm-up → peak → cool-down starts gently, reaches the most intense songs in the middle and eases off at the end, like a good party or DJ set.',
      },
      {
        q: 'How is the peak arc built?',
        a: 'AutoSort lines songs up by energy, then deals them alternately to the way up and the way down. The calmest songs sit at both ends and the most intense one lands in the middle.',
      },
      { q: 'What happens to songs with no energy score?', a: 'They go to the end of the playlist, whichever shape you choose.' },
      {
        q: 'Can a smart playlist keep its energy order?',
        a: 'Yes. Set a smart playlist’s order to an energy arc and every daily sync re-applies it, so new songs land in the right place.',
      },
    ],
    cta: { title: 'Give your playlist an energy arc', body: FREE_BODY },
  },
  {
    kind: 'sort',
    slug: 'by-date-added',
    label: 'By date added',
    h1: 'Sort a Spotify playlist by date added',
    metaTitle: 'Sort a Spotify playlist by date added',
    metaDescription:
      'Put the newest songs at the top of a Spotify playlist, or the oldest, and keep smart playlists newest-first on every daily sync. Free and open source.',
    quickAnswer:
      'AutoSort reorders a Spotify playlist by the date each song was added, newest first or oldest first, and saves that order into the playlist itself. Smart playlists it creates use newest added first by default, so the songs you just added sit at the top after each daily sync.',
    hero: {
      type: 'list',
      ariaLabel: 'Example: six made-up songs in a playlist called Everything, sorted newest added first, from November 12, 2026 back to March 3, 2024',
      note: 'Example playlist with made-up songs and dates.',
      title: 'Everything',
      caption: 'newest added first',
      rows: sortRows(ADDED_BEFORE, 'desc').map((r) => ({ title: r.title, artist: r.artist, value: r.value })),
    },
    how: {
      title: 'How date-added sorting works',
      steps: [
        { title: 'Open any playlist you own', text: 'Spotify records when each song was added to a playlist. AutoSort reads that date.' },
        { title: 'Pick a direction', text: 'Newest first puts recent finds on top; oldest first plays the playlist in the order you built it.' },
        { title: 'Preview', text: 'Moved tracks are highlighted. Lock any song to keep it in place.' },
        { title: 'Save', text: 'Reorder the playlist itself, or save the result as a new playlist. Every save is logged with Undo.' },
      ],
    },
    uses: {
      title: 'When sorting by date added helps',
      cards: [
        { title: 'Hear your newest finds first', text: 'Recent additions sit at the top instead of getting buried under years of older songs.', chips: ['Order: Newest added first'] },
        {
          title: 'Smart playlists that feel fresh',
          text: 'Every AutoSort smart playlist is newest added first by default, so new matches show up at the top.',
          chips: ['Default order'],
        },
        { title: 'Replaying how a playlist grew', text: 'Oldest first plays a playlist in the order you built it, starting with the first song you added.', chips: ['Order: Oldest added first'] },
      ],
    },
    example: {
      type: 'beforeAfter',
      title: 'Before and after',
      lead: 'Made-up tracks with example dates.',
      valueLabel: 'Added',
      valueType: 'text',
      before: { caption: 'Original order', rows: ADDED_BEFORE },
      after: { caption: 'Newest added first', rows: sortRows(ADDED_BEFORE, 'desc') },
    },
    related: [
      { kind: 'Sort', label: 'By release date', href: '/sort/by-release-date' },
      { kind: 'Split', label: 'Organize Liked Songs', href: '/split/liked-songs' },
      { kind: 'Split', label: 'By genre', href: '/split/by-genre' },
      { kind: 'Docs', label: 'How smart playlists work', href: '/docs/how-it-works' },
      { kind: 'Guide', label: 'Organize a huge playlist', href: '/guides/organize-a-huge-playlist' },
    ],
    faq: [
      {
        q: 'Doesn’t Spotify already sort by date added?',
        a: 'Spotify’s sort menu changes how a playlist is shown to you. AutoSort saves the order into the playlist itself, so everyone who opens it sees the same order.',
      },
      {
        q: 'Which date does AutoSort use?',
        a: 'The date the song was added to that playlist, as Spotify records it. For Liked Songs, it’s the date you liked the song.',
      },
      {
        q: 'Why are smart playlists newest first by default?',
        a: 'So the songs you just added show up at the top after each daily sync. You can switch any smart playlist to BPM, an energy arc, harmonic flow or release year instead.',
      },
      {
        q: 'If I move my main playlist into Liked Songs, are the dates kept?',
        a: 'With AutoSort’s optional Move a playlist into Liked Songs, yes. It keeps each song’s original date added and backs up Liked Songs first.',
      },
    ],
    cta: { title: 'Keep your newest songs on top', body: FREE_BODY },
  },
  {
    kind: 'sort',
    slug: 'by-release-date',
    label: 'By release date',
    h1: 'Sort a Spotify playlist by release date',
    metaTitle: 'Sort a Spotify playlist by release date',
    metaDescription:
      'Order a Spotify playlist by release year, oldest or newest first, using original years from MusicBrainz so compilations and remasters don’t skew it.',
    quickAnswer:
      'AutoSort orders a Spotify playlist by release year, oldest first or newest first. It uses each song’s original release year from MusicBrainz, so a 1994 song on a 2015 Greatest Hits album sorts with 1994, not 2015. When MusicBrainz has no match, it uses Spotify’s album date. Preview, then save.',
    hero: {
      type: 'list',
      ariaLabel: 'Example: six made-up songs in a playlist called Throwback Mix, sorted oldest first by original release year, from 1987 to 2025',
      note: 'Example playlist with made-up songs.',
      title: 'Throwback Mix',
      caption: 'oldest first, by original year',
      rows: sortRows(RELEASE_BEFORE, 'asc').map((r) => ({ title: r.title, artist: r.artist, value: r.value, note: r.note })),
    },
    how: {
      title: 'How release-date sorting works',
      steps: [
        SORT_STEP_OPEN,
        {
          title: 'Find the original year',
          text: 'Spotify dates songs by their album. AutoSort checks each song’s ISRC on MusicBrainz and keeps the earlier, original year.',
        },
        { title: 'Pick a direction', text: 'Oldest first walks forward through the years; newest first starts with this year’s songs.' },
        { title: 'Preview and save', text: 'Lock any song in place, then reorder the playlist or save a new one. Every save is logged with Undo.' },
      ],
    },
    uses: {
      title: 'When sorting by release date helps',
      cards: [
        { title: 'A trip through the decades', text: 'Oldest first turns a mixed playlist into a timeline you can listen through.', chips: ['Order: Release year'] },
        {
          title: 'Throwback playlists that stay in order',
          text: 'Give a decade smart playlist the Release year order and every sync keeps it chronological.',
          chips: ['Decade: 90s', 'Order: Release year'],
        },
        {
          title: 'Catching remaster dates',
          text: 'Remasters and deluxe editions make old songs look new. Original years put them back in order.',
          chips: ['Original year'],
        },
      ],
    },
    example: {
      type: 'beforeAfter',
      title: 'Before and after',
      lead: 'Made-up tracks. The note shows where Spotify’s album date differs from the original year.',
      valueLabel: 'Year',
      valueType: 'text',
      before: { caption: 'Original order', rows: RELEASE_BEFORE },
      after: { caption: 'Oldest first, by original year', rows: sortRows(RELEASE_BEFORE, 'asc') },
    },
    related: [
      { kind: 'Split', label: 'By decade', href: '/split/by-decade' },
      { kind: 'Sort', label: 'By date added', href: '/sort/by-date-added' },
      { kind: 'Recipe', label: '90s Country', href: '/recipes/90s-country' },
      { kind: 'Split', label: 'By genre', href: '/split/by-genre' },
      { kind: 'Guide', label: 'Organize a huge playlist', href: '/guides/organize-a-huge-playlist' },
    ],
    faq: [
      {
        q: 'Why is an old song dated years later on Spotify?',
        a: 'Spotify dates a song by the album it sits on. If that album is a later Greatest Hits, remaster or deluxe edition, you see the newer date. AutoSort looks up the recording’s original release year on MusicBrainz instead.',
      },
      {
        q: 'Where does the original year come from?',
        a: 'From MusicBrainz, the free, open music encyclopedia, searched by each song’s ISRC. When MusicBrainz has no match, AutoSort falls back to Spotify’s album release date.',
      },
      {
        q: 'Is newest added the same as newest release?',
        a: 'No. Date added is when the song went into your playlist; release date is when the song came out. AutoSort can sort by either, and smart playlists default to newest added first.',
      },
      {
        q: 'Can a smart playlist stay in release order?',
        a: 'Yes. Set its order to Release year and every daily sync re-applies it, so new songs slot into the right year.',
      },
    ],
    cta: { title: 'Put your playlist in release order', body: FREE_BODY },
  },
];

/**
 * "What the transition labels mean" (key-sort pages). Each label's chip is computed from its
 * example pair with `transition()` from @autosort/core, so it always matches the engine.
 */
export const transitionGuide: Array<{ example: [string, string]; text: string }> = [
  { example: ['8A', '8A'], text: 'Same key (8A → 8A). The smoothest move there is.' },
  {
    example: ['8A', '9A'],
    text: 'One step around the wheel (8A → 9A or 7A), the relative major or minor (8A → 8B), or a diagonal step (8A → 9B).',
  },
  { example: ['8A', '10A'], text: 'Two steps up on the same letter (8A → 10A), or seven (8A → 3A). A deliberate lift.' },
  { example: ['8A', '2B'], text: 'Anything else. AutoSort only uses one when no compatible song is left, or when you lock a song in place.' },
];

export const featurePages: FeaturePage[] = [...splitPages, ...sortPages];

export function getFeature(kind: FeatureKind, slug: string): FeaturePage | undefined {
  return (kind === 'split' ? splitPages : sortPages).find((p) => p.slug === slug);
}

export function featurePath(page: Pick<FeaturePage, 'kind' | 'slug'>): string {
  return `/${page.kind}/${page.slug}`;
}
