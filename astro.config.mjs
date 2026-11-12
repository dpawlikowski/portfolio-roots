import { defineConfig } from 'astro/config';
import { readFileSync } from 'node:fs';

const studio = JSON.parse(readFileSync(new URL('./content/studio.json', import.meta.url), 'utf8'));

// SITE_URL and BASE_PATH let the same code deploy to a custom domain (base "/")
// or to GitHub Pages under a project path (e.g. https://dpawlikowski.github.io/portfolio-roots/).
const site = process.env.SITE_URL || studio.site.url;
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'ignore',
  build: {
    // One page: inline CSS removes the only render-blocking request.
    inlineStylesheets: 'always',
    format: 'file',
  },
  image: {
    // Generated sizes stay in the build; real photos go through the same pipeline.
    responsiveStyles: false,
  },
  vite: {
    build: {
      // Keeps lazy modules (motion, shader, trail, audio) as separate chunks.
      modulePreload: { polyfill: false },
    },
  },
});
