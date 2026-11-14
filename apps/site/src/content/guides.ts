import type { FaqItem } from '@/lib/seo';

/**
 * Long-form guides at /guides/[slug].
 *
 * Inline markup inside any text string: `**bold**` and `[label](/path)`.
 * Note: /guides/camelot-wheel is its own static page and must never be added here.
 */

export type GuideBlock =
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'table'; caption: string; head: string[]; rows: string[][] };

export interface GuideSection {
  id: string;
  title: string;
  blocks: GuideBlock[];
}

export interface Guide {
  slug: string;
  /** H1 and Article headline. */
  title: string;
  /** Short name for breadcrumbs. */
  crumb: string;
  category: string;
  /** Meta description. */
  description: string;
  /** One line for the guides index. */
  summary: string;
  /** 40–60 words, directly under the H1. */
  quickAnswer: string;
  takeaways: string[];
  sections: GuideSection[];
  /** Inline call-to-action card, placed after the section with this id. */
  cta: { after: string; title: string; text: string; label: string; href: string };
  faq: FaqItem[];
  related: Array<{ label: string; href: string }>;
}

export const guides: Guide[] = [
  {
    slug: 'organize-a-huge-playlist',
    title: 'How to organize a huge Spotify playlist',
    crumb: 'Organize a huge playlist',
    category: 'Organize',
    description:
      'A big Spotify playlist stops working past a few hundred songs. Keep one place to add music, split it into smaller playlists that update themselves, then fix the order.',
    summary: 'Keep one place to add songs, and let everything else sort itself.',
    quickAnswer:
      'Keep adding songs to one playlist, but split it into smaller playlists by genre, decade or mood, and let those update themselves. Then fix the order inside each one. A tool like AutoSort does the splitting and daily updates for you, so the big playlist stays your inbox.',
    takeaways: [
      'Shuffle and "newest first" both bury most of a big playlist.',
      "Don't change how you save songs. Change what happens after.",
      'Rules (genre is Country AND year is 1990s) beat hand-sorting.',
      'Order matters too: BPM or key order turns a list into a set.',
    ],
    sections: [
      {
        id: 'why',
        title: 'Why big playlists stop working',
        blocks: [
          {
            type: 'p',
            text: 'Past a few hundred songs, most people only hear the newest additions at the top. Shuffle helps a little, but it mixes a worship song into a workout and a slow ballad into a road trip. The playlist is doing two jobs at once: collecting what you like and deciding what to play right now.',
          },
          {
            type: 'p',
            text: "Neither job is wrong. They just want different things. Collecting wants one place and no friction: you hear a song, you tap save, you move on. Listening wants a smaller set that fits the moment, whether that's a run, a Sunday morning or a car full of kids.",
          },
          {
            type: 'p',
            text: "Spotify's sort menu can change how you view a playlist, by title, artist, album or date added, but it doesn't change what's in it. A 2,000-song playlist sorted by artist is still a 2,000-song playlist. The fix is to stop asking one playlist to do both jobs.",
          },
        ],
      },
      {
        id: 'keep',
        title: 'Keep one place to add songs',
        blocks: [
          {
            type: 'p',
            text: 'The habit of adding everything to one playlist is a good one. Keep it. Treat that playlist as an inbox: the only job is "I like this." Everything else should happen downstream.',
          },
          {
            type: 'p',
            text: "Some people keep one big playlist (call it Everything, Favorites or anything you like); some use Liked Songs. Either works, as long as it's the one place you save to. If your saves are already spread across a few playlists, pick one as the main inbox and leave the others alone for now.",
          },
          {
            type: 'p',
            text: 'Why not organize as you save? Because it adds a decision every time you hear something you like. Is this country or rock? Workout or road trip? Most people stop answering those questions after a week, and the organized playlists go stale while the big one keeps growing.',
          },
          {
            type: 'ul',
            items: [
              '**One inbox**: the only playlist you save new music to.',
              '**Anything goes**: every genre, decade and mood, mixed together.',
              '**No upkeep**: you never have to clean it up by hand.',
            ],
          },
        ],
      },
      {
        id: 'split',
        title: 'Split it into smaller playlists',
        blocks: [
          { type: 'p', text: 'Pick splits that match how you actually listen. Most people end up with three kinds:' },
          {
            type: 'ul',
            items: [
              '**Genre**: Country, Rap, Worship.',
              '**Genre + decade**: 90s Country, 2000s Pop.',
              '**Moment**: Workout, Happy, Love Songs, a Clean version for the car.',
            ],
          },
          {
            type: 'p',
            text: "Start with three to five. It's easy to add more later, and a dozen half-empty playlists is its own kind of mess. A song that lands in two playlists is fine, and some songs won't fit any of them yet.",
          },
          {
            type: 'p',
            text: "Use the facts each song already carries. **Genre** comes from the artist's genres on Spotify. **Decade** comes from the release year, ideally the original one, so a greatest-hits reissue doesn't drag a 1994 song into 2005. **Mood and tempo** come from audio data like energy, valence (how positive a song sounds) and BPM. **Clean versions** come from Spotify's explicit flag.",
          },
          {
            type: 'p',
            text: "To do it by hand, create the smaller playlists in Spotify, then work through the big one and add each song where it belongs. It works, but a few hundred songs takes an evening, and it's out of date the next time you save something. To skip that, start from a ready-made rule in the [recipes](/recipes), like [90s Country](/recipes/90s-country) or [Clean Rap](/recipes/clean-rap).",
          },
        ],
      },
      {
        id: 'update',
        title: 'Make them update themselves',
        blocks: [
          {
            type: 'p',
            text: 'Hand-sorted playlists go stale the week you make them. Rules don\'t. A rule like "genre is Country and release year is 1990–1999" can be re-checked every day, so new songs land in the right place without you touching anything.',
          },
          {
            type: 'p',
            text: "That's how AutoSort works. Each smart playlist is a set of rules pointed at your source playlist. A daily sync reads the source and files each new song into every playlist whose rules it matches. The playlists show up in Spotify with names like \"Country (AutoSort)\", so they play anywhere Spotify does.",
          },
          { type: 'p', text: 'Each daily sync:' },
          {
            type: 'ul',
            items: [
              'Adds new songs that match, newest first unless you pick another order.',
              'Removes songs you took out of the source playlist.',
              'Keeps songs you added to a smart playlist by hand, and respects any you pinned or excluded.',
              'Logs the run, so you can undo it.',
            ],
          },
          {
            type: 'p',
            text: "Rules have one more advantage: you can read them. If a song lands somewhere odd, you can see which rule matched and change it. AutoSort doesn't run AI on your Spotify data, which Spotify's developer policy doesn't allow anyway. See [how smart playlists work](/docs/how-it-works) for the details.",
          },
          {
            type: 'p',
            text: "Without a tool, the closest you'll get is a weekly habit: sort the big playlist by date added, look at what's new, and drag each song into its smaller playlists.",
          },
        ],
      },
      {
        id: 'order',
        title: 'Fix the order inside each one',
        blocks: [
          {
            type: 'p',
            text: 'Once a playlist has the right songs, order turns it into a listening experience: slow to fast for a workout, an energy arc for a party, or [harmonic key order](/guides/camelot-wheel) so songs blend. Pick an order per playlist:',
          },
          {
            type: 'ul',
            items: [
              '**Newest added first**: the default, and right for most genre playlists, where your latest finds belong at the top.',
              '**BPM, slow to fast**: for workouts and runs. See [sort by BPM](/sort/by-bpm).',
              '**Energy arc**: warm-up, peak and cool-down, for parties and long sessions. See [sort by energy](/sort/by-energy).',
              '**Harmonic (Camelot)**: each song in a key that blends into the next, like a DJ set. See [sort by key](/sort/by-key).',
              '**Release date**: oldest to newest, a good fit for decade playlists. See [sort by release date](/sort/by-release-date).',
            ],
          },
          {
            type: 'p',
            text: "Spotify's own [Smart Reorder](/compare/smart-reorder), added in February 2026, reorders by BPM and key inside its Mix feature for Premium users. It's a one-time reorder, though, so songs you add later aren't placed for you. In AutoSort, the order is part of the playlist's settings, and every sync keeps it.",
          },
          {
            type: 'p',
            text: 'Shuffle still has its place. But once each playlist is small and on theme, shuffle stops serving a worship song in the middle of a workout.',
          },
        ],
      },
    ],
    cta: {
      after: 'keep',
      title: 'Let AutoSort do the splitting',
      text: 'Free, open source, runs on your own account.',
      label: 'Try it',
      href: '/split/by-genre',
    },
    faq: [
      {
        q: 'How many songs is "huge"?',
        a: "Anything past a few hundred, where you stop scrolling to the bottom. The founder's own main playlist has about 362 songs, and that was already enough to want it split.",
      },
      {
        q: "Should I delete songs I've skipped?",
        a: 'Not yet. Split first. A song that felt wrong in shuffle often fits perfectly in the right smaller playlist.',
      },
      {
        q: 'Will splitting change my original playlist?',
        a: 'No. AutoSort reads your source playlist and writes separate playlists, named like "Country (AutoSort)". The source stays exactly as it is.',
      },
      {
        q: 'Can one song be in more than one smaller playlist?',
        a: 'Yes. Each playlist checks its own rules, so a 90s country love song can land in both 90s Country and Love Songs.',
      },
      {
        q: 'Does AutoSort use AI to sort my music?',
        a: "No. Spotify's developer policy doesn't allow feeding Spotify data to AI models. AutoSort uses rules you can read and edit, with audio data from ReccoBeats, release years from MusicBrainz and optional tags from Last.fm.",
      },
      {
        q: 'Do I need Spotify Premium?',
        a: "To run AutoSort, the person who creates the Spotify developer app needs Premium. Spotify's Development Mode allows up to 5 people per app, so one AutoSort can cover a family.",
      },
    ],
    related: [
      { label: 'Organize your Liked Songs', href: '/split/liked-songs' },
      { label: 'The Camelot wheel, explained', href: '/guides/camelot-wheel' },
      { label: 'Make a clean version of any playlist', href: '/split/clean-versions' },
    ],
  },
  {
    slug: 'build-a-workout-playlist-by-bpm',
    title: 'How to build a Spotify workout playlist by BPM',
    crumb: 'Workout playlist by BPM',
    category: 'Workout',
    description:
      'Pick a tempo range for your workout, keep only high-energy songs in it, and order them so the energy builds. Typical BPM ranges for walking, lifting and running.',
    summary: 'Pick a tempo range, filter for energy, and order songs so the session builds.',
    quickAnswer:
      "Pick a tempo range that fits your workout, about 110–140 BPM for lifting and 150–180 for running, then keep only high-energy songs in that range and order them so the energy builds. AutoSort's Workout recipe does this automatically from your own playlist and adds new matches every day.",
    takeaways: [
      'Tempo (BPM) sets the pace; energy sets the intensity. A good workout playlist uses both.',
      'For running, match songs to your steps per minute, or to half of it.',
      'Tempo detection can read a song at double or half speed, so check odd matches.',
      'Order matters: build the energy up, or warm up, peak and cool down.',
    ],
    sections: [
      {
        id: 'why-bpm',
        title: 'Why BPM matters for a workout',
        blocks: [
          {
            type: 'p',
            text: "Tempo is the speed of a song's beat, counted in beats per minute (BPM). When you run, ride or lift to music, it's natural to fall in with the beat. A song at the wrong tempo either drags you down or rushes you.",
          },
          {
            type: 'p',
            text: "BPM isn't the whole story. A slow-building ballad and a hard-hitting anthem can share the same tempo. That's why a good workout playlist also filters on **energy**: how loud, dense and intense a track feels, measured from 0 to 100%.",
          },
        ],
      },
      {
        id: 'ranges',
        title: 'Pick a BPM range for your workout',
        blocks: [
          { type: 'p', text: 'These are common starting points, not rules. Nudge them up or down to match your own pace.' },
          {
            type: 'table',
            caption: 'Typical BPM ranges by activity',
            head: ['Activity', 'BPM range', 'Why it works'],
            rows: [
              ['Warm-up and cool-down', '90–115', 'Easy to move to without pushing the pace.'],
              ['Walking', '100–120', 'Close to a brisk walking step.'],
              ['Strength training', '110–140', 'Steady drive between and during sets.'],
              ['Cycling and spin', '120–150', 'Fits a moderate-to-fast pedal rhythm.'],
              ['Jogging', '140–160', 'Matches a relaxed running stride.'],
              ['Running', '150–180', 'Matches a quicker cadence, one step per beat.'],
            ],
          },
          {
            type: 'p',
            text: 'For running, count your steps for 30 seconds and double it. That number is your cadence in steps per minute, and many runners land somewhere around 160–180. A song at that BPM puts one step on each beat. A song at half that tempo, around 80–90 BPM, works too: you take two steps per beat.',
          },
        ],
      },
      {
        id: 'find-bpm',
        title: 'Find the BPM of your songs',
        blocks: [
          {
            type: 'p',
            text: "Spotify doesn't list BPM next to songs in your playlists, and in November 2024 it closed its audio-features data to new developer apps. Tools now get tempo elsewhere. AutoSort uses ReccoBeats, a free service that returns tempo, key, energy and more for Spotify tracks.",
          },
          {
            type: 'p',
            text: 'To check a single song, paste its Spotify link into the free [BPM and key finder](/tools/bpm-key-finder).',
          },
          {
            type: 'p',
            text: 'One catch: tempo detection sometimes reads a song at double or half its real speed. A 170 BPM drum-and-bass track can come back as 85, and a slow jam can come back at twice its feel. When a calm song turns up in your running list, that is usually why.',
          },
        ],
      },
      {
        id: 'build',
        title: 'Build the playlist with rules',
        blocks: [
          {
            type: 'p',
            text: "By hand, you'd look up each song's BPM and copy the matches into a new playlist. With rules, you describe the playlist once:",
          },
          {
            type: 'ul',
            items: [
              '**Workout**: energy 70% or more with a tempo of 115–165 BPM, where double- or half-time counts. Songs tagged workout, gym or running on Last.fm count too. That\'s the [Workout recipe](/recipes/workout).',
              '**Running 160+**: a tempo of 155 BPM or faster, ordered slow to fast. That\'s the [Running 160+ recipe](/recipes/running-160-bpm).',
              '**Your own range**: for example "BPM 120–150 and energy 70%+" for a steady gym mix.',
            ],
          },
          {
            type: 'p',
            text: 'In AutoSort, each of these is a smart playlist fed by your main playlist. The daily sync adds new songs that fit and drops ones you removed from the source, so the workout playlist stays fresh without a weekly cleanup.',
          },
          {
            type: 'p',
            text: "Songs without tempo data won't match a BPM rule. If a favorite is missing, add it to the workout playlist by hand; manual adds are kept on every sync.",
          },
        ],
      },
      {
        id: 'order',
        title: 'Order it like a workout',
        blocks: [
          { type: 'p', text: 'Once the songs are right, the order decides how the session feels:' },
          {
            type: 'ul',
            items: [
              '**Build**: lowest energy first, most intense last. The Workout recipe uses this.',
              '**Warm-up, peak, cool-down**: energy rises to the middle and comes back down. Good for classes and long sessions.',
              '**BPM, slow to fast**: the tempo climbs steadily. The Running 160+ recipe uses this.',
            ],
          },
          {
            type: 'p',
            text: 'Read more in [sort by BPM](/sort/by-bpm) and [sort by energy](/sort/by-energy). If you mix your own sets, the [Camelot wheel guide](/guides/camelot-wheel) shows how to keep keys compatible too.',
          },
        ],
      },
    ],
    cta: {
      after: 'ranges',
      title: 'Start from the Workout recipe',
      text: 'High energy, 115–165 BPM, building intensity. Copy it or import it.',
      label: 'See recipe',
      href: '/recipes/workout',
    },
    faq: [
      {
        q: 'What BPM is best for running?',
        a: 'It depends on your cadence. Count your steps for 30 seconds and double it. Many runners land around 160–180 steps per minute, so songs at 160–180 BPM, or 80–90 BPM at half-time, line up with your stride.',
      },
      {
        q: 'What BPM is good for lifting weights?',
        a: "Most people like 110–140 BPM for strength work. Tempo matters less than energy here, so filter for high-energy songs and don't worry about matching reps to beats.",
      },
      {
        q: 'Why does a slow song show up with a high BPM?',
        a: 'Tempo detection can count a song at double or half its real speed, so a 75 BPM song may read as 150. Exclude that song, or add an energy rule so calmer songs drop out.',
      },
      {
        q: 'Does Spotify show the BPM of a song?',
        a: 'Not in your playlists. Spotify also stopped giving new developer apps its audio-features data in November 2024, so tools like AutoSort get tempo from other sources such as ReccoBeats.',
      },
      {
        q: 'Can I make a clean workout playlist?',
        a: "Yes. Add a clean-only rule, which leaves out tracks Spotify flags as explicit. Songs that aren't flagged still get in, so give new matches a listen.",
      },
    ],
    related: [
      { label: 'Sort a playlist by BPM', href: '/sort/by-bpm' },
      { label: 'How to organize a huge Spotify playlist', href: '/guides/organize-a-huge-playlist' },
      { label: 'The Camelot wheel, explained', href: '/guides/camelot-wheel' },
    ],
  },
];

