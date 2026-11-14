import type { SVGProps } from 'react';

type GlyphProps = SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number };

function Glyph({ size = 16, strokeWidth = 2, children, ...rest }: GlyphProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const PlusGlyph = (p: GlyphProps) => (
  <Glyph strokeWidth={2.5} {...p}>
    <path d="M12 5v14M5 12h14" />
  </Glyph>
);
export const ChevronRightGlyph = (p: GlyphProps) => (
  <Glyph {...p}>
    <path d="M9 6l6 6-6 6" />
  </Glyph>
);
export const ChevronLeftGlyph = (p: GlyphProps) => (
  <Glyph strokeWidth={2.5} {...p}>
    <path d="M15 6l-6 6 6 6" />
  </Glyph>
);
export const LockGlyph = (p: GlyphProps) => (
  <Glyph {...p}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </Glyph>
);
export const PauseGlyph = (p: GlyphProps) => (
  <Glyph strokeWidth={3} {...p}>
    <path d="M9 5v14M15 5v14" />
  </Glyph>
);
export const WarningGlyph = (p: GlyphProps) => (
  <Glyph strokeWidth={2.5} {...p}>
    <path d="M12 9v4M12 17h.01M10.3 3.9L2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
  </Glyph>
);
export const InfoGlyph = (p: GlyphProps) => (
  <Glyph {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v5M12 16h.01" />
  </Glyph>
);
export const MusicGlyph = (p: GlyphProps) => (
  <Glyph {...p}>
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </Glyph>
);
export const ExternalGlyph = (p: GlyphProps) => (
  <Glyph {...p}>
    <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </Glyph>
);
export const SyncGlyph = (p: GlyphProps) => (
  <Glyph {...p}>
    <path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" />
  </Glyph>
);
export const CheckGlyph = (p: GlyphProps) => (
  <Glyph strokeWidth={2.5} {...p}>
    <path d="M5 12l5 5L20 7" />
  </Glyph>
);
export const UndoGlyph = (p: GlyphProps) => (
  <Glyph strokeWidth={2.5} {...p}>
    <path d="M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3" />
  </Glyph>
);
export const ChevronDownGlyph = (p: GlyphProps) => (
  <Glyph {...p}>
    <path d="M6 9l6 6 6-6" />
  </Glyph>
);
export const AlertCircleGlyph = (p: GlyphProps) => (
  <Glyph strokeWidth={2.5} {...p}>
    <path d="M12 8v5M12 16h.01" />
  </Glyph>
);
export const SparkleGlyph = (p: GlyphProps) => (
  <Glyph {...p}>
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
  </Glyph>
);
