import 'server-only';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ruleChips, type Rule, type SpotifyClient } from '@autosort/core';
import { ImageResponse } from 'next/og';
import sharp from 'sharp';
import { createElement as h } from 'react';

/** Spotify accepts JPEG covers up to 256 KB (base64 payload). */
const MAX_BYTES = 190 * 1024;
const SIZE = 640;
export const DEFAULT_IMAGE_MODEL = 'google/gemini-3-pro-image';

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

/** Rule labels that are AutoSort's own words. Artist names and raw tags are left out on purpose. */
function safeRuleLabels(rule: Rule): string[] {
  return ruleChips(rule).filter((c) => !/^(artist|not artist|tag|not tag)/i.test(c));
}

async function toSpotifyJpeg(input: Buffer): Promise<string> {
  let quality = 86;
  for (;;) {
    const out = await sharp(input).resize(SIZE, SIZE, { fit: 'cover' }).jpeg({ quality, mozjpeg: true }).toBuffer();
    if (out.length <= MAX_BYTES || quality <= 40) return out.toString('base64');
    quality -= 10;
  }
}

/** AutoSort's own cover: the playlist's color gradient with its name, like the design's covers. */
async function designedCover(name: string): Promise<Buffer> {
  const [from, to] = COVER_COLORS.find(([re]) => re.test(name))?.[1] ?? ['#8B5CF6', '#1E1B4B'];
  const font = await readFile(join(process.cwd(), 'assets/fonts/Figtree-800.ttf'));
  const fontSize = name.length > 18 ? 64 : name.length > 11 ? 80 : 96;
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
      h('div', { style: { fontSize, fontWeight: 800, lineHeight: 0.98, letterSpacing: '-0.04em', color: '#0B0B0C' } }, name),
    ),
    { width: SIZE, height: SIZE, fonts: [{ name: 'Figtree', data: font, weight: 800, style: 'normal' }] },
  );
  return Buffer.from(await image.arrayBuffer());
}

/**
 * A photorealistic cover from OpenRouter. The prompt uses only the playlist's name and its rule
 * labels (AutoSort's own data), never songs, artists or album art: Spotify's Developer Policy
 * forbids feeding Spotify content to AI models.
 */
async function aiCover(name: string, rule: Rule): Promise<Buffer> {
  const labels = safeRuleLabels(rule).join(', ');
  const prompt = [
    `Square cover photo for a music playlist named "${name}".`,
    labels ? `The playlist is defined by: ${labels}. Capture that mood, era and setting.` : '',
    'Photorealistic cinematic editorial photograph, natural light, shallow depth of field, rich realistic textures, professional color grade.',
    'No text, no letters, no numbers, no logos, no brand names or badges, no album covers, no recognizable people; any people are anonymous, in silhouette or seen from behind.',
  ]
    .filter(Boolean)
    .join(' ');
  const res = await fetch('https://openrouter.ai/api/v1/images', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json', 'X-Title': 'AutoSort' },
    body: JSON.stringify({ model: process.env.OPENROUTER_IMAGE_MODEL || DEFAULT_IMAGE_MODEL, prompt, aspect_ratio: '1:1' }),
    signal: AbortSignal.timeout(90_000),
  });
  const json = (await res.json().catch(() => null)) as { data?: Array<{ b64_json?: string }>; error?: { message?: string } } | null;
  const b64 = json?.data?.[0]?.b64_json;
  if (!res.ok || !b64) throw new Error(`Image generation failed: ${json?.error?.message ?? res.status}`);
  return Buffer.from(b64, 'base64');
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

/**
 * Make and upload a cover for a smart playlist. Uses an AI image when OPENROUTER_API_KEY is set
 * (falling back to the designed cover if that fails), otherwise the designed cover.
 */
export async function uploadCover(client: SpotifyClient, playlistId: string, p: { name: string; rule: Rule }): Promise<'ai' | 'designed'> {
  let kind: 'ai' | 'designed' = 'designed';
  let image: Buffer | null = null;
  if (aiCoversEnabled()) {
    try {
      image = await aiCover(p.name, p.rule);
      kind = 'ai';
    } catch {
      image = null;
    }
  }
  image ??= await designedCover(p.name);
  await client.uploadPlaylistCover(playlistId, await toSpotifyJpeg(image));
  return kind;
}
