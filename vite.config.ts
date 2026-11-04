import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import { loadEnv, PluginOption } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config'; //au lieu de { defineConfig } from 'vitest/config' pour pouvoir configurer test

console.log('process.env.NODE_ENV', process.env.REACT_APP_BASE);

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  const basePath = (env.VITE_BASE_PATH || '/').replace(/\/?$/, '/');
  console.log('mode: ', mode);
  console.log('NODE_ENV: ', process.env.NODE_ENV);

  //if NODE_ENV is test, use the test version of react-i18next and i18next
  const alias = [
    { find: '@', replacement: path.resolve(__dirname, './src') },
    ...(process.env.NODE_ENV === 'test'
      ? [
          {
            find: 'react-i18next',
            replacement: path.resolve(__dirname, './src/__tests__/react-i18next.ts'),
          },
          { find: 'i18next', replacement: path.resolve(__dirname, './src/__tests__/i18next.ts') },
        ]
      : []),
  ];

  return {
    assetsInclude: ['**/*.md'],
    plugins: [
      react(),
      tailwindcss(),
      visualizer() as PluginOption,
      VitePWA({
        registerType: 'autoUpdate',
        base: basePath,
        devOptions: {
          // Q9 : en mode e2e, pas de service worker — il court-circuiterait
          // l'interception réseau déterministe des tests Playwright.
          enabled: mode !== 'e2e',
        },
        manifest: {
          name: 'CorpuSense',
          short_name: 'CorpuSense',
          description: 'CorpuSense Application',
          theme_color: '#ffffff',
          icons: [
            {
              src: `${basePath.replace(/\/$/, '')}/images/logo.png`,
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: `${basePath.replace(/\/$/, '')}/images/logo.png`,
              sizes: '512x512',
              type: 'image/png',
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 6000000,
        },
      }),
    ],
    base: basePath,
    define: {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version),
    },
    resolve: {
      alias,
    },
    worker: {
      format: 'es',
    },
    optimizeDeps: {
      exclude: ['@hyzyla/pdfium'],
    },
    build: {
      target: 'es2022',
      commonjsOptions: {
        include: [/pdfium/, /node_modules/],
      },
      rollupOptions: {
        output: {
          manualChunks: {
            annotorious: ['@annotorious/react'],
            clover: ['@samvera/clover-iiif'],
          },
        },
      },
    },
    test: {
      globals: true, // Activer les fonctions globales comme 'describe', 'it', etc.
      environment: 'jsdom', // Utiliser jsdom pour simuler un environnement de navigateur
      // Les specs Playwright (e2e/**/*.spec.ts) sont collectées par playwright, jamais par vitest.
      exclude: ['**/node_modules/**', '**/dist/**', '**/dev-dist/**', 'e2e/**', 'archive/**'],
      server: {
        deps: {
          // openseadragon est un module CJS importé avec des exports nommés par
          // @annotorious/openseadragon (@annotorious/react aussi en transitif).
          // Externalisé, Node ne résout pas les exports nommés ('Point'); on force
          // l'inline pour que Vite applique son interop CJS.
          inline: [/@annotorious\//, 'openseadragon'],
        },
      },
      setupFiles: process.env.NODE_ENV === 'test' ? ['./vitest.setup.ts'] : [], // Ne charge le fichier de configuration que pour les tests
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html', 'lcov'],
      },
    },
    server:
      // Q9 : le serveur e2e sert toujours en HTTP simple (pas de certs en CI ;
      // les certs locaux `certs/` sont désindexés). Le mode dev habituel est inchangé.
      process.env.NODE_ENV === 'development' && mode !== 'e2e'
        ? {
            https: {
              key: readFileSync('./certs/localhost+2-key.pem'),
              cert: readFileSync('./certs/localhost+2.pem'),
            },
          }
        : undefined,
  };
});

// article à propos des chunks : https://dev.to/tassiofront/splitting-vendor-chunk-with-vite-and-loading-them-async-15o3
