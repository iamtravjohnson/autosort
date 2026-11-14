import { findRecipe, type Condition, type OrderSpec, type Rule } from '@autosort/core';

/** Filter groups on /recipes. "Recent" covers date-added recipes like New This Month. */
export const RECIPE_CATEGORIES = ['Genre', 'Decade', 'Mood', 'Workout', 'Clean', 'Harmonic', 'Recent'] as const;
export type RecipeCategory = (typeof RECIPE_CATEGORIES)[number];

/** A tweak on a recipe: extra conditions (ANDed with the recipe's rule) and/or a different order. */
export interface RecipeVariation {
  name: string;
  add?: Condition[];
  order?: OrderSpec;
}

export interface SiteRecipe {
  slug: string;
  /** Display name, also the name in the copied recipe JSON. */
  name: string;
  /** Primary filter group (shown first). */
  category: RecipeCategory;
  /** Extra filter groups the recipe also appears under. */
  alsoIn?: RecipeCategory[];
  /** Cover gradient stops (linear-gradient 145deg), from the design's playlist covers. */
  cover: [from: string, to: string];
  /** One line for cards and meta descriptions. */
  description: string;
  /** 40–60 words, shown directly under the H1. */
  quickAnswer: string;
  whoFor: string[];
  variations: RecipeVariation[];
  /** Engine rule (`@autosort/core` Rule). */
  rule: Rule;
  /** Engine order (`@autosort/core` OrderSpec). */
  order: OrderSpec;
}

const NEWEST: OrderSpec = { by: 'addedAt', direction: 'desc' };

/** Rule and order straight from the engine's RECIPES, so the site never drifts from what AutoSort runs. */
function engine(slug: string): Pick<SiteRecipe, 'rule' | 'order'> {
  const r = findRecipe(slug);
  if (!r) throw new Error(`@autosort/core has no recipe "${slug}"`);
  return { rule: r.rule, order: r.order };
}

/**
 * Every recipe on autosort.app/recipes. The first eleven come from the engine's built-in RECIPES;
 * 2000s Pop, Running 160+ and New This Month are plain engine rules defined here.
 */
