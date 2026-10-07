import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      pages: 'dist',
      assets: 'dist',
      fallback: '404.html',
      precompress: false,
      strict: true,
    }),
    paths: {
      // GitHub Pages serves the site under /strategihub-v2/
      base: '/strategihub-v2',
    },
    prerender: {
      entries: ['*'],
    },
  },
};

export default config;
