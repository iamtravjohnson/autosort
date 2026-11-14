import type { GenreSlice } from '@/lib/stats';
import { ChartCard, DataTable, NoData, pct } from './chart-card';

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const W = 160;
const H = 100;

function worst(row: number[], side: number): number {
  const s = row.reduce((a, b) => a + b, 0);
  const max = Math.max(...row);
  const min = Math.min(...row);
  return Math.max((side * side * max) / (s * s), (s * s) / (side * side * min));
}

/** Squarified treemap: areas (already scaled to the box) → rectangles, largest first. */
function squarify(areas: number[], box: Rect): Rect[] {
  const out: Rect[] = [];
  let rest = [...areas];
  let { x, y, w, h } = box;
  while (rest.length) {
    const side = Math.min(w, h);
    const row = [rest[0]!];
    let i = 1;
    while (i < rest.length && worst([...row, rest[i]!], side) <= worst(row, side)) row.push(rest[i++]!);
    const s = row.reduce((a, b) => a + b, 0);
    if (w >= h) {
      const cw = s / h;
      let yy = y;
      for (const a of row) {
        out.push({ x, y: yy, w: cw, h: a / cw });
        yy += a / cw;
      }
      x += cw;
      w -= cw;
    } else {
      const rh = s / w;
      let xx = x;
      for (const a of row) {
        out.push({ x: xx, y, w: a / rh, h: rh });
        xx += a / rh;
      }
      y += rh;
      h -= rh;
    }
    rest = rest.slice(row.length);
  }
  return out;
}

export function GenreTreemap({ slices, genreTable, noGenre, songs }: { slices: GenreSlice[]; genreTable: Array<{ label: string; count: number }>; noGenre: number; songs: number }) {
  const sorted = [...slices].sort((a, b) => b.count - a.count);
  const total = sorted.reduce((n, s) => n + s.count, 0);
  const rects = total ? squarify(sorted.map((s) => (s.count / total) * W * H), { x: 0, y: 0, w: W, h: H }) : [];
  const top = sorted.find((s) => s.key !== 'other');
  const caption = top
    ? `Area = song count. ${top.label} is your biggest group.${noGenre ? ` ${noGenre.toLocaleString('en-US')} ${noGenre === 1 ? 'song has' : 'songs have'} no genre data yet.` : ''}`
    : 'No genre data yet.';
  const summary = sorted.map((s) => `${s.label} ${s.count.toLocaleString('en-US')}`).join(', ');

  return (
    <ChartCard
      id="c-genre"
      title="Genres"
      caption={caption}
      table={
        <DataTable
          caption="Songs per genre (a song can be in more than one)"
          columns={['Genre', 'Songs', 'Share']}
          numeric={[1, 2]}
          rows={[...genreTable.map((g) => [g.label, g.count, `${pct(g.count, songs)}%`]), ...(noGenre ? [['No genre data', noGenre, `${pct(noGenre, songs)}%`]] : [])]}
        />
      }
    >
      {total ? (
        <div role="img" aria-label={`Genre treemap: ${summary}`} className="tnum relative aspect-[8/5] w-full">
          {sorted.map((s, i) => {
            const r = rects[i]!;
            const wide = r.w / W >= 0.2 && r.h / H >= 0.16;
            const some = r.w / W >= 0.1 && r.h / H >= 0.12;
            return (
              <div
                key={s.key}
                title={`${s.label} · ${s.count.toLocaleString('en-US')} songs`}
                className="absolute p-px"
                style={{ left: `${(r.x / W) * 100}%`, top: `${(r.y / H) * 100}%`, width: `${(r.w / W) * 100}%`, height: `${(r.h / H) * 100}%` }}
              >
                <div className="size-full overflow-hidden rounded-art p-1.5 sm:p-2.5" style={{ background: s.color }}>
                  {wide || some ? (
                    <span className="inline-block max-w-full truncate rounded-pill bg-black/55 px-2 py-0.5 text-[12px] font-bold text-white sm:px-[9px] sm:py-[3px] sm:text-[13px]">
                      {wide ? `${s.label} ${s.count.toLocaleString('en-US')}` : s.count.toLocaleString('en-US')}
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <NoData>No genre data yet. Refresh the analysis in a little while.</NoData>
      )}
      {total ? (
        <ul className="m-0 flex list-none flex-wrap gap-x-3.5 gap-y-1.5 p-0 text-[13px] text-text-2">
          {sorted.map((s) => (
            <li key={s.key} className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-[2px]" style={{ background: s.color }} aria-hidden="true" />
              {s.label}
            </li>
          ))}
        </ul>
      ) : null}
    </ChartCard>
  );
}
