// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://gabrielmoryoussef.github.io',
  trailingSlash: 'ignore',
  build: { format: 'directory', inlineStylesheets: 'always' },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  integrations: [
    sitemap({
      // Legacy /publication/<slug>/ pages are redirect stubs — keep them out of the sitemap.
      filter: (page) => !page.includes('/publication/') && !page.endsWith('/404/'),
    }),
  ],
});
