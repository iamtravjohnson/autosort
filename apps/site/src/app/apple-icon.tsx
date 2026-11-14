import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

const HUES = ['#79ECD9', '#79ECA9', '#9FEC79', '#ECEC79', '#ECC679', '#EC9F79', '#EC7979', '#EC79A9', '#EC79E2', '#BC79EC', '#7979EC', '#79BCEC'];
const BARS: Array<[number, number]> = [[10, 10], [4, 16], [12, 8], [6, 14], [2, 18], [11, 9], [5, 15], [9, 11], [3, 17], [12, 8], [7, 13], [4, 16]];

/** App icon: the full-color wheel on near-black (Logo board). */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0B0B0C' }}>
        <svg width={136} height={136} viewBox="0 0 64 64">
          {BARS.map(([y, h], i) => (
            <rect key={i} x={29.75} y={y} width={4.5} height={h} rx={2.25} fill={HUES[i]} transform={`rotate(${i * 30} 32 32)`} />
          ))}
        </svg>
      </div>
    ),
    size,
  );
}
