import Image from 'next/image';

const FALLBACK = ['#4A3B2A', '#2F3B4A', '#3A2F4A', '#4A4530'];

/**
 * Source art: the playlist's own image, or a 2×2 mosaic of album covers (flat colors when there's no art yet).
 * `size` is the largest size it's shown at; pass `sizeClass` (e.g. "size-16 sm:size-24") to size it responsively.
 */
export function Mosaic({ images, size, sizeClass, className = '' }: { images: string[]; size: number; sizeClass?: string; className?: string }) {
  const style = sizeClass ? undefined : { width: size, height: size };
  if (images.length === 1 || (images.length > 0 && images.length < 4)) {
    return (
      <span className={`block shrink-0 overflow-hidden rounded-art bg-surface-3 ${sizeClass ?? ''} ${className}`} style={style} aria-hidden="true">
        <Image src={images[0]!} alt="" width={size} height={size} unoptimized className="size-full object-cover" />
      </span>
    );
  }
  return (
    <span className={`grid shrink-0 grid-cols-2 overflow-hidden rounded-art ${sizeClass ?? ''} ${className}`} style={style} aria-hidden="true">
      {FALLBACK.map((color, i) => (
        <span key={color} className="relative block min-h-0 min-w-0" style={{ background: color }}>
          {images[i] ? <Image src={images[i]} alt="" width={Math.ceil(size / 2)} height={Math.ceil(size / 2)} unoptimized className="size-full object-cover" /> : null}
        </span>
      ))}
    </span>
  );
}
