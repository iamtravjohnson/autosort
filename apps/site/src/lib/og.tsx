import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

/** Share images follow the canvas "Open Graph image templates" board (1200×630). */
export const ogSize = { width: 1200, height: 630 };
export const ogContentType = 'image/png';

const fontsDir = join(process.cwd(), 'assets/fonts');
const fonts = Promise.all([readFile(join(fontsDir, 'Figtree-700.ttf')), readFile(join(fontsDir, 'Figtree-800.ttf'))]);

const B = ['#79ECD9', '#79ECA9', '#9FEC79', '#ECEC79', '#ECC679', '#EC9F79', '#EC7979', '#EC79A9', '#EC79E2', '#BC79EC', '#7979EC', '#79BCEC'];
const A = ['#1E8070', '#1F8449', '#3F801E', '#74741B', '#916C22', '#954923', '#952323', '#952352', '#95238B', '#652395', '#232395', '#236595'];
const BARS: Array<[number, number]> = [[10, 10], [4, 16], [12, 8], [6, 14], [2, 18], [11, 9], [5, 15], [9, 11], [3, 17], [12, 8], [7, 13], [4, 16]];

function Mark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      {BARS.map(([y, h], i) => (
        <rect key={i} x={29.75} y={y} width={4.5} height={h} rx={2.25} fill="#8B5CF6" transform={`rotate(${i * 30} 32 32)`} />
      ))}
    </svg>
  );
}

export type OgArt =
  | { kind: 'stack' }
  | { kind: 'bars' }
  | { kind: 'cover'; from: string; to: string; label: string; image?: string }
  | { kind: 'wheel' }
  | { kind: 'compare'; other: string }
  | { kind: 'docs'; lines?: string[] };

const STACK = [
  { name: 'Country', from: '#F59E0B', to: '#7C2D12' },
  { name: '90s Country', from: '#B45309', to: '#451A03' },
  { name: 'Clean Rap', from: '#38BDF8', to: '#1E3A8A' },
  { name: 'Worship', from: '#FDE68A', to: '#B45309' },
  { name: 'Workout', from: '#F97316', to: '#7F1D1D' },
];

function Art({ art }: { art: OgArt }) {
  switch (art.kind) {
    case 'stack':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
          {STACK.map((p, i) => (
            <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 16px 10px 10px', borderRadius: 10, background: '#1C1C1F', marginLeft: i % 2 ? 0 : 40 }}>
              <div style={{ width: 52, height: 52, borderRadius: 6, background: `linear-gradient(145deg, ${p.from}, ${p.to})` }} />
              <span style={{ fontSize: 24, fontWeight: 700 }}>{p.name}</span>
            </div>
          ))}
        </div>
      );
    case 'bars':
      return (
        <div style={{ width: '100%', height: 340, display: 'flex', alignItems: 'flex-end', gap: 10, borderBottom: '2px solid rgba(255,255,255,0.2)' }}>
          {[80, 120, 150, 190, 220, 260, 300, 330].map((h, i) => (
            <div key={i} style={{ flex: 1, height: h, borderRadius: '6px 6px 0 0', background: i >= 3 && i <= 5 ? '#8B5CF6' : '#3A2F5C' }} />
          ))}
        </div>
      );
    case 'cover':
      if (art.image) {
        return (
          <div style={{ width: 340, height: 340, borderRadius: 14, overflow: 'hidden', display: 'flex', position: 'relative' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={art.image} width={340} height={340} alt="" style={{ position: 'absolute', inset: 0 }} />
          </div>
        );
      }
      return (
        <div style={{ width: 320, height: 320, borderRadius: 12, padding: 30, display: 'flex', alignItems: 'flex-end', background: `linear-gradient(145deg, ${art.from}, ${art.to})` }}>
          <span style={{ fontSize: 52, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1, color: '#0B0B0C' }}>{art.label}</span>
        </div>
      );
    case 'wheel': {
      const dots = [];
      for (let i = 0; i < 12; i++) {
        const angle = ((i * 30 - 90) * Math.PI) / 180;
        dots.push(<div key={`b${i}`} style={{ position: 'absolute', left: 170 + Math.cos(angle) * 140 - 26, top: 170 + Math.sin(angle) * 140 - 26, width: 52, height: 52, borderRadius: 999, background: B[(i + 11) % 12] }} />);
        dots.push(<div key={`a${i}`} style={{ position: 'absolute', left: 170 + Math.cos(angle) * 84 - 22, top: 170 + Math.sin(angle) * 84 - 22, width: 44, height: 44, borderRadius: 999, background: A[(i + 11) % 12] }} />);
      }
      return <div style={{ position: 'relative', width: 340, height: 340, display: 'flex' }}>{dots}</div>;
    }
    case 'compare':
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <div style={{ width: 150, height: 150, borderRadius: 28, background: '#1C1C1F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Mark size={96} />
          </div>
          <span style={{ fontSize: 34, fontWeight: 800, color: '#8A8A93' }}>vs</span>
          <div style={{ width: 150, height: 150, borderRadius: 28, background: '#1C1C1F', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12, textAlign: 'center' }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: '#B3B3B8', lineHeight: 1.1 }}>{art.other}</span>
          </div>
        </div>
      );
    case 'docs':
      return (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)' }}>
          <div style={{ display: 'flex', padding: '14px 18px', background: '#1C1C1F', fontSize: 20, color: '#8A8A93' }}>Terminal</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 22, background: '#141416', fontSize: 22, color: '#D4D4D8' }}>
            {(art.lines ?? ['1  Create Spotify app', '2  Deploy', '3  Add redirect URI', '4  Connect Spotify']).map((l) => (
              <span key={l}>{l}</span>
            ))}
          </div>
        </div>
      );
  }
}

/** A file under /public as a data URL, for images inside share images. Returns undefined if missing. */
export async function publicImage(path: string): Promise<string | undefined> {
  try {
    const buf = await readFile(join(process.cwd(), 'public', path));
    return `data:image/jpeg;base64,${buf.toString('base64')}`;
  } catch {
    return undefined;
  }
}

/** Render a share image: eyebrow + title on the left, template art on the right. */
export async function renderOg(opts: { eyebrow: string; title: string; art?: OgArt; glow?: boolean }) {
  const [w700, w800] = await fonts;
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          gap: 48,
          padding: '64px 72px',
          color: '#FFFFFF',
          fontFamily: 'Figtree',
          background: opts.glow ? 'radial-gradient(900px 500px at 80% 50%, #2A1F45 0%, #0B0B0C 70%)' : '#0B0B0C',
        }}
      >
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Mark />
            <span style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.04em' }}>AutoSort</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <span style={{ fontSize: 26, fontWeight: 700, color: '#C4B5FD' }}>{opts.eyebrow}</span>
            <span style={{ fontSize: opts.title.length > 48 ? 56 : 68, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.02 }}>{opts.title}</span>
          </div>
          <span style={{ fontSize: 24, fontWeight: 700, color: '#B3B3B8' }}>autosort.app · Free &amp; open source</span>
        </div>
        <div style={{ flex: '0 0 360px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Art art={opts.art ?? { kind: 'stack' }} />
        </div>
      </div>
    ),
    {
      ...ogSize,
      fonts: [
        { name: 'Figtree', data: w700, weight: 700, style: 'normal' },
        { name: 'Figtree', data: w800, weight: 800, style: 'normal' },
      ],
    },
  );
}
