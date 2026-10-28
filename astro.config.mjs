import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import cards from './scripts/cards.mjs';

// Cloudflare Pages serves build/, both for git pushes and for `npm run deploy`
export default defineConfig({
  site: 'https://parthchandak.info',
  outDir: './build',
  integrations: [react()],
  build: {
    inlineStylesheets: 'never',
  },
  vite: {
    plugins: [cards()],
    build: {
      // Browsers the CSS is written for. Naming Safari 15 makes the minifier keep -webkit-backdrop-filter
      // beside backdrop-filter; without targets it kept only one of the pair, and Chrome lost the glass.
      cssTarget: ['chrome107', 'edge107', 'firefox104', 'safari15', 'ios15'],
    },
  },
});
