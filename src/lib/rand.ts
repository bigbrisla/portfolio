/** Small seeded PRNG (mulberry32) so generated visuals are identical on every build. */
export function seeded(seed: number | string): () => number {
  let a =
    typeof seed === 'number'
      ? seed
      : [...seed].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Gaussian sample via Box–Muller. */
export function gaussian(rand: () => number): number {
  const u = 1 - rand();
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Many dots as one SVG path (two arcs per dot): far less markup than <circle>s. */
export function dotsPath(points: { x: number; y: number; r: number }[]): string {
  const f = (n: number) => Math.round(n * 10) / 10;
  return points
    .map(({ x, y, r }) => {
      const rr = f(r);
      return `M${f(x - r)} ${f(y)}a${rr} ${rr} 0 1 0 ${f(2 * r)} 0a${rr} ${rr} 0 1 0 ${f(-2 * r)} 0`;
    })
    .join('');
}