export const recipes: SiteRecipe[] = [
  {
    slug: '90s-country',
    name: '90s Country',
    category: 'Decade',
    alsoIn: ['Genre'],
    cover: ['#B45309', '#451A03'],
    description: 'Every country song first released 1990–1999.',
    quickAnswer:
      'This recipe builds a Spotify playlist of every country song first released from 1990 to 1999 in your source playlist. It uses the original release year, so a 1994 hit on a 2005 greatest-hits album still counts. Import it, pick your source, and new 90s country songs land here on each daily sync.',
    whoFor: [
      'Country fans with a big mixed playlist who want the 90s ones on their own.',
      'Road trips and cookouts where everyone knows the words.',
      'A starting point for tighter variations, like clean only or love songs.',
    ],
    variations: [
      { name: 'Clean 90s Country', add: [{ field: 'explicit', is: false }] },
      { name: '90s Country Love Songs', add: [{ field: 'theme', in: ['love'] }] },
      { name: '90s Country Dance Hall', add: [{ field: 'bpm', min: 110, max: 140 }] },
    ],
    ...engine('90s-country'),
  },
  {
    slug: 'clean-rap',
    name: 'Clean Rap',
    category: 'Clean',
    alsoIn: ['Genre'],
    cover: ['#38BDF8', '#1E3A8A'],
    description: 'Hip-hop with explicit tracks left out.',
    quickAnswer:
      "This recipe builds a Spotify playlist of the rap in your source playlist with every track Spotify marks explicit left out. It's made for the car with the kids. Import it, pick your source, and new clean rap songs land here on each daily sync, while explicit ones stay out.",
    whoFor: [
      'Parents who want rap in the car without reaching for skip.',
      'Shared speakers at work, practice or the gym.',
      'Anyone who saved the explicit versions and wants a quick filter, not a second library.',
    ],
    variations: [
      { name: 'Clean 2000s Rap', add: [{ field: 'decade', in: [2000] }] },
      { name: 'Clean Rap Workout', add: [{ field: 'mood', in: ['workout'] }] },
      { name: 'Clean Party Rap', add: [{ field: 'mood', in: ['party'] }] },
    ],
    ...engine('clean-rap'),
  },
  {
    slug: 'worship',
    name: 'Sunday Worship',
    category: 'Genre',
    cover: ['#FDE68A', '#B45309'],
    description: 'Worship, gospel and Christian music.',
    quickAnswer:
      "This recipe builds a Spotify playlist of the worship, gospel and Christian music in your source playlist. A song counts if its artist's Spotify genres or its Last.fm tags say worship, CCM, gospel or praise. Import it, pick your source, and new worship songs land here on each daily sync.",
    whoFor: [
      'Sunday mornings, from the drive to church to the kitchen after.',
      'Families who share one big playlist but want worship on its own.',
      'A calm start to the day without scrolling past everything else.',
    ],
    variations: [
      { name: 'Calm Worship', add: [{ field: 'energy', max: 0.6 }] },
      { name: 'Upbeat Worship', add: [{ field: 'mood', in: ['happy'] }] },
      { name: 'Worship Set', order: { by: 'harmonic', bpmTolerance: 8 } },
    ],
    ...engine('worship'),
  },
  {
    slug: 'workout',
    name: 'Workout',
    category: 'Workout',
    alsoIn: ['Mood'],
    cover: ['#F97316', '#7F1D1D'],
    description: 'High-energy songs at 115–165 BPM, building intensity.',
    quickAnswer:
      'This recipe builds a Spotify workout playlist from your source playlist: high-energy songs between 115 and 165 BPM, ordered so the energy builds as you go. It also picks up songs tagged workout, gym or running. Import it, pick your source, and new matches land here on each daily sync.',
    whoFor: [
      'Lifting, spin and gym sessions where tempo keeps you moving.',
      'Anyone whose workout songs are buried in a big everyday playlist.',
      'Runners who want a starting point before tuning the BPM range.',
    ],
    variations: [
      { name: 'Workout 120–150 BPM', add: [{ field: 'bpm', min: 120, max: 150 }] },
      { name: 'Clean Workout', add: [{ field: 'explicit', is: false }] },
      { name: 'Warm-up, peak, cool-down', order: { by: 'energyArc', shape: 'mountain' } },
    ],
    ...engine('workout'),
  },
  {
    slug: 'sad',
    name: 'Sad Songs',
    category: 'Mood',
    cover: ['#818CF8', '#312E81'],
    description: 'Low energy, low mood.',
    quickAnswer:
      'This recipe builds a Spotify playlist of the sad songs in your source playlist: tracks with a low, melancholy feel and calmer energy. Songs tagged sad or melancholy count too. Import it, pick your source, and new matches land here on each daily sync, so the mood is there when you need it.',
    whoFor: [
      'Rainy days and late nights when you want to feel it.',
      'Breakups, without hunting for the right songs.',
      'Quiet evenings when upbeat songs feel wrong.',
    ],
    variations: [
      { name: 'Breakup Songs', add: [{ field: 'theme', in: ['breakup'] }] },
      { name: 'Sad Country', add: [{ field: 'genre', in: ['country'] }] },
      { name: 'Sad, winding down', order: { by: 'energyArc', shape: 'windDown' } },
    ],
    ...engine('sad'),
  },
  {
    slug: 'love-songs',
    name: 'Love Songs',
    category: 'Mood',
    cover: ['#F472B6', '#831843'],
    description: 'Warm and romantic, from tags and titles.',
    quickAnswer:
      'This recipe builds a Spotify playlist of the love songs in your source playlist. A song counts if its Last.fm tags say love, romantic or wedding, or its title says love. Import it, pick your source, and new love songs land here on each daily sync, newest first.',
    whoFor: [
      'Date nights, anniversaries and dinner at home.',
      'Wedding and slow-dance ideas pulled from songs you already love.',
      'Anyone who wants a romantic mix without building it by hand.',
    ],
    variations: [
      { name: '90s Love Songs', add: [{ field: 'decade', in: [1990] }] },
      { name: 'Country Love Songs', add: [{ field: 'genre', in: ['country'] }] },
      { name: 'Slow Dance', add: [{ field: 'bpm', max: 100 }] },
    ],
    ...engine('love-songs'),
  },
  {
    slug: 'happy',
    name: 'Happy',
    category: 'Mood',
    cover: ['#FBBF24', '#F472B6'],
    description: 'Bright, upbeat, feel-good songs.',
    quickAnswer:
      'This recipe builds a Spotify playlist of the happy songs in your source playlist: tracks with a bright, positive sound and enough energy to lift a room. Songs tagged happy, upbeat or feel good count too. Import it, pick your source, and new happy songs land here on each daily sync.',
    whoFor: [
      'Mornings, chores and anything that needs a lift.',
      'Family car rides where everyone needs a good mood.',
      'Cookouts and get-togethers where the vibe should stay up.',
    ],
    variations: [
      { name: 'Happy Country', add: [{ field: 'genre', in: ['country'] }] },
      { name: 'Clean & Happy', add: [{ field: 'explicit', is: false }] },
      { name: 'Happy, mixed by key', order: { by: 'harmonic', bpmTolerance: 8 } },
    ],
    ...engine('happy'),
  },
  {
    slug: '2000s-pop',
    name: '2000s Pop',
    category: 'Decade',
    alsoIn: ['Genre'],
    cover: ['#F472B6', '#7C2D12'],
    description: 'Pop first released 2000–2009.',
    quickAnswer:
      'This recipe builds a Spotify playlist of every pop song first released from 2000 to 2009 in your source playlist. It uses the original release year, so a 2004 hit on a later compilation still counts. Import it, pick your source, and new 2000s pop songs land here on each daily sync.',
    whoFor: [
      'Anyone who grew up on 2000s radio and still has it all saved.',
      'Throwback parties and karaoke nights.',
      'Road trips with friends who know every word.',
    ],
    variations: [
      { name: 'Clean 2000s Pop', add: [{ field: 'explicit', is: false }] },
      { name: '2000s Pop Party', add: [{ field: 'mood', in: ['party'] }] },
      { name: '2000s Pop, slow to fast', order: { by: 'bpm', direction: 'asc' } },
    ],
    rule: {
      match: 'all',
      conditions: [
        { field: 'genre', in: ['pop'] },
        { field: 'decade', in: [2000] },
      ],
    },
    order: NEWEST,
  },
  {
    slug: 'harmonic-flow',
    name: 'Harmonic Flow',
    category: 'Harmonic',
    cover: ['#8B5CF6', '#1E1B4B'],
    description: 'Your whole source, mixed like a DJ set.',
    quickAnswer:
      'This recipe copies your whole source playlist into a new Spotify playlist ordered for harmonic mixing. It chains songs around the Camelot wheel so each key blends into the next, keeping tempo jumps small, like a DJ set. Import it, pick your source, and new songs are mixed in on each daily sync.',
    whoFor: [
      'Parties and long drives where songs should flow into each other.',
      'Bedroom DJs who want to hear key-compatible transitions before mixing live.',
      'Anyone curious what their library sounds like in key order.',
    ],
    variations: [
      { name: 'Harmonic Chill', add: [{ field: 'mood', in: ['chill'] }] },
      { name: 'Harmonic Party', add: [{ field: 'mood', in: ['party'] }] },
      { name: 'Start in 8A', order: { by: 'harmonic', startKey: '8A', bpmTolerance: 8 } },
    ],
    ...engine('harmonic-flow'),
  },
  {
    slug: 'running-160-bpm',
    name: 'Running 160+',
    category: 'Workout',
    cover: ['#EF4444', '#450A0A'],
    description: 'Songs at 155 BPM and up for a quick running pace.',
    quickAnswer:
      'This recipe builds a Spotify running playlist of every song at 155 BPM or faster in your source playlist, ordered slow to fast so your pace climbs. It suits a cadence around 160 steps per minute or more. Import it, pick your source, and new fast songs land here on each daily sync.',
    whoFor: [
      'Runners who match their steps to the beat.',
      'Tempo runs and intervals where you need a fast, steady pulse.',
      'Anyone who found the general Workout mix too slow.',
    ],
    variations: [
      { name: 'High-energy running', add: [{ field: 'energy', min: 0.7 }] },
      { name: 'Clean Running', add: [{ field: 'explicit', is: false }] },
      { name: 'Steady 160–170', add: [{ field: 'bpm', min: 160, max: 170 }] },
    ],
    rule: { match: 'all', conditions: [{ field: 'bpm', min: 155 }] },
    order: { by: 'bpm', direction: 'asc' },
  },
  {
    slug: 'chill',
    name: 'Chill',
    category: 'Mood',
    alsoIn: ['Harmonic'],
    cover: ['#38BDF8', '#0F172A'],
    description: 'Low energy, positive mood, mixed by key.',
    quickAnswer:
      "This recipe builds a Spotify playlist of the chill songs in your source playlist: low-energy tracks that aren't gloomy, plus songs tagged chill, mellow or relaxing. It's ordered by key around the Camelot wheel so songs blend. Import it, pick your source, and new matches land here on each daily sync.",
    whoFor: [
      'Evenings, dinner and winding down after work.',
      'Reading, studying or working with music in the background.',
      'Hosting, when the music should set a mood without taking over.',
    ],
    variations: [
      { name: 'Chill Acoustic', add: [{ field: 'acousticness', min: 0.6 }] },
      { name: 'Chill Worship', add: [{ field: 'genre', in: ['worship'] }] },
      { name: 'Chill, newest first', order: NEWEST },
    ],
    ...engine('chill'),
  },
  {
    slug: 'new-this-month',
    name: 'New This Month',
    category: 'Recent',
    cover: ['#2DD4BF', '#134E4A'],
    description: 'Songs you added since the first of the month.',
    quickAnswer:
      'This recipe builds a Spotify playlist of the songs you added to your source playlist since the first of the month, newest first. AutoSort rules use a fixed date, so move it forward when a new month starts. Until then, every song you add lands here on the next daily sync.',
    whoFor: [
      'Anyone who saves a lot and wants to hear the new stuff first.',
      'Spotting what you have been into lately before it sinks into a big playlist.',
      'Pairing with a genre rule for a "new country this month" mix.',
    ],
    variations: [
      { name: 'New Country This Month', add: [{ field: 'genre', in: ['country'] }] },
      { name: 'New & Clean', add: [{ field: 'explicit', is: false }] },
      { name: 'New This Month, mixed by key', order: { by: 'harmonic', bpmTolerance: 8 } },
    ],
    rule: { match: 'all', conditions: [{ field: 'addedAt', after: '2026-11-01T00:00:00Z' }] },
    order: NEWEST,
  },
  {
    slug: 'country',
    name: 'Country',
    category: 'Genre',
    cover: ['#F59E0B', '#7C2D12'],
    description: 'Every country song in your source, newest first.',
    quickAnswer:
      "This recipe builds a Spotify playlist of every country song in your source playlist, newest added first. AutoSort checks each artist's Spotify genres, so americana, bluegrass and outlaw country count too. Import it, pick your source, and any country song you add later lands here on the next daily sync.",
    whoFor: [
      'Anyone whose main playlist mixes country in with everything else.',
      'Truck rides and back-porch evenings when only country will do.',
      'A base for narrower splits like 90s Country or Clean Country.',
    ],
    variations: [
      { name: 'Country Love Songs', add: [{ field: 'theme', in: ['love'] }] },
      { name: 'Clean Country', add: [{ field: 'explicit', is: false }] },
      { name: 'Upbeat Country', add: [{ field: 'mood', in: ['happy'] }] },
    ],
    ...engine('country'),
  },
  {
    slug: 'rap',
    name: 'Rap',
    category: 'Genre',
    cover: ['#0EA5E9', '#1E1B4B'],
    description: 'Hip-hop and rap, newest first.',
    quickAnswer:
      "This recipe builds a Spotify playlist of all the hip-hop and rap in your source playlist, newest added first. AutoSort reads each artist's Spotify genres, so trap, drill and boom bap are included. Import it, pick your source, and new rap songs land here on each daily sync.",
    whoFor: [
      'Listeners who save rap next to everything else in one big playlist.',
      'Commutes and gym sessions where you want one genre start to finish.',
      'Anyone who also wants a clean version for shared speakers.',
    ],
    variations: [
      { name: 'Clean Rap', add: [{ field: 'explicit', is: false }] },
      { name: '90s Rap', add: [{ field: 'decade', in: [1990] }] },
      { name: 'Rap Workout', add: [{ field: 'mood', in: ['workout'] }] },
    ],
    ...engine('rap'),
  },
];

export function getRecipe(slug: string): SiteRecipe | undefined {
  return recipes.find((r) => r.slug === slug);
}

/** The categories a recipe appears under on the index filter. */
export function recipeGroups(r: SiteRecipe): RecipeCategory[] {
  return [r.category, ...(r.alsoIn ?? [])];
}

/** The shareable recipe JSON ("Copy recipe"): `{ name, rule, order }`. */
export function recipeJson(r: SiteRecipe): string {
  return JSON.stringify({ name: r.name, rule: r.rule, order: r.order }, null, 2);
}
