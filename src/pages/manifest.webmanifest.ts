import type { APIRoute } from 'astro';
import { site } from '@/data/site';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify({
      name: site.name,
      short_name: 'G. Moryoussef',
      start_url: '/',
      display: 'browser',
      background_color: '#f4f0e6',
      theme_color: '#f4f0e6',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    }),
    { headers: { 'Content-Type': 'application/manifest+json' } },
  );
