import 'server-only';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Condition, GenreBucket, Mood, Rule, SpotifyClient, Theme } from '@autosort/core';
import { ImageResponse } from 'next/og';
import sharp from 'sharp';
import { createElement as h } from 'react';

/** Spotify accepts JPEG covers up to 256 KB (base64 payload). */
const MAX_BYTES = 190 * 1024;
const SIZE = 640;
export const DEFAULT_IMAGE_MODEL = 'google/gemini-3-pro-image';
/** How many covers to make at once (image models rate-limit bursts). */
export const COVER_CONCURRENCY = 3;

export function aiCoversEnabled(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

const COVER_COLORS: Array<[RegExp, [string, string]]> = [
  [/90s country/i, ['#B45309', '#451A03']],
  [/country/i, ['#F59E0B', '#7C2D12']],
  [/clean rap/i, ['#38BDF8', '#1E3A8A']],
  [/rap|hip/i, ['#0EA5E9', '#1E1B4B']],
  [/worship/i, ['#FDE68A', '#B45309']],
  [/workout|running/i, ['#F97316', '#7F1D1D']],
  [/happy/i, ['#FBBF24', '#F472B6']],
  [/love/i, ['#F472B6', '#831843']],
  [/sad/i, ['#818CF8', '#312E81']],
  [/harmonic/i, ['#8B5CF6', '#1E1B4B']],
  [/rock/i, ['#EF4444', '#450A0A']],
  [/pop/i, ['#F472B6', '#7C2D12']],
  [/chill/i, ['#38BDF8', '#0F172A']],
];

/* ---------- Art direction ---------- */

/**
 * One concrete, photographable scene per genre: objects and places rather than people, so covers
 * read at thumbnail size and don't look like stock photos. Two options each, picked by name, so
 * "Country" and "2010s Country" don't get the same picture.
 */
const GENRE_SCENES: Record<GenreBucket, [string, string]> = {
  country: [
    'a worn acoustic guitar leaning against the open tailgate of an old pickup truck on a gravel road through tall golden grass',
    'a pair of scuffed leather cowboy boots on the wooden steps of a farmhouse porch beside a creaky screen door',
  ],
  'hip-hop': [
    'a vintage chrome studio microphone in a dark recording booth lit by a single magenta and blue neon tube',
    'a boombox on cracked concrete steps under a buzzing streetlight on a city block at night',
  ],
  worship: [
    'warm sunlight streaming through a tall arched church window across empty wooden pews',
    'a single candle glowing beside an open, well-read Bible on a wooden table in soft morning light',
  ],
  rock: [
    'an electric guitar leaning on a glowing tube amplifier on a dark stage, red stage light cutting through haze',
    'a drum kit on an empty club stage, cymbals catching a hard white spotlight',
  ],
  metal: [
    'a black electric guitar in front of a towering wall of amplifiers, sparks and smoke under harsh white light',
    'a cracked cymbal and a chain-wrapped mic stand on a smoky stage lit from behind',
  ],
  pop: [
    'candy-colored neon lights reflected in puddles on a city street at dusk',
    'a retro jukebox glowing pink and teal in an empty late-night diner',
  ],
  'r&b': [
    'a vinyl record spinning on a turntable in a dim lounge with warm amber lamps and a velvet chair',
    'a city apartment window at night with soft purple light, a glass of wine on the sill and the skyline beyond',
  ],
  electronic: [
    'a DJ mixer with glowing knobs as laser beams cut through club fog',
    'a modular synthesizer covered in patch cables, lit by cool blue LEDs in a dark studio',
  ],
  latin: [
    'a nylon-string guitar on a sunlit tiled courtyard with bright bougainvillea and painted walls',
    'maracas and a cajón on a colorful balcony above a lively evening street',
  ],
  jazz: [
    'a saxophone resting on a wooden chair in a smoky jazz club under a single warm spotlight',
    'an upright bass beside a grand piano on a small club stage, candlelit tables in front',
  ],
  classical: [
    'a grand piano alone in an empty concert hall, lit by one warm spotlight',
    'a violin and sheet music on a velvet chair in an ornate old theater',
  ],
  folk: [
    'a banjo and an acoustic guitar on a wooden cabin porch overlooking misty mountains at sunrise',
    'a campfire by a lake at dusk with an old guitar leaning on a log',
  ],
  reggae: [
    'a hand drum and a hammock on a beach-shack porch at sunset with palm trees',
    'a sound-system speaker stack painted in bright colors on a sunny street',
  ],
  blues: [
    'a dented resonator guitar on a wooden chair in a dim juke joint lit by a red neon glow',
    'a harmonica on a weathered wooden bar under one hanging bulb',
  ],
  indie: [
    'a film camera and a stack of cassette tapes on a sunny bedroom windowsill with houseplants',
    'a record player on the floor of an empty apartment, afternoon light through tall windows',
  ],
  soundtrack: [
    'the glowing screen and red velvet seats of an empty vintage movie theater',
    'a film reel and a clapperboard on a director chair under studio lights',
  ],
};

const THEME_SCENES: Record<Theme, string> = {
  love: 'two coffee cups touching on a café table by a rain-flecked window, warm candlelight and a single red rose',
  breakup: 'a single wilted rose on a rain-streaked café table at dusk, an empty chair across from it',
  christmas: 'a cozy fireplace with stockings and warm string lights, snow falling softly outside the window',
  worship: GENRE_SCENES.worship[0],
};

const MOOD_SCENES: Record<Mood, string> = {
  happy: 'a vintage bicycle in a sunflower field under bright golden afternoon sun',
  sad: 'raindrops on a window at blue hour, a blurred city behind it and a cold cup of coffee on the sill',
  chill: 'a hammock between palm trees on a quiet beach at sunrise in soft pastel haze',
  energetic: 'a festival stage exploding with light beams, smoke and confetti',
  party: 'a mirror ball scattering colored light across an empty dance floor',
  workout: 'a pair of running shoes on a red running track at sunrise, long shadows',
  focus: 'a tidy wooden desk at night with an open notebook, a pencil and a warm desk lamp',
};

const MOOD_LIGHT: Record<Mood, string> = {
  happy: 'Bright golden-hour sunlight and warm, cheerful colors.',
  sad: 'Blue-hour light, a little rain, muted cool tones.',
  chill: 'Soft hazy morning light and calm pastel tones.',
  energetic: 'Dramatic high-contrast light with a sense of motion.',
  party: 'Colorful party lights.',
  workout: 'Crisp dawn light with an energetic feel.',
  focus: 'Soft, quiet lamplight.',
};

const ERA: Record<number, string> = {
  1950: 'Set in the 1950s with period-accurate props and cars; warm, slightly faded film look.',
  1960: 'Set in the 1960s with period-accurate props and cars; warm, slightly faded film look.',
  1970: 'Set in the 1970s with period-accurate props; warm, grainy film look.',
  1980: 'Set in the 1980s with period-accurate props; slightly saturated film look.',
  1990: 'Set in the 1990s with period-accurate props like cassette tapes and older cars; slightly faded 35mm film look.',
  2000: 'Set in the early 2000s with period-accurate props; early digital-camera look.',
  2010: 'Set in the 2010s.',
  2020: 'Present day, crisp modern look.',
};

function collect(rule: Rule, out: Condition[] = []): Condition[] {
  for (const c of rule.conditions) {
    if ('match' in c) collect(c, out);
    else out.push(c);
  }
  return out;
}

const pick = <T,>(options: readonly T[], seed: string): T => options[[...seed].reduce((n, ch) => (n * 31 + ch.charCodeAt(0)) >>> 0, 7) % options.length]!;

/**
 * The image prompt for a playlist, from its rule only (genre, decade, mood, theme): AutoSort's own
 * labels, never songs, artists or album art. Spotify's Developer Policy forbids feeding Spotify
 * content to AI models.
 */
export function coverPrompt(name: string, rule: Rule): string {
  const conds = collect(rule);
  const values = <F extends Condition['field']>(field: F) =>
    conds.flatMap((c) => (c.field === field && 'in' in c && Array.isArray(c.in) ? (c.in as unknown[]) : []));
  const genres = values('genre').filter((g): g is GenreBucket => typeof g === 'string' && g in GENRE_SCENES);
  const themes = values('theme') as Theme[];
  const moods = values('mood') as Mood[];
  const decade = values('decade').find((d): d is number => typeof d === 'number');

  const scene =
    (themes[0] && THEME_SCENES[themes[0]]) ??
    (genres[0] && pick(GENRE_SCENES[genres[0]], name)) ??
    (moods[0] && MOOD_SCENES[moods[0]]) ??
    'a pair of headphones resting on a stack of vinyl records in warm window light';
  const light = genres[0] || themes[0] ? (moods[0] ? MOOD_LIGHT[moods[0]] : '') : '';
  const era = decade !== undefined ? (ERA[decade] ?? '') : '';

  return [
    `A photograph for a music playlist cover: ${scene}.`,
    era,
    light,
    'Style: photorealistic, cinematic editorial photography, full-frame camera, 35mm lens, natural textures, rich but believable color grade, shallow depth of field.',
    'Composition: one clear subject, uncluttered background, a full-bleed square photo that fills the frame edge to edge, with calm space near the bottom.',
    'Rules: no people, faces or hands; no text, letters, numbers, signs, logos or brand names anywhere; no borders, frames, black bars or letterboxing.',
  ]
    .filter(Boolean)
    .join(' ');
}

/* ---------- Rendering ---------- */

async function fontData() {
  return readFile(join(process.cwd(), 'assets/fonts/Figtree-800.ttf'));
}

const titleSize = (name: string) => (name.length > 18 ? 60 : name.length > 11 ? 76 : 92);

async function toSpotifyJpeg(input: Buffer): Promise<string> {
  let quality = 86;
  for (;;) {
    const out = await sharp(input).resize(SIZE, SIZE, { fit: 'cover' }).jpeg({ quality, mozjpeg: true }).toBuffer();
    if (out.length <= MAX_BYTES || quality <= 40) return out.toString('base64');
    quality -= 10;
  }
}

/** AutoSort's own cover: the playlist's color gradient with its name. */
async function designedCover(name: string): Promise<Buffer> {
  const [from, to] = COVER_COLORS.find(([re]) => re.test(name))?.[1] ?? ['#8B5CF6', '#1E1B4B'];
  const image = new ImageResponse(
    h(
      'div',
      {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 56,
          background: `linear-gradient(145deg, ${from}, ${to})`,
          fontFamily: 'Figtree',
        },
      },
      h('div', { style: { fontSize: 28, fontWeight: 800, color: 'rgba(11,11,12,0.7)', letterSpacing: '-0.02em' } }, 'AutoSort'),
      h('div', { style: { fontSize: titleSize(name), fontWeight: 800, lineHeight: 0.98, letterSpacing: '-0.04em', color: '#0B0B0C' } }, name),
    ),
    { width: SIZE, height: SIZE, fonts: [{ name: 'Figtree', data: await fontData(), weight: 800, style: 'normal' }] },
  );
  return Buffer.from(await image.arrayBuffer());
}

