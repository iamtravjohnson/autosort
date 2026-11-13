import type { Rule } from './rules.js';
import type { OrderSpec } from './sort.js';

export interface Recipe {
  slug: string;
  name: string;
  description: string;
  rule: Rule;
  order: OrderSpec;
}

const newest: OrderSpec = { by: 'addedAt', direction: 'desc' };

/** Ready-made smart playlists. Shareable as JSON; each also has a page on autosort.app/recipes. */
export const RECIPES: Recipe[] = [
  {
    slug: 'country',
    name: 'Country',
    description: 'Every country song in your source, newest first.',
    rule: { match: 'all', conditions: [{ field: 'genre', in: ['country'] }] },
    order: newest,
  },
  {
    slug: '90s-country',
    name: '90s Country',
    description: 'Country songs first released in the 1990s, by original release year (not the compilation date).',
    rule: { match: 'all', conditions: [{ field: 'genre', in: ['country'] }, { field: 'decade', in: [1990] }] },
    order: newest,
  },
  {
    slug: 'rap',
    name: 'Rap',
    description: 'Hip-hop and rap.',
    rule: { match: 'all', conditions: [{ field: 'genre', in: ['hip-hop'] }] },
    order: newest,
  },
  {
    slug: 'clean-rap',
    name: 'Clean Rap',
    description: 'Rap without explicit tracks: good for the car with the kids.',
    rule: { match: 'all', conditions: [{ field: 'genre', in: ['hip-hop'] }, { field: 'explicit', is: false }] },
    order: newest,
  },
  {
    slug: 'worship',
    name: 'Worship',
    description: 'Worship, gospel and Christian music.',
    rule: { match: 'any', conditions: [{ field: 'genre', in: ['worship'] }, { field: 'theme', in: ['worship'] }] },
    order: newest,
  },
  {
    slug: 'workout',
    name: 'Workout',
    description: 'High-energy songs between 115 and 165 BPM, building intensity.',
    rule: { match: 'all', conditions: [{ field: 'mood', in: ['workout'] }] },
    order: { by: 'energyArc', shape: 'build' },
  },
  {
    slug: 'happy',
    name: 'Happy',
    description: 'Bright, positive songs (high valence).',
    rule: { match: 'all', conditions: [{ field: 'mood', in: ['happy'] }] },
    order: newest,
  },
  {
    slug: 'sad',
    name: 'Sad',
    description: 'Low, melancholy songs.',
    rule: { match: 'all', conditions: [{ field: 'mood', in: ['sad'] }] },
    order: newest,
  },
  {
    slug: 'love-songs',
    name: 'Love Songs',
    description: 'Songs about love, from crowd tags and titles.',
    rule: { match: 'all', conditions: [{ field: 'theme', in: ['love'] }] },
    order: newest,
  },
  {
    slug: 'chill',
    name: 'Chill',
    description: 'Low-energy, easygoing songs.',
    rule: { match: 'all', conditions: [{ field: 'mood', in: ['chill'] }] },
    order: { by: 'harmonic', bpmTolerance: 10 },
  },
  {
    slug: 'harmonic-flow',
    name: 'Harmonic Flow',
    description: 'Your whole source, mixed around the Camelot wheel like a DJ set.',
    rule: { match: 'all', conditions: [] },
    order: { by: 'harmonic', bpmTolerance: 8 },
  },
];

export function findRecipe(slug: string): Recipe | undefined {
  return RECIPES.find((r) => r.slug === slug);
}
