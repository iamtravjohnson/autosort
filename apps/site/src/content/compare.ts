import type { FaqItem } from '@/lib/seo';

/**
 * Comparison pages (/compare/[slug]).
 *
 * Competitor facts are as of November 2026 and deliberately narrow: only what we could
 * confirm. Anything else is "Not stated" (shown in the table) or the row is left out (null).
 * No Product/Review markup for competitors.
 */

export type FeatureKey = 'price' | 'openSource' | 'split' | 'recurring' | 'bpm' | 'key' | 'energy' | 'dates' | 'more' | 'premium' | 'ready' | 'setup';

export const NOT_STATED = 'Not stated';

/** Row labels, in table order. */
export const FEATURES: Array<{ key: FeatureKey; label: string }> = [
  { key: 'price', label: 'Price' },
  { key: 'openSource', label: 'Open source' },
  { key: 'split', label: 'Splits one playlist into many' },
  { key: 'recurring', label: 'Updates automatically over time' },
  { key: 'bpm', label: 'Sort by BPM' },
  { key: 'key', label: 'Sort by key (Camelot)' },
  { key: 'energy', label: 'Sort by energy' },
  { key: 'dates', label: 'Sort by date added or release date' },
  { key: 'more', label: 'Other sort options' },
  { key: 'premium', label: 'Needs Spotify Premium' },
  { key: 'ready', label: 'Ready to use today' },
  { key: 'setup', label: 'Setup' },
];

/** AutoSort's side of every table. `yes` cells render in the success teal; `plain` in white. */
export const AUTOSORT: Record<FeatureKey, { value: string; tone: 'yes' | 'plain' }> = {
  price: { value: 'Free', tone: 'yes' },
  openSource: { value: 'Yes (MIT)', tone: 'yes' },
  split: { value: 'Yes: genre, decade, mood, clean versions, themes', tone: 'yes' },
  recurring: { value: 'Yes, a daily sync files new songs', tone: 'yes' },
  bpm: { value: 'Yes', tone: 'yes' },
  key: { value: 'Yes, harmonic mix', tone: 'yes' },
  energy: { value: 'Yes, energy arcs', tone: 'yes' },
  dates: { value: 'Yes, both', tone: 'yes' },
  more: { value: 'Artist, title', tone: 'plain' },
  premium: { value: 'The Spotify app owner needs Premium; up to 5 people per copy', tone: 'plain' },
  ready: { value: 'Yes: one-click Deploy to Vercel (early release)', tone: 'yes' },
  setup: { value: 'Self-hosted: your own Spotify developer app and hosting', tone: 'plain' },
};

export interface Comparison {
  slug: string;
  /** Competitor name as used in headings, e.g. "Spotify Smart Reorder". */
  name: string;
  /** Short name for "When to choose …", e.g. "Smart Reorder". */
  shortName: string;
  /** Breadcrumb and "Other comparisons" label. */
  label: string;
  h1: string;
  /** Full <title> (used without the " · AutoSort" suffix). */
  metaTitle: string;
  description: string;
  /** 40–60 words, answers the comparison plainly. */
  quickAnswer: string;
  /** Competitor cells. Missing key = "Not stated"; null = leave the row out. */
  them: Partial<Record<FeatureKey, string | null>>;
  chooseThem: string[];
  chooseAutoSort: string[];
  faq: FaqItem[];
}

const independent = (them: string): FaqItem => ({
  q: `Is AutoSort affiliated with ${them}?`,
  a: `No. AutoSort is an independent open-source project. It isn't affiliated with or endorsed by ${them} or Spotify.`,
});

