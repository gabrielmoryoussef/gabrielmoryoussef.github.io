/**
 * Hero figure host. Measures the page, forwards pointer/theme/visibility, and renders via
 * an OffscreenCanvas in a Web Worker when available (main thread stays free), falling
 * back to rendering on the main thread otherwise.
 *
 * DPR-aware (capped at 2), fewer points on small screens, paused off-screen and in hidden
 * tabs, and a single static frame under prefers-reduced-motion.
 */
import { createEngine, createLoop, type EngineState } from './hero-engine';
import type { HeroMsg } from './hero-worker';

type Driver = {
  resize(s: EngineState): void;
  colors(ink: string, accent: string): void;
  pointer(x: number, y: number, active: boolean): void;
  reduce(v: boolean): void;
  run(v: boolean): void;
};

export function mountHero(
  canvas: HTMLCanvasElement,
  opts: { hud?: HTMLElement | null; host: HTMLElement; text?: HTMLElement | null },
) {
  const reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  const onHud = (s: string) => {
    if (opts.hud) opts.hud.textContent = s;
  };

  const measure = (): EngineState => {
    const r = canvas.getBoundingClientRect();
    const W = Math.max(1, Math.round(r.width));
    const H = Math.max(1, Math.round(r.height));
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const navH = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 3.75) * rem;
    const textTop = opts.text ? opts.text.getBoundingClientRect().top - r.top : H * 0.55;
    const wrap = opts.text?.parentElement;
    const right = wrap ? wrap.getBoundingClientRect().right - r.left - parseFloat(getComputedStyle(wrap).paddingRight) : 0;
    return { W, H, dpr: Math.min(window.devicePixelRatio || 1, 2), band: { top: navH + 24, bottom: textTop - 20 }, right };
  };

  const colors = () => {
    const cs = getComputedStyle(document.documentElement);
    return { ink: cs.getPropertyValue('--ink').trim() || '#1c1b18', accent: cs.getPropertyValue('--accent').trim() || '#b8341b' };
  };

  let driver: Driver | null = null;
  const c0 = colors();

  if ('transferControlToOffscreen' in canvas && typeof Worker !== 'undefined') {
    try {
      const worker = new Worker(new URL('./hero-worker.ts', import.meta.url), { type: 'module' });
      const offscreen = canvas.transferControlToOffscreen();
      const send = (m: HeroMsg, transfer: Transferable[] = []) => worker.postMessage(m, transfer);
      worker.onmessage = (e) => e.data?.type === 'hud' && onHud(e.data.hud);
      send({ type: 'init', canvas: offscreen, state: measure(), ink: c0.ink, accent: c0.accent, reduce: reduceMQ.matches }, [offscreen]);
      driver = {
        resize: (state) => send({ type: 'resize', state }),
        colors: (ink, accent) => send({ type: 'colors', ink, accent }),
        pointer: (x, y, active) => send({ type: 'pointer', x, y, active }),
        reduce: (value) => send({ type: 'reduce', value }),
        run: (value) => send({ type: 'run', value }),
      };
    } catch {
      driver = null; // fall through to main thread
    }
  }

  if (!driver) {
    const engine = createEngine(canvas, (w, h) => Object.assign(document.createElement('canvas'), { width: w, height: h }));
    if (!engine) return;
    engine.setColors(c0.ink, c0.accent);
    engine.resize(measure());
    engine.setReduce(reduceMQ.matches);
    const loop = createLoop(engine, onHud);
    let want = false;
    const sync = () => {
      if (want && !reduceMQ.matches) loop.start();
      else {
        loop.stop();
        loop.still();
      }
    };
    loop.still();
    driver = {
      resize: (s) => {
        engine.resize(s);
        if (!loop.running) loop.still();
      },
      colors: (ink, accent) => {
        engine.setColors(ink, accent);
        if (!loop.running) loop.still();
      },
      pointer: (x, y, a) => engine.setPointer(x, y, a),
      reduce: (v) => {
        engine.setReduce(v);
        sync();
      },
      run: (v) => {
        want = v;
        sync();
      },
    };
  }

  const d = driver;

  // Run only while on screen and the tab is visible.
  let onScreen = true;
  const update = () => d.run(onScreen && !document.hidden);
  new IntersectionObserver(([e]) => {
    onScreen = e.isIntersecting;
    update();
  }).observe(canvas);
  document.addEventListener('visibilitychange', update);

  // Size.
  let rz = 0;
  new ResizeObserver(() => {
    cancelAnimationFrame(rz);
    rz = requestAnimationFrame(() => d.resize(measure()));
  }).observe(canvas);

  // Pointer — listen on the host so text above the canvas doesn't block it.
  const host = opts.host;
  let pending: PointerEvent | null = null;
  const flush = () => {
    if (!pending) return;
    const r = canvas.getBoundingClientRect();
    d.pointer(pending.clientX - r.left, pending.clientY - r.top, true);
    pending = null;
  };
  const move = (e: PointerEvent) => {
    if (!pending) requestAnimationFrame(flush);
    pending = e;
  };
  host.addEventListener('pointermove', move, { passive: true });
  host.addEventListener('pointerdown', move, { passive: true });
  const leave = () => d.pointer(-9999, -9999, false);
  host.addEventListener('pointerleave', leave);
  host.addEventListener('pointercancel', leave);
  host.addEventListener('pointerup', (e) => e.pointerType !== 'mouse' && leave());

  // Preferences.
  reduceMQ.addEventListener('change', () => d.reduce(reduceMQ.matches));
  const recolor = () => {
    const c = colors();
    d.colors(c.ink, c.accent);
  };
  window.addEventListener('themechange', recolor);
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', recolor);

  canvas.classList.add('is-ready');
  update();
}
