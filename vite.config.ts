import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

const APP_NAME = 'Lazuli Blocks';
const APP_DESCRIPTION = 'Block puzzle de gemas: complete linhas e colunas e transforme gemas em moedas.';
const THEME_COLOR = '#3a9fe9';

/**
 * Two build targets:
 * - default: installable PWA (offline cache, manifest, icons).
 * - `--mode artifact`: every asset inlined so `scripts/to-artifact.mjs`
 *   can fold the output into one self-contained HTML page.
 */
export default defineConfig(({ mode }) => {
  const isArtifact = mode === 'artifact';

  return {
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
        }
      : { outDir: 'dist' },
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts'],
    },
  };
});