export const comparisons: Comparison[] = [
  {
    slug: 'smart-reorder',
    name: 'Spotify Smart Reorder',
    shortName: 'Smart Reorder',
    label: 'vs Spotify Smart Reorder',
    h1: 'AutoSort vs Spotify Smart Reorder',
    metaTitle: 'AutoSort vs Spotify Smart Reorder: which should you use?',
    description:
      "Spotify's Smart Reorder reorders one playlist by BPM and key for Premium users. AutoSort splits one playlist into many and keeps them updated daily. A fair comparison.",
    quickAnswer:
      "Choose Spotify Smart Reorder if you have Premium and just want one playlist reordered by BPM and key, right inside Spotify, with no setup. Choose AutoSort if you want one big playlist split into many smart playlists that keep updating every day, with more sort orders, and you're happy to run your own free copy.",
    them: {
      price: 'Included with Spotify Premium',
      openSource: 'No, it’s part of Spotify',
      split: 'No, it reorders one playlist',
      recurring: 'No, a one-time reorder',
      bpm: 'Yes',
      key: 'Yes, by key',
      more: null,
      premium: 'Yes, Premium only',
      ready: 'Yes, since February 25, 2026',
      setup: 'None, it’s built into Spotify',
    },
    chooseThem: [
      'You want zero setup: it’s already in the Spotify app.',
      'You only need a one-time reorder of a playlist by BPM and key.',
      'You already pay for Premium and use Spotify’s Mix feature.',
      'You want something you can use today.',
    ],
    chooseAutoSort: [
      'One big playlist should feed many smaller ones: Country, 90s Country, Clean Rap, Worship.',
      'You want those playlists to keep updating every day, not reorder once.',
      'You want more orders: energy arcs, date added, release date, artist or title.',
      'You’d rather run your own free, open-source copy.',
    ],
    faq: [
      {
        q: 'Does Smart Reorder keep a playlist in order as I add songs?',
        a: "No. As of November 2026, Smart Reorder is a one-time reorder by BPM and key inside Spotify's Mix feature. AutoSort runs a daily sync that files new songs into matching smart playlists.",
      },
      {
        q: 'Do I need Spotify Premium?',
        a: 'Smart Reorder is Premium only. AutoSort runs as a Spotify developer app in Development Mode, where the app owner needs Premium and up to 5 people can use each copy.',
      },
      {
        q: 'Can I use both?',
        a: 'Yes. AutoSort creates normal Spotify playlists, so anything Spotify offers, Smart Reorder included, still works on them.',
      },
      {
        q: 'Is AutoSort made by Spotify?',
        a: "No. It's an independent open-source project, not affiliated with or endorsed by Spotify.",
      },
    ],
  },
  {
    slug: 'free-your-music',
    name: 'Free Your Music',
    shortName: 'Free Your Music',
    label: 'vs Free Your Music',
    h1: 'AutoSort vs Free Your Music',
    metaTitle: 'AutoSort vs Free Your Music: Spotify playlist sorting compared',
    description:
      'Free Your Music sorts by mood flow, energy, BPM and Camelot key, with Premium needed to apply a sort. AutoSort is free, open source and updates daily. Compared fairly.',
    quickAnswer:
      'Free Your Music previews sorts by mood flow, energy, BPM and Camelot key for free, but applying a sort needs its Premium plan (about €14.99 a quarter). AutoSort is free and open source, splits one playlist into many and keeps them updated daily. The trade-off: you run your own copy.',
    them: {
      price: 'Free preview; applying a sort needs Premium (about €14.99/quarter)',
      recurring: 'No, its daily automations don’t cover sorting',
      bpm: 'Yes',
      key: 'Yes (Camelot)',
      energy: 'Yes',
      more: 'Mood flow, danceability and more',
      ready: 'Yes',
      setup: 'No self-hosting',
    },
    chooseThem: [
      'You want to preview a mood-flow or energy sort without setting anything up.',
      'You’re fine paying for Premium to apply sorts.',
      'You want something you can use today.',
    ],
    chooseAutoSort: [
      'You want sorting by BPM, Camelot key and energy for free.',
      'One big playlist should feed many smaller ones that update every day.',
      'You want open-source code you can read and run yourself.',
    ],
    faq: [
      {
        q: 'Is Free Your Music free?',
        a: 'You can preview sorts for free. Applying a sort needs Free Your Music Premium, about €14.99 per quarter as of November 2026. AutoSort is free and open source.',
      },
      {
        q: 'Does Free Your Music keep playlists sorted automatically?',
        a: "As of November 2026, its daily automations don't cover sorting. AutoSort's daily sync files new songs into your smart playlists automatically.",
      },
      {
        q: 'Can I use both?',
        a: 'Yes. AutoSort creates normal Spotify playlists, so other tools can still read and sort them.',
      },
      independent('Free Your Music'),
    ],
  },
  {
    slug: 'skiley',
    name: 'Skiley',
    shortName: 'Skiley',
    label: 'vs Skiley',
    h1: 'AutoSort vs Skiley',
    metaTitle: 'AutoSort vs Skiley: Spotify playlist sorters compared',
    description:
      'Skiley sorts Spotify playlists by 16 properties, including BPM and Camelot key, with no setup. AutoSort is free, open source and keeps playlists updated daily. A fair look.',
    quickAnswer:
      "Skiley is a ready-to-use playlist sorter with 16 properties, including BPM, Camelot key and energy; its PRO upgrade is a one-time $9.99. It doesn't re-sort on a schedule. AutoSort is free and open source, splits one playlist into many smart playlists and updates them daily, but you host your own copy.",
    them: {
      price: 'PRO is a one-time $9.99',
      recurring: 'No; PRO automation covers discovery, not sorting',
      bpm: 'Yes',
      key: 'Yes (Camelot)',
      energy: 'Yes',
      dates: 'Date added: yes',
      more: '16 properties in all, including danceability and valence',
      ready: 'Yes',
      setup: 'No self-hosting',
    },
    chooseThem: [
      'You want to sort right away, with no self-hosting.',
      'You want lots of sort properties in one place (16 in all).',
      'A one-time sort is all you need.',
    ],
    chooseAutoSort: [
      'You want playlists to stay sorted as songs are added, every day.',
      'One big playlist should feed many smaller ones by genre, decade or mood.',
      'You want everything free and open source.',
    ],
    faq: [
      {
        q: 'Does Skiley sort by Camelot key?',
        a: 'Yes. As of November 2026, Skiley sorts by 16 properties, including BPM, key (Camelot), energy, danceability, valence and date added.',
      },
      {
        q: 'Does Skiley PRO re-sort my playlists automatically?',
        a: "No. Skiley PRO's automation covers music discovery, not sorting. PRO is a one-time $9.99. AutoSort's daily sync keeps smart playlists updated.",
      },
      {
        q: 'Can I use both?',
        a: 'Yes. AutoSort creates normal Spotify playlists, so you can still sort them with Skiley.',
      },
      independent('Skiley'),
    ],
  },
  {
    slug: 'playlistsorter',
    name: 'PlaylistSorter',
    shortName: 'PlaylistSorter',
    label: 'vs PlaylistSorter',
    h1: 'AutoSort vs PlaylistSorter',
    metaTitle: 'AutoSort vs PlaylistSorter: Spotify playlist sorting compared',
    description:
      'PlaylistSorter sorts by date, artist, name and popularity and can re-sort hourly on its Curator plan. AutoSort adds BPM, Camelot key and energy, free. Compared fairly.',
    quickAnswer:
      "PlaylistSorter sorts by date added, release date, artist, track name and popularity, and its Curator plan (about $1 a month) re-sorts every hour. It doesn't use audio features, so there's no BPM or key sort. AutoSort adds BPM, Camelot key and energy and splits one playlist into many, but you run your own copy.",
    them: {
      price: 'Curator plan about $1/month (via Ko-fi)',
      recurring: 'Yes, re-sorts every hour (Curator plan)',
      bpm: 'No (no audio features)',
      key: 'No',
      energy: 'No',
      dates: 'Yes, both',
      more: 'Artist, track name, popularity',
      ready: 'Yes',
      setup: 'No self-hosting',
    },
    chooseThem: [
      'You only need date, artist, name or popularity order.',
      'You want a re-sort every hour; AutoSort syncs daily.',
      'You’d rather not host anything yourself.',
    ],
    chooseAutoSort: [
      'You want to sort by BPM, Camelot key or energy.',
      'One big playlist should feed many smaller ones by genre, decade or mood.',
      'You want it free and open source.',
    ],
    faq: [
      {
        q: 'Can PlaylistSorter sort by BPM or key?',
        a: "No. As of November 2026, PlaylistSorter sorts by date added, release date, artist, track name and popularity, and doesn't use audio features. AutoSort gets BPM, key and energy from ReccoBeats.",
      },
      {
        q: 'Does PlaylistSorter re-sort automatically?',
        a: "Yes, on its Curator plan (about $1 a month via Ko-fi), which re-sorts every hour. AutoSort's sync runs once a day.",
      },
      {
        q: 'Can I use both?',
        a: 'Yes. AutoSort creates normal Spotify playlists, so PlaylistSorter can still sort them.',
      },
      independent('PlaylistSorter'),
    ],
  },
  {
    slug: 'sortbytune',
    name: 'Sort by Tune',
    shortName: 'Sort by Tune',
    label: 'vs Sort by Tune',
    h1: 'AutoSort vs Sort by Tune',
    metaTitle: 'AutoSort vs Sort by Tune: Spotify playlist sorters compared',
    description:
      'Sort by Tune is a free Spotify sorter with beat, energy, Camelot key and genre, and no setup. AutoSort splits one playlist into many and updates them daily. A fair look.',
    quickAnswer:
      "Sort by Tune is free (with a tip jar) and needs no setup. It sorts by beat, energy, Camelot key, genre, valence, popularity and year, and lets you lock or move tracks, but it doesn't re-sort on a schedule. AutoSort splits one playlist into many and keeps them updated daily, on your own free copy.",
    them: {
      price: 'Free, with a tip jar',
      recurring: 'No',
      bpm: 'Yes ("beat": BPM plus danceability)',
      key: 'Yes (Camelot)',
      energy: 'Yes',
      dates: 'By year',
      more: 'Genre, valence, popularity; lock or move tracks',
      ready: 'Yes',
      setup: 'No self-hosting',
    },
    chooseThem: [
      'You want a free sorter with no self-hosting.',
      'You want to lock or move tracks while you sort.',
      'A one-time sort is all you need.',
    ],
    chooseAutoSort: [
      'You want playlists to stay sorted as songs are added, every day.',
      'One big playlist should feed many smaller ones by genre, decade or mood.',
      'You want open-source code you can read and run yourself.',
    ],
    faq: [
      {
        q: 'Is Sort by Tune free?',
        a: "Yes. As of November 2026, it's free, with a tip jar.",
      },
      {
        q: 'Does Sort by Tune keep playlists sorted?',
        a: "No, it doesn't re-sort on a schedule. AutoSort's daily sync files new songs into your smart playlists and keeps their order.",
      },
      {
        q: 'Can I use both?',
        a: 'Yes. AutoSort creates normal Spotify playlists, so you can still sort them with Sort by Tune.',
      },
      independent('Sort by Tune'),
    ],
  },
  {
    slug: 'sort-your-music-alternative',
    name: 'Sort Your Music',
    shortName: 'Sort Your Music',
    label: 'Sort Your Music alternative',
    h1: 'Sort Your Music alternative: AutoSort',
    metaTitle: 'Sort Your Music alternative: AutoSort (free and open source)',
    description:
      'Looking for a Sort Your Music alternative? AutoSort is free and open source too, and adds Camelot key order and daily updates. Here is where each one wins.',
    quickAnswer:
      'Sort Your Music, by Paul Lamere, is free, open source and simple: it sorts by BPM, energy, danceability, release date and more. It has no key or Camelot sort and no scheduled sorting, and users reported login errors in 2025. AutoSort adds Camelot order, splits one playlist into many and files new songs daily.',
    them: {
      price: 'Free',
      openSource: 'Yes',
      recurring: 'No scheduled sorting',
      bpm: 'Yes',
      key: 'No key or Camelot sort',
      energy: 'Yes',
      dates: 'Yes, both',
      more: 'Danceability, loudness, valence, length, acousticness, popularity, artist separation',
      ready: 'Yes, though users reported login errors in 2025',
      setup: 'No self-hosting',
    },
    chooseThem: [
      'You want something simple and free, with no self-hosting.',
      'A one-time sort by BPM, energy or danceability is enough.',
      'You like its extra orders, such as loudness, length and artist separation.',
    ],
    chooseAutoSort: [
      'You want harmonic (Camelot) order.',
      'You want playlists to keep updating every day.',
      'One big playlist should feed many smaller ones by genre, decade or mood.',
      'You want an open-source tool you run yourself.',
    ],
    faq: [
      {
        q: 'Why look for a Sort Your Music alternative?',
        a: "Sort Your Music has no key or Camelot sort and no scheduled sorting, and some users reported login errors in 2025. If it works for you, it's still a simple, free choice.",
      },
      {
        q: 'Is AutoSort open source like Sort Your Music?',
        a: 'Yes. Both are free and open source. AutoSort uses the MIT license.',
      },
      {
        q: 'Who makes Sort Your Music?',
        a: 'Paul Lamere. AutoSort is a separate, independent project.',
      },
      independent('Sort Your Music'),
    ],
  },
];

export function getComparison(slug: string): Comparison | undefined {
  return comparisons.find((c) => c.slug === slug);
}