/** The photo with the playlist's name over a dark fade, like an editorial playlist cover. */
async function titledPhoto(photo: Buffer, name: string): Promise<Buffer> {
  const bg = await sharp(photo).resize(SIZE, SIZE, { fit: 'cover' }).jpeg({ quality: 90 }).toBuffer();
  const src = `data:image/jpeg;base64,${bg.toString('base64')}`;
  const image = new ImageResponse(
    h(
      'div',
      { style: { width: '100%', height: '100%', display: 'flex', position: 'relative', fontFamily: 'Figtree' } },
      h('img', { src, width: SIZE, height: SIZE, style: { position: 'absolute', top: 0, left: 0, width: SIZE, height: SIZE, objectFit: 'cover' } }),
      h('div', {
        style: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '62%', background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0.82) 100%)' },
      }),
      h('div', { style: { position: 'absolute', left: 0, right: 0, top: 0, height: '28%', background: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 100%)' } }),
      h(
        'div',
        { style: { position: 'absolute', top: 40, left: 48, fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', color: 'rgba(255,255,255,0.88)' } },
        'AutoSort',
      ),
      h(
        'div',
        {
          style: {
            position: 'absolute',
            left: 48,
            right: 48,
            bottom: 44,
            display: 'flex',
            fontSize: titleSize(name),
            fontWeight: 800,
            lineHeight: 0.95,
            letterSpacing: '-0.04em',
            color: '#FFFFFF',
          },
        },
        name,
      ),
    ),
    { width: SIZE, height: SIZE, fonts: [{ name: 'Figtree', data: await fontData(), weight: 800, style: 'normal' }] },
  );
  return Buffer.from(await image.arrayBuffer());
}

/** A photo from OpenRouter for this playlist. Retries once on rate limits, timeouts and server errors. */
async function aiPhoto(name: string, rule: Rule): Promise<Buffer> {
  const body = JSON.stringify({ model: process.env.OPENROUTER_IMAGE_MODEL || DEFAULT_IMAGE_MODEL, prompt: coverPrompt(name, rule), aspect_ratio: '1:1' });
  let lastError = 'unknown error';
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/images', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json', 'X-Title': 'AutoSort' },
        body,
        signal: AbortSignal.timeout(120_000),
      });
      const json = (await res.json().catch(() => null)) as { data?: Array<{ b64_json?: string }>; error?: { message?: string } } | null;
      const b64 = json?.data?.[0]?.b64_json;
      if (res.ok && b64) return Buffer.from(b64, 'base64');
      lastError = `${res.status} ${json?.error?.message ?? 'no image returned'}`;
      if (res.status < 429 && res.status !== 408) break;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
    if (attempt === 1) await new Promise((resolve) => setTimeout(resolve, 4000));
  }
  throw new Error(`Image generation failed: ${lastError}`);
}

