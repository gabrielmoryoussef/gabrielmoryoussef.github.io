/**
 * A static rendering of the hero figure as SVG — used for the OG image and icons.
 * Deterministic: same seed, same picture.
 */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function motifSvg(opts: {
  width: number;
  height: number;
  cx: number;
  cy: number;
  r: number;
  ink: string;
  accent: string;
  n?: number;
  /** fraction of points that sit on the simplex vs. background noise */
  structure?: number;
}): string {
  const { width, height, cx, cy, r, ink, accent, n = 1400, structure = 0.78 } = opts;
  const rnd = mulberry32(20261214);
  const gauss = () => Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(2 * Math.PI * rnd());
  const V = [0, 1, 2].map((k) => {
    const th = -Math.PI / 2 + (k * 2 * Math.PI) / 3;
    return [cx + r * Math.cos(th), cy + r * Math.sin(th)];
  });
  const out: string[] = [];
  out.push(
    `<path d="M${V[0][0]} ${V[0][1]}L${V[1][0]} ${V[1][1]}L${V[2][0]} ${V[2][1]}Z" fill="none" stroke="${ink}" stroke-opacity="0.35" stroke-width="1.2" stroke-dasharray="3 6"/>`,
  );
  for (let i = 0; i < n; i++) {
    let x: number;
    let y: number;
    if (rnd() < structure) {
      const a = Math.pow(-Math.log(1 - rnd()), 1.4);
      const b = Math.pow(-Math.log(1 - rnd()), 1.4);
      const c = Math.pow(-Math.log(1 - rnd()), 1.4);
      const s = a + b + c;
      x = (a * V[0][0] + b * V[1][0] + c * V[2][0]) / s + gauss() * r * 0.1;
      y = (a * V[0][1] + b * V[1][1] + c * V[2][1]) / s + gauss() * r * 0.1;
    } else {
      x = rnd() * width;
      y = rnd() * height;
    }
    const o = [0.22, 0.36, 0.55][Math.floor(rnd() * 3)];
    const sz = 1.4 + rnd() * 1.2;
    out.push(`<rect x="${(x - sz / 2).toFixed(1)}" y="${(y - sz / 2).toFixed(1)}" width="${sz.toFixed(1)}" height="${sz.toFixed(1)}" fill="${ink}" fill-opacity="${o}"/>`);
  }
  // Signals by the vertices
  for (let i = 0; i < 12; i++) {
    const k = i % 3;
    const t = 0.08 + rnd() * 0.1;
    const other = V[(k + 1 + (i % 2)) % 3];
    const x = V[k][0] + (other[0] - V[k][0]) * t * rnd() + gauss() * 4;
    const y = V[k][1] + (other[1] - V[k][1]) * t * rnd() + gauss() * 4;
    out.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" fill="${accent}" fill-opacity="0.12"/>`);
    out.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="${accent}"/>`);
  }
  for (const [x, y] of V) {
    out.push(`<circle cx="${x}" cy="${y}" r="16" fill="none" stroke="${accent}" stroke-opacity="0.45" stroke-width="1.2"/>`);
    out.push(`<circle cx="${x}" cy="${y}" r="5" fill="${accent}"/>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${out.join('')}</svg>`;
}

/** The favicon / app icon: the site mark on a solid ground. */
export function iconSvg(size: number, opts: { bg: string; ink: string; accent: string; rounded?: boolean }): string {
  const { bg, ink, accent, rounded = true } = opts;
  const s = size;
  const p = (v: number) => ((v / 24) * s).toFixed(2);
  const rx = rounded ? (s * 0.22).toFixed(1) : '0';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <rect width="${s}" height="${s}" rx="${rx}" fill="${bg}"/>
  <g transform="translate(${s * 0.16} ${s * 0.14}) scale(0.68)">
    <path d="M${p(12)} ${p(3.6)}L${p(20.6)} ${p(18.8)}H${p(3.4)}Z" fill="none" stroke="${ink}" stroke-opacity="0.6" stroke-width="${p(1.3)}" stroke-linejoin="round"/>
    <circle cx="${p(3.4)}" cy="${p(18.8)}" r="${p(2.3)}" fill="${ink}"/>
    <circle cx="${p(20.6)}" cy="${p(18.8)}" r="${p(2.3)}" fill="${ink}"/>
    <circle cx="${p(12)}" cy="${p(3.6)}" r="${p(2.7)}" fill="${accent}"/>
  </g>
</svg>`;
}
