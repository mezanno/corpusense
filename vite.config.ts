import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import { PluginOption } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config'; //au lieu de { defineConfig } from 'vitest/config' pour pouvoir configurer test

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    visualizer() as PluginOption,
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: process.env.NODE_ENV === 'development' },
      workbox: {
        // cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /\.(?:json)$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'json-cache',
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|webp|thumbnail)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
            },
          },
        ],
      },
    }),
  ],
  base: '/corpusense',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
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
    setupFiles: './vitest.setup.ts',
    // include: ['**/*.test.ts', '**/*.test.tsx'],
    // exclude: [...configDefaults.exclude, 'node_modules'],
    coverage: {
      provider: 'v8',
    },
  },
});

// article à propos des chunks : https://dev.to/tassiofront/splitting-vendor-chunk-with-vite-and-loading-them-async-15o3