/**
 * The cover image for a playlist: a titled photo when the style is "photo" and OPENROUTER_API_KEY
 * is set (falling back to the designed cover), else the designed cover.
 */
export async function renderCover(p: { name: string; rule: Rule }, style: 'photo' | 'designed' = 'photo'): Promise<{ jpegBase64: string; kind: 'ai' | 'designed' }> {
  if (style === 'photo' && aiCoversEnabled()) {
    try {
      return { jpegBase64: await toSpotifyJpeg(await titledPhoto(await aiPhoto(p.name, p.rule), p.name)), kind: 'ai' };
    } catch (err) {
      console.error(`Photo cover failed for "${p.name}", using the designed cover:`, err instanceof Error ? err.message : err);
    }
  }
  return { jpegBase64: await toSpotifyJpeg(await designedCover(p.name)), kind: 'designed' };
}

/** True when Spotify is showing its automatic 4-album mosaic (no custom cover yet). */
export function isMosaic(url: string | null | undefined): boolean {
  return !url || /mosaic\.scdn\.co/.test(url);
}

/** The playlist's current cover address in Spotify (null when it has none). */
export async function playlistImage(client: SpotifyClient, playlistId: string): Promise<string | null> {
  const raw = await client.request<{ images?: Array<{ url?: string }> | null }>('GET', `/playlists/${encodeURIComponent(playlistId)}?fields=images`);
  return raw.images?.[0]?.url ?? null;
}

/** Make and upload a cover for a smart playlist. */
export async function uploadCover(client: SpotifyClient, playlistId: string, p: { name: string; rule: Rule }, style: 'photo' | 'designed' = 'photo'): Promise<'ai' | 'designed'> {
  const { jpegBase64, kind } = await renderCover(p, style);
  await client.uploadPlaylistCover(playlistId, jpegBase64);
  return kind;
}
