const W = 600;
const H = 70;

/** "Energy across the mix": an area line of each track's energy in the current order. */
export function EnergyChart({ energies }: { energies: Array<number | null> }) {
  const points = energies.map((e, i) => ({ i, e })).filter((p): p is { i: number; e: number } => p.e !== null);
  if (points.length < 2) {
    return <p className="m-0 flex h-[70px] items-center text-[13px] text-text-3">Not enough energy data to draw this yet.</p>;
  }
  const last = Math.max(1, energies.length - 1);
  const x = (i: number) => (i / last) * W;
  const y = (e: number) => H - 4 - e * (H - 10);
  const line = points.map((p, k) => `${k ? 'L' : 'M'}${x(p.i).toFixed(1)} ${y(p.e).toFixed(1)}`).join(' ');
  const area = `${line} L${x(points[points.length - 1]!.i).toFixed(1)} ${H} L${x(points[0]!.i).toFixed(1)} ${H}Z`;
  const peak = points.reduce((best, p) => (p.e > best.e ? p : best));
  const pct = (e: number) => `${Math.round(e * 100)}%`;
  const label = `Energy starts at ${pct(points[0]!.e)}, peaks at ${pct(peak.e)} at track ${peak.i + 1}, and ends at ${pct(points[points.length - 1]!.e)}.`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={label} className="block h-[70px] w-full">
      <path d={area} fill="rgba(139,92,246,0.18)" />
      <path d={line} fill="none" stroke="#8B5CF6" strokeWidth={2} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function peakTrack(energies: Array<number | null>): number | null {
  let best: number | null = null;
  energies.forEach((e, i) => {
    if (e !== null && (best === null || e > (energies[best] ?? -1))) best = i;
  });
  return best;
}
