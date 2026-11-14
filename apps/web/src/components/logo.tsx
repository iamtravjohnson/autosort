import Link from 'next/link';

const BARS: Array<[number, number]> = [
  [10, 10],
  [4, 16],
  [12, 8],
  [6, 14],
  [2, 18],
  [11, 9],
  [5, 15],
  [9, 11],
  [3, 17],
  [12, 8],
  [7, 13],
  [4, 16],
];

export const CAMELOT_B_HUES = ['#79ECD9', '#79ECA9', '#9FEC79', '#ECEC79', '#ECC679', '#EC9F79', '#EC7979', '#EC79A9', '#EC79E2', '#BC79EC', '#7979EC', '#79BCEC'];

/** The "Wheel" mark: 12 equalizer bars bent into a circle, one per Camelot position. */
export function WheelMark({ size = 30, color = '#8B5CF6', multicolor = false, label }: { size?: number; color?: string; multicolor?: boolean; label?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    >
      <g fill={multicolor ? undefined : color}>
        {BARS.map(([y, h], i) => (
          <rect
            key={i}
            x={29.75}
            y={y}
            width={4.5}
            height={h}
            rx={2.25}
            fill={multicolor ? CAMELOT_B_HUES[i] : undefined}
            transform={i ? `rotate(${i * 30} 32 32)` : undefined}
          />
        ))}
      </g>
    </svg>
  );
}

export function Logo({ size = 26, wordmark = 20, href = '/app' }: { size?: number; wordmark?: number; href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 text-text-1 no-underline hover:text-text-1" aria-label="AutoSort home">
      <WheelMark size={size} />
      <span className="font-extrabold tracking-[-0.04em]" style={{ fontSize: wordmark }}>
        AutoSort
      </span>
    </Link>
  );
}
