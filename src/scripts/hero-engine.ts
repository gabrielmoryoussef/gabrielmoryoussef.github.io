/**
 * Hero figure engine — "rare signals & latent structure".
 *
 * A cloud of n faint observations drifts as noise. A rare few (ε ≈ 0.6%) are signals,
 * drawn in the accent colour. On a slow loop the cloud resolves into a noisy 2-simplex —
 * most points take barycentric positions inside it, a minority stay as outliers — and
 * the K = 3 vertices are "found" (they pulse), before the structure relaxes back to noise.
 * Signals are the near-pure observations that sit by the vertices once structure appears.
 *
 * This module is DOM-free so it can run either in a Web Worker on an OffscreenCanvas
 * (the default — keeps the main thread free) or on the main thread as a fallback.
 */

type Ctx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
type AnyCanvas = HTMLCanvasElement | OffscreenCanvas;

type Pt = {
  bx: number; // base noise position, normalised [0,1]
  by: number;
  ph1: number; // drift phases / speeds
  ph2: number;
  sp1: number;
  sp2: number;
  amp: number; // drift amplitude (css px)
  w0: number; // barycentric coordinates on the simplex
  w1: number;
  w2: number;
  jx: number; // observation noise around the simplex (in units of R)
  jy: number;
  delay: number; // staggered arrival
  joins: boolean; // false → stays an outlier
  ox: number; // pointer displacement
  oy: number;
  vx: number;
  vy: number;
  x: number; // current position (css px)
  y: number;
  size: number;
  bucket: 0 | 1 | 2; // alpha bucket
  signal: boolean;
  pulse: number;
};

export const PERIOD = 19; // seconds per noise → structure → noise loop
const TAU = Math.PI * 2;
const K_NN = 6;

// Deterministic PRNG so every visit sees the same figure (and the static frame is stable).
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const smooth = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * t * (t * (t * 6 - 15) + 10); // smootherstep
};

/** Structure level m ∈ [0,1] over one loop: rest, organise, hold, relax. */
function structureAt(t: number): number {
  const u = (t % PERIOD) / PERIOD;
  if (u < 0.18) return 0; // noise
  if (u < 0.34) return smooth((u - 0.18) / 0.16); // forming (~3s)
  if (u < 0.74) return 1; // holding, vertices pulse
  return 1 - smooth((u - 0.74) / 0.26); // dissolving
}

export type EngineState = {
  W: number;
  H: number;
  dpr: number;
  /** Narrow screens: vertical band (css px) between nav and headline reserved for the figure. */
  band: { top: number; bottom: number };
  /** Right edge (css px) of the content column, so the figure stays inside it on ultrawide screens. */
  right?: number;
};

