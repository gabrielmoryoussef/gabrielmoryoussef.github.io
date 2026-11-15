import type { APIRoute, GetStaticPaths } from 'astro';
import sharp from 'sharp';
import { iconSvg } from '@/lib/motif';

const SIZES = { 'apple-touch-icon': 180, 'icon-192': 192, 'icon-512': 512, 'icon-maskable': 512 } as const;

export const getStaticPaths: GetStaticPaths = () =>
  Object.keys(SIZES).map((icon) => ({ params: { icon } }));

export const GET: APIRoute = async ({ params }) => {
  const name = params.icon as keyof typeof SIZES;
  const size = SIZES[name];
  // Apple and maskable icons get a full-bleed square; the OS applies its own mask.
  const svg = iconSvg(size, { bg: '#f4f0e6', ink: '#1c1b18', accent: '#b8341b', rounded: name === 'icon-192' || name === 'icon-512' });
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