/** The featured "Start here" guide on /guides. */
export const FEATURED_GUIDE = 'organize-a-huge-playlist';

export function getGuide(slug: string): Guide | undefined {
  return guides.find((g) => g.slug === slug);
}

/* ---------- Read time ---------- */

const stripMarkup = (s: string) => s.replace(/\*\*/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
const words = (s: string) => stripMarkup(s).split(/\s+/).filter(Boolean).length;

/** Minutes to read at ~220 words per minute, counted from the guide's own text. */
export function readMinutes(g: Guide): number {
  let n = words(g.quickAnswer) + g.takeaways.reduce((t, s) => t + words(s), 0);
  for (const section of g.sections) {
    n += words(section.title);
    for (const b of section.blocks) {
      if (b.type === 'p') n += words(b.text);
      else if (b.type === 'table') n += [...b.head, ...b.rows.flat()].reduce((t, s) => t + words(s), 0);
      else n += b.items.reduce((t, s) => t + words(s), 0);
    }
  }
  n += g.faq.reduce((t, f) => t + words(f.q) + words(f.a), 0);
  return Math.max(1, Math.round(n / 220));
}

/* ---------- Guides index ---------- */

export interface GuideListItem {
  category: string;
  title: string;
  href: string;
  minutes: number;
}

/**
 * Rows on /guides (the featured guide is shown separately). Only pages that exist:
 * guides from this file, the Camelot wheel guide, and the docs for family and self-hosting.
 */
export function guideList(): GuideListItem[] {
  const own = guides
    .filter((g) => g.slug !== FEATURED_GUIDE)
    .map((g) => ({ category: g.category, title: g.title, href: `/guides/${g.slug}`, minutes: readMinutes(g) }));
  return [
    { category: 'Mixing', title: 'The Camelot wheel, explained', href: '/guides/camelot-wheel', minutes: 8 },
    ...own,
    { category: 'Family', title: 'Share one AutoSort with your family', href: '/docs/family', minutes: 3 },
    { category: 'Self-hosting', title: 'Run your own AutoSort: quick start', href: '/docs/quick-start', minutes: 15 },
  ];
}
