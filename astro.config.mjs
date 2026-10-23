import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// Cloudflare Pages serves build/, both for git pushes and for `npm run deploy`
export default defineConfig({
  site: 'https://parthchandak.info',
  outDir: './build',
  integrations: [react()],
  build: {
    inlineStylesheets: 'never',
  },
});
