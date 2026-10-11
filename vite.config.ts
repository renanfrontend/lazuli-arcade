import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

const APP_NAME = 'Lazuli Arcade';
const APP_DESCRIPTION = 'Arcade de jogos casuais para o celular: Lazuli Blocks e Empilha.';
const THEME_COLOR = '#dce8f9';

/**
 * Two build targets:
 * - default: installable PWA (offline cache, manifest, icons), one chunk per game.
 *   Set BASE_PATH when serving from a sub-path, e.g. `/lazuli-arcade/` on GitHub Pages.
 * - `--mode artifact`: everything inlined into one chunk so `scripts/to-artifact.mjs`
 *   can fold the output into a single self-contained HTML page.
 */
export default defineConfig(({ mode }) => {
  const isArtifact = mode === 'artifact';

  return {
    base: isArtifact ? '/' : (process.env.BASE_PATH ?? '/'),
    resolve: {
      alias: { '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)) },
    },
    plugins: [
      react(),
      ...(isArtifact
        ? []
        : [
            VitePWA({
              registerType: 'autoUpdate',
              injectRegister: 'script-defer',
              includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
              manifest: {
                name: APP_NAME,
                short_name: 'Lazuli',
                description: APP_DESCRIPTION,
                lang: 'pt-BR',
                theme_color: THEME_COLOR,
                background_color: THEME_COLOR,
                display: 'standalone',
                orientation: 'portrait',
                start_url: '.',
                icons: [
                  { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
                  { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
                  { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
                ],
              },
              workbox: { globPatterns: ['**/*.{js,css,html,svg,png,woff2}'] },
            }),
          ]),
    ],
    build: isArtifact
      ? {
          outDir: 'dist-artifact',
          assetsInlineLimit: () => true,
          cssCodeSplit: false,
          modulePreload: false,
          rolldownOptions: { output: { codeSplitting: false } },
        }
      : { outDir: 'dist' },
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts'],
    },
  };
});