export function createEngine(canvas: AnyCanvas, makeCanvas: (w: number, h: number) => AnyCanvas) {
  const ctx = canvas.getContext('2d') as Ctx | null;
  if (!ctx) return null;

  let W = 0;
  let H = 0;
  let dpr = 1;
  let band = { top: 0, bottom: 0 };
  let right = 0;
  let pts: Pt[] = [];
  let signals: Pt[] = [];
  let mobile = false;
  let ink = '#1c1b18';
  let accent = '#b8341b';
  let glow: AnyCanvas | null = null;
  let reduce = false;
  let hudTick = 0;
  const pointer = { x: -9999, y: -9999, active: false };

  function makeGlow(color: string) {
    const s = 64;
    const c = makeCanvas(s, s);
    const g = c.getContext('2d') as Ctx;
    const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    grad.addColorStop(0, color);
    grad.addColorStop(0.25, color + '88');
    grad.addColorStop(1, color + '00');
    g.fillStyle = grad;
    g.fillRect(0, 0, s, s);
    return c;
  }

  function build() {
    mobile = W < 720;
    const area = W * H;
    const n = Math.round(Math.min(mobile ? 1100 : 2600, Math.max(700, area / (mobile ? 260 : 420))));
    const rnd = mulberry32(20261214);
    const gauss = () => {
      const u = 1 - rnd();
      const v = rnd();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v);
    };
    const nSignals = Math.max(12, Math.round(n * 0.006));
    pts = [];
    for (let i = 0; i < n; i++) {
      const signal = i < nSignals;
      // Noise placement: denser away from the headline so text stays legible.
      let bx: number;
      let by: number;
      if (mobile) {
        bx = rnd();
        by = Math.pow(rnd(), 1.35);
      } else {
        bx = rnd() < 0.72 ? Math.sqrt(rnd()) : rnd();
        by = rnd();
      }
      // Barycentric weights, skewed toward edges and vertices (Dirichlet-like, α < 1).
      let a = Math.pow(-Math.log(1 - rnd()), 1.4);
      let b = Math.pow(-Math.log(1 - rnd()), 1.4);
      let c = Math.pow(-Math.log(1 - rnd()), 1.4);
      if (signal) {
        // Signals are near-pure: they sit by a vertex.
        const k = i % 3;
        const pure = 0.86 + rnd() * 0.12;
        const r1 = rnd() * (1 - pure);
        const ws = [r1, 1 - pure - r1];
        a = k === 0 ? pure : ws.pop()!;
        b = k === 1 ? pure : ws.pop()!;
        c = k === 2 ? pure : ws.pop()!;
      }
      const s = a + b + c || 1;
      const jit = signal ? 0.025 : 0.055;
      pts.push({
        bx,
        by,
        ph1: rnd() * TAU,
        ph2: rnd() * TAU,
        sp1: 0.12 + rnd() * 0.22,
        sp2: 0.1 + rnd() * 0.2,
        amp: 6 + rnd() * 22,
        w0: a / s,
        w1: b / s,
        w2: c / s,
        jx: gauss() * jit,
        jy: gauss() * jit,
        delay: rnd(),
        joins: signal || rnd() < 0.76,
        ox: 0,
        oy: 0,
        vx: 0,
        vy: 0,
        x: 0,
        y: 0,
        size: signal ? 2.2 : 1.05 + rnd() * 0.95,
        bucket: (rnd() < 0.5 ? 0 : rnd() < 0.7 ? 1 : 2) as 0 | 1 | 2,
        signal,
        pulse: rnd() * TAU,
      });
    }
    signals = pts.filter((p) => p.signal);
  }

  function geometry(t: number) {
    let R = Math.min(W * 0.2, H * 0.34, 300);
    let cx = W * 0.7;
    if (right) cx = Math.min(cx, right - R * 0.95);
    let cy = H * 0.5;
    if (mobile) {
      const avail = Math.max(0, band.bottom - band.top);
      R = Math.max(56, Math.min(W * 0.34, avail / 1.6));
      cx = W * 0.5;
      // Triangle spans [cy − R, cy + R/2]; centre it in the band.
      cy = band.top + R + (avail - 1.5 * R) / 2;
    }
    const rot = 0.05 * Math.sin(t * 0.07);
    const V: [number, number][] = [0, 1, 2].map((k) => {
      const th = -Math.PI / 2 + (k * TAU) / 3 + rot;
      return [cx + R * Math.cos(th), cy + R * Math.sin(th)];
    });
    return { V, R };
  }

  function step(dt: number, t: number) {
    const m = reduce ? 0.93 : structureAt(t);
    const { V, R } = geometry(t);
    const PR = mobile ? 80 : 120; // pointer radius
    const usePointer = pointer.active && !reduce;

    for (const p of pts) {
      // Individual arrival: early points lead, late points trail.
      const mi = p.joins ? smooth(m * 1.35 - p.delay * 0.35) : 0;
      const nx = p.bx * W + p.amp * Math.sin(t * p.sp1 + p.ph1) + 0.5 * p.amp * Math.sin(t * p.sp2 * 1.7 + p.ph2);
      const ny = p.by * H + p.amp * Math.cos(t * p.sp2 + p.ph2) + 0.5 * p.amp * Math.cos(t * p.sp1 * 1.3 + p.ph1);
      // Observation on the simplex, with noise (some fall outside — as in vertex hunting).
      const wob = 0.35 + 0.65 * (1 - mi);
      const sx =
        p.w0 * V[0][0] + p.w1 * V[1][0] + p.w2 * V[2][0] + (p.jx + 0.01 * Math.sin(t * p.sp1 * 2 + p.ph1) * wob) * R * 2;
      const sy =
        p.w0 * V[0][1] + p.w1 * V[1][1] + p.w2 * V[2][1] + (p.jy + 0.01 * Math.cos(t * p.sp2 * 2 + p.ph2) * wob) * R * 2;
      const bx = nx + (sx - nx) * mi;
      const by = ny + (sy - ny) * mi;

      if (usePointer) {
        const dx = bx + p.ox - pointer.x;
        const dy = by + p.oy - pointer.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < PR * PR && d2 > 0.01) {
          const d = Math.sqrt(d2);
          const f = (1 - d / PR) ** 2 * 1.6;
          p.vx += (dx / d) * f;
          p.vy += (dy / d) * f;
        }
      }
      // Spring back to rest, damped.
      p.vx = (p.vx - p.ox * 0.045) * 0.86;
      p.vy = (p.vy - p.oy * 0.045) * 0.86;
      p.ox += p.vx * dt * 60;
      p.oy += p.vy * dt * 60;
      p.x = bx + p.ox;
      p.y = by + p.oy;
    }
    return { m, V, PR };
  }

  /** Draw one frame. Returns a HUD string about 4× per second (or on static draws), else null. */
  function draw(t: number, dt: number): string | null {
    if (!W || !H) return null;
    const { m, V, PR } = step(dt, t);
    const c = ctx!;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, W, H);

    // Simplex edges — a hairline that only exists once structure does.
    if (m > 0.02) {
      c.save();
      c.globalAlpha = 0.32 * m;
      c.strokeStyle = ink;
      c.lineWidth = 0.75;
      c.setLineDash([2, 4]);
      c.beginPath();
      c.moveTo(V[0][0], V[0][1]);
      c.lineTo(V[1][0], V[1][1]);
      c.lineTo(V[2][0], V[2][1]);
      c.closePath();
      c.stroke();
      c.restore();
    }

    // Observations, in three alpha buckets (few state changes).
    const alphas = [0.22, 0.38, 0.58];
    c.fillStyle = ink;
    for (let b = 0; b < 3; b++) {
      c.globalAlpha = alphas[b];
      for (const p of pts) {
        if (p.signal || p.bucket !== b) continue;
        const s = p.size;
        c.fillRect(p.x - s / 2, p.y - s / 2, s, s);
      }
    }

    // Signal ↔ neighbour edges near the pointer.
    if (pointer.active && !reduce) {
      c.strokeStyle = accent;
      c.lineWidth = 0.6;
      const near = PR * 1.6;
      const link = mobile ? 54 : 70;
      for (const s of signals) {
        const dp = Math.hypot(s.x - pointer.x, s.y - pointer.y);
        if (dp > near) continue;
        const strength = 1 - dp / near;
        // k nearest neighbours only — a sparse graph reads as structure, a dense one as noise.
        const nn: { p: Pt; d: number }[] = [];
        for (const p of pts) {
          if (p === s) continue;
          const dx = p.x - s.x;
          const dy = p.y - s.y;
          if (Math.abs(dx) > link || Math.abs(dy) > link) continue;
          const d = Math.hypot(dx, dy);
          if (d > link) continue;
          if (nn.length < K_NN) nn.push({ p, d });
          else {
            let worst = 0;
            for (let j = 1; j < nn.length; j++) if (nn[j].d > nn[worst].d) worst = j;
            if (d < nn[worst].d) nn[worst] = { p, d };
          }
        }
        for (const { p, d } of nn) {
          c.globalAlpha = 0.55 * strength * (1 - d / link);
          c.beginPath();
          c.moveTo(s.x, s.y);
          c.lineTo(p.x, p.y);
          c.stroke();
        }
      }
    }

    // Vertices: once found, they pulse.
    if (m > 0.6) {
      const k = smooth((m - 0.6) / 0.4);
      V.forEach(([vx, vy], i) => {
        const phase = reduce ? 0.45 : (t * 0.62 + i / 3) % 1;
        c.globalAlpha = k * (1 - phase) * 0.7;
        c.strokeStyle = accent;
        c.lineWidth = 1;
        c.beginPath();
        c.arc(vx, vy, 4 + phase * (mobile ? 16 : 24), 0, TAU);
        c.stroke();
        c.globalAlpha = k;
        c.fillStyle = accent;
        c.beginPath();
        c.arc(vx, vy, 2.6, 0, TAU);
        c.fill();
        // Crosshair ticks — a figure, not a screensaver.
        c.globalAlpha = k * 0.5;
        c.strokeStyle = ink;
        c.lineWidth = 0.75;
        c.beginPath();
        c.moveTo(vx - 11, vy);
        c.lineTo(vx - 7, vy);
        c.moveTo(vx + 7, vy);
        c.lineTo(vx + 11, vy);
        c.moveTo(vx, vy - 11);
        c.lineTo(vx, vy - 7);
        c.moveTo(vx, vy + 7);
        c.lineTo(vx, vy + 11);
        c.stroke();
      });
      if (!mobile) {
        c.globalAlpha = k * 0.75;
        c.fillStyle = ink;
        c.font = '11px "JetBrains Mono Variable", ui-monospace, monospace';
        c.textBaseline = 'middle';
        const labels = ['v₁', 'v₂', 'v₃'];
        const off: [number, number][] = [
          [14, -10],
          [14, 12],
          [-30, 12],
        ];
        V.forEach(([vx, vy], i) => c.fillText(labels[i], vx + off[i][0], vy + off[i][1]));
      }
    }

    // Signals: rare, glowing.
    for (const s of signals) {
      const pulse = reduce ? 0.85 : 0.7 + 0.3 * Math.sin(t * 1.6 + s.pulse);
      const g = (mobile ? 16 : 22) * (0.8 + 0.4 * m);
      if (glow) {
        c.globalAlpha = 0.32 * pulse;
        c.drawImage(glow, s.x - g / 2, s.y - g / 2, g, g);
      }
      c.globalAlpha = 0.9;
      c.fillStyle = accent;
      c.beginPath();
      c.arc(s.x, s.y, s.size * (0.85 + 0.15 * pulse), 0, TAU);
      c.fill();
    }
    c.globalAlpha = 1;

    if (dt === 0 || (hudTick += dt) > 0.25) {
      hudTick = 0;
      return `n = ${pts.length.toLocaleString('en-US')} · ε = ${(signals.length / pts.length).toFixed(3)} · K = 3 · structure ${String(Math.round(m * 100)).padStart(3, ' ')}%`;
    }
    return null;
  }

  return {
    resize(s: EngineState) {
      const first = W === 0;
      const wasMobile = mobile;
      W = s.W;
      H = s.H;
      dpr = s.dpr;
      band = s.band;
      right = s.right ?? 0;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      if (first || wasMobile !== W < 720) build();
    },
    setColors(nextInk: string, nextAccent: string) {
      ink = nextInk;
      accent = nextAccent;
      glow = makeGlow(accent);
    },
    setPointer(x: number, y: number, active: boolean) {
      pointer.x = x;
      pointer.y = y;
      pointer.active = active;
    },
    setReduce(v: boolean) {
      reduce = v;
    },
    draw,
  };
}

export type Engine = NonNullable<ReturnType<typeof createEngine>>;

/** A tiny frame loop shared by the worker and the main-thread fallback. */
export function createLoop(engine: Engine, onHud: (s: string) => void) {
  const raf: (cb: (t: number) => void) => number =
    typeof requestAnimationFrame === 'function'
      ? requestAnimationFrame.bind(globalThis)
      : (cb) => setTimeout(() => cb(performance.now()), 16) as unknown as number;
  const caf: (id: number) => void =
    typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame.bind(globalThis) : (id) => clearTimeout(id);

  let clock = PERIOD * 0.165; // start just before the simplex begins to form
  let running = false;
  let last = 0;
  let id = 0;

  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    clock += dt;
    const hud = engine.draw(clock, dt);
    if (hud) onHud(hud);
    id = raf(frame);
  };

  return {
    start() {
      if (running) return;
      running = true;
      last = performance.now();
      id = raf(frame);
    },
    stop() {
      running = false;
      caf(id);
    },
    /** Draw a single frame without advancing time (static / reduced motion / resize while paused). */
    still() {
      const hud = engine.draw(clock, 0);
      if (hud) onHud(hud);
    },
    get running() {
      return running;
    },
  };
}
