// Generates the site's illustration set with OpenRouter (run once; images are committed).
//   node --env-file=.env.local scripts/generate-images.mjs [--only slug,slug] [--force]
// Prompts describe moods and scenes only (no real artists, songs or logos).
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const MODEL = process.env.OPENROUTER_IMAGE_MODEL ?? 'google/gemini-3-pro-image';
const STYLE =
  'Photorealistic cinematic editorial photograph, shot on a full-frame camera with natural light and shallow depth of field, rich realistic textures, professional color grade. No text, no letters, no numbers, no logos, no brand names or badges on any product or vehicle, no recognizable people; any people are anonymous, in silhouette or seen from behind.';
const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'images');

const covers = {
  'country': 'Golden-hour farmland: a weathered wooden fence, round hay bales and an acoustic guitar leaning on a fence post, warm amber light. Color grade: amber into rust.',
  '90s-country': 'A weathered 1990s pickup truck parked on an empty two-lane prairie highway at golden hour, dust glowing in the backlight, long shadows. Color grade: burnt orange into deep brown.',
  'rap': 'A city rooftop at night with a vintage boombox on a ledge, glowing skyline and bokeh lights behind. Color grade: electric blue into deep indigo.',
  'clean-rap': 'Over-the-shoulder view from the back seat of a family car on a sunny suburban street, headphones resting on the seat, bright and upbeat. Color grade: sky blue into navy.',
  'worship': 'Soft morning sunlight streaming through tall church windows, light rays over rows of wooden pews, a few anonymous raised hands in silhouette. Color grade: warm cream into gold.',
  'workout': 'A dimly lit gym: chalk dust in the air over a barbell and running shoes, dramatic rim light, sweat-and-steel energy. Color grade: hot orange into dark red.',
  'happy': 'A sunflower field in bright summer sun with confetti-like petals in the air, joyful and warm. Color grade: sunny yellow into pink.',
  'sad': 'Rain running down a window at dusk, a steaming cup of tea on the sill, blurred city lights outside. Color grade: periwinkle into deep indigo.',
  'love-songs': 'Two vinyl records leaning together beside a single red rose and candlelight on a wooden table. Color grade: soft pink into wine red.',
  'chill': 'An empty hammock between palm trees over calm water under a crescent moon, peaceful night. Color grade: soft blue into midnight.',
  'harmonic-flow': 'Close-up of a DJ turntable and mixer with glowing knobs, long-exposure light trails circling the platter. Color grade: violet into deep indigo.',
  '2000s-pop': 'A Y2K still life: a glossy flip phone, butterfly hair clips and a mirrored disco ball scattering sparkles. Color grade: pink into warm orange.',
  'running-160-bpm': 'Low-angle shot of running shoes mid-stride on an empty road at sunrise, motion blur and warm flare. Color grade: red into dark maroon.',
  'new-this-month': 'Fresh green leaves and morning dew on a desk beside an open paper calendar, new beginnings, soft daylight. Color grade: teal into dark teal.',
};

const guides = {
  'organize-a-huge-playlist': 'A large collection of colorful vinyl records being sorted into neat wooden crates by color on a long table, overhead view, warm studio light, dark background with violet accents.',
  'build-a-workout-playlist-by-bpm': 'A runner seen from behind on a track at sunrise wearing headphones, lane lines leading into the distance, energetic warm light with orange and violet tones.',
  'camelot-wheel': 'A DJ booth at night seen close up: hands on a mixer, a turntable spinning, colorful stage lights in a ring of rainbow hues, shallow depth of field.',
};

const args = process.argv.slice(2);
const only = args.includes('--only') ? args[args.indexOf('--only') + 1].split(',') : null;
const force = args.includes('--force');

async function generate(prompt, aspect) {
  const res = await fetch('https://openrouter.ai/api/v1/images', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json', 'X-Title': 'AutoSort' },
    body: JSON.stringify({ model: MODEL, prompt: `${prompt} ${STYLE}`, aspect_ratio: aspect }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(json).slice(0, 200)}`);
  return { buf: Buffer.from(json.data[0].b64_json, 'base64'), cost: json.usage?.cost ?? 0 };
}

if (!process.env.OPENROUTER_API_KEY) {
  console.error('Set OPENROUTER_API_KEY in apps/site/.env.local');
  process.exit(1);
}

let total = 0;
const jobs = [
  ...Object.entries(covers).map(([slug, p]) => ({ slug, prompt: `Square playlist cover art. ${p}`, aspect: '1:1', file: join(root, 'recipes', `${slug}.jpg`), width: 800, height: 800 })),
  ...Object.entries(guides).map(([slug, p]) => ({ slug, prompt: `Wide editorial header illustration. ${p}`, aspect: '16:9', file: join(root, 'guides', `${slug}.jpg`), width: 1600, height: 900 })),
].filter((j) => !only || only.includes(j.slug));

for (const job of jobs) {
  if (existsSync(job.file) && !force) {
    console.log(`skip ${job.slug} (exists)`);
    continue;
  }
  mkdirSync(dirname(job.file), { recursive: true });
  const { buf, cost } = await generate(job.prompt, job.aspect);
  const out = await sharp(buf).resize(job.width, job.height, { fit: 'cover' }).jpeg({ quality: 78, mozjpeg: true }).toBuffer();
  writeFileSync(job.file, out);
  total += cost;
  console.log(`${job.slug}: ${Math.round(out.length / 1024)} KB · $${cost}`);
}
console.log(`Done. Total cost: $${total.toFixed(3)}`);
