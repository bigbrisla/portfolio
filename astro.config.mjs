// @ts-check
import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import sitemap from '@astrojs/sitemap';

// TODO(deploy): replace with the real domain once chosen (see CONTENT_TODO.md)
const SITE = 'https://riccardo-bedogni.pages.dev';

export default defineConfig({
  site: SITE,
  // flat files (projects/foo.html): Cloudflare Pages serves /projects/foo with no redirect,
  // so every internal link and canonical URL is used without a trailing slash
  trailingSlash: 'never',
  // CSS is small; inlining removes the render-blocking request on first paint
  build: { inlineStylesheets: 'always', format: 'file' },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'it'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    vue(),
    sitemap({
      filter: (page) => !page.includes('/styleguide'),
      i18n: { defaultLocale: 'en', locales: { en: 'en', it: 'it' } },
    }),
  ],
});
