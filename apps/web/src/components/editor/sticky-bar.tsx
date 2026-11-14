'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * A save bar that floats at the bottom of the screen while the end of the page is out of view,
 * then settles in place at the end of the page. (The app's <main> clips overflow, so CSS
 * `position: sticky` can't stick to the window.) On phones it floats above the tab bar.
 */
export function StickyBar({ label, children }: { label: string; children: ReactNode }) {
  const slot = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const [floating, setFloating] = useState(false);
  const [box, setBox] = useState({ left: 0, width: 0, height: 0 });

  useEffect(() => {
    const s = slot.current;
    const b = bar.current;
    if (!s || !b) return;
    const wide = window.matchMedia('(min-width: 1024px)');
    let io: IntersectionObserver | null = null;

    const measure = () => {
      const r = s.getBoundingClientRect();
      setBox({ left: r.left, width: r.width, height: b.offsetHeight });
    };
    const watch = () => {
      io?.disconnect();
      const inset = wide.matches ? 8 : 92;
      io = new IntersectionObserver(([entry]) => setFloating(!entry?.isIntersecting), { rootMargin: `0px 0px -${inset}px 0px`, threshold: 0.99 });
      io.observe(s);
    };

    measure();
    watch();
    const ro = new ResizeObserver(measure);
    ro.observe(s);
    ro.observe(b);
    window.addEventListener('resize', measure);
    wide.addEventListener('change', watch);
    return () => {
      io?.disconnect();
      ro.disconnect();
      window.removeEventListener('resize', measure);
      wide.removeEventListener('change', watch);
    };
  }, []);

  return (
    <div ref={slot} className="mt-6" style={floating && box.height ? { height: box.height } : undefined}>
      <div
        ref={bar}
        role="region"
        aria-label={label}
        className={floating ? 'fixed bottom-[92px] z-20 lg:bottom-2' : ''}
        style={floating ? { left: box.left, width: box.width } : undefined}
      >
        <div className="tnum flex flex-col gap-3 rounded-panel border border-line bg-surface-2/95 px-4 py-3 shadow-e2 backdrop-blur sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          {children}
        </div>
      </div>
    </div>
  );
}
