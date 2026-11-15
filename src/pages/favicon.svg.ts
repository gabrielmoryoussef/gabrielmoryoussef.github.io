import type { APIRoute } from 'astro';

// Theme-aware SVG favicon: the site mark, ink on paper / paper on ink.
export const GET: APIRoute = () =>
  new Response(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <style>
    .ink{fill:#1c1b18}.edge{stroke:#1c1b18}.sig{fill:#b8341b}
    @media (prefers-color-scheme: dark){.ink{fill:#ece6d9}.edge{stroke:#ece6d9}.sig{fill:#f2643f}}
  </style>
  <path class="edge" d="M12 3.6 20.6 18.8H3.4z" fill="none" stroke-opacity=".6" stroke-width="1.4" stroke-linejoin="round"/>
  <circle class="ink" cx="3.4" cy="18.8" r="2.4"/>
  <circle class="ink" cx="20.6" cy="18.8" r="2.4"/>
  <circle class="sig" cx="12" cy="3.6" r="2.8"/>
</svg>`,
    { headers: { 'Content-Type': 'image/svg+xml' } },
  );
