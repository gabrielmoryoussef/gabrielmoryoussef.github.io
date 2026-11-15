/// <reference lib="webworker" />
/**
 * Runs the hero figure on an OffscreenCanvas so animation never blocks the main thread.
 */
import { createEngine, createLoop, type Engine, type EngineState } from './hero-engine';

export type HeroMsg =
  | { type: 'init'; canvas: OffscreenCanvas; state: EngineState; ink: string; accent: string; reduce: boolean }
  | { type: 'resize'; state: EngineState }
  | { type: 'colors'; ink: string; accent: string }
  | { type: 'pointer'; x: number; y: number; active: boolean }
  | { type: 'reduce'; value: boolean }
  | { type: 'run'; value: boolean };

let engine: Engine | null = null;
let loop: ReturnType<typeof createLoop> | null = null;
let wantRun = false;
let reduce = false;

const post = (hud: string) => (self as DedicatedWorkerGlobalScope).postMessage({ type: 'hud', hud });

function sync() {
  if (!loop) return;
  if (wantRun && !reduce) loop.start();
  else {
    loop.stop();
    loop.still();
  }
}

self.onmessage = (e: MessageEvent<HeroMsg>) => {
  const msg = e.data;
  switch (msg.type) {
    case 'init': {
      engine = createEngine(msg.canvas, (w, h) => new OffscreenCanvas(w, h));
      if (!engine) return;
      engine.setColors(msg.ink, msg.accent);
      engine.resize(msg.state);
      reduce = msg.reduce;
      engine.setReduce(reduce);
      loop = createLoop(engine, post);
      loop.still();
      break;
    }
    case 'resize':
      engine?.resize(msg.state);
      if (loop && !loop.running) loop.still();
      break;
    case 'colors':
      engine?.setColors(msg.ink, msg.accent);
      if (loop && !loop.running) loop.still();
      break;
    case 'pointer':
      engine?.setPointer(msg.x, msg.y, msg.active);
      break;
    case 'reduce':
      reduce = msg.value;
      engine?.setReduce(reduce);
      sync();
      break;
    case 'run':
      wantRun = msg.value;
      sync();
      break;
  }
};
