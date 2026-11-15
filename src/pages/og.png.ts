import type { APIRoute } from 'astro';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { motifSvg } from '@/lib/motif';
import { site } from '@/data/site';

const require = createRequire(import.meta.url);
const font = (p: string) => readFile(require.resolve(p));

export const GET: APIRoute = async () => {
  const [serif, serifItalic, mono] = await Promise.all([
    font('@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff'),
    font('@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff'),
    font('@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff'),
  ]);
  const W = 1200;
  const H = 630;
  const paper = '#f4f0e6';
  const ink = '#1c1b18';
  const accent = '#b8341b';
  const motif = motifSvg({ width: W, height: H, cx: 880, cy: 330, r: 205, ink, accent, n: 1500 });
  const motifUri = `data:image/svg+xml;base64,${Buffer.from(motif).toString('base64')}`;

  const h = (type: string, style: Record<string, unknown>, children?: unknown) => ({
    type,
    props: { style, children },
  });

  const tree = h(
    'div',
    {
      width: W,
      height: H,
      display: 'flex',
      position: 'relative',
      background: paper,
      color: ink,
      fontFamily: 'Instrument Serif',
    },
    [
      { type: 'img', props: { src: motifUri, width: W, height: H, style: { position: 'absolute', left: 0, top: 0 } } },
      h(
        'div',
        { position: 'absolute', left: 72, bottom: 58, display: 'flex', flexDirection: 'column', width: 720 },
        [
          h('div', { display: 'flex', alignItems: 'center', fontFamily: 'JetBrains Mono', fontSize: 20, letterSpacing: 3, color: '#6b665c', marginBottom: 26 }, [
            h('div', { width: 10, height: 10, borderRadius: 10, background: accent, marginRight: 14 }),
            'STATISTICS & DATA SCIENCE',
          ]),
          h('div', { fontSize: 112, lineHeight: 1, letterSpacing: -2.5 }, site.givenName),
          h('div', { fontSize: 112, lineHeight: 1.05, letterSpacing: -2.5, fontStyle: 'italic', paddingLeft: 52 }, site.familyName),
          h('div', { fontFamily: 'JetBrains Mono', fontSize: 21, color: '#4f4b43', marginTop: 26, lineHeight: 1.5 }, 'Rare signals & latent structure · PhD, Carnegie Mellon'),
        ],
      ),
      h('div', { position: 'absolute', left: 0, right: 0, top: 0, height: 6, background: accent }),
    ],
  );

  const svg = await satori(tree as never, {
    width: W,
    height: H,
    fonts: [
      { name: 'Instrument Serif', data: serif, weight: 400, style: 'normal' },
      { name: 'Instrument Serif', data: serifItalic, weight: 400, style: 'italic' },
      { name: 'JetBrains Mono', data: mono, weight: 400, style: 'normal' },
    ],
  });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: W } }).render().asPng();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
