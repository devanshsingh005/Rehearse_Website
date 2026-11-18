// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  site: 'https://letsrehearse.studio',

  // Admin pages are private: keep them out of the sitemap (they also send noindex).
  integrations: [sitemap({ filter: (page) => !page.includes('/404') && !page.includes('/admin') })],

  // Fetch internal pages on hover so moving between pages feels instant.
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },

  // Self-hosted fonts: no third-party requests, preloaded, with metric-matched
  // fallbacks so text doesn't jump when the web font arrives.
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Inter',
      cssVariable: '--font-inter',
      fallbacks: ['system-ui', 'sans-serif'],
      options: {
        variants: [
          {
            src: ['./src/assets/fonts/inter-latin-opsz-normal.woff2'],
            weight: '100 900',
            style: 'normal',
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'Instrument Serif',
      cssVariable: '--font-serif',
      fallbacks: ['Georgia', 'serif'],
      options: {
        variants: [
          {
            src: ['./src/assets/fonts/instrument-serif-latin-400-italic.woff2'],
            weight: '400',
            style: 'italic',
          },
        ],
      },
    },
  ],

  devToolbar: { enabled: false },
});
