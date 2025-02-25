import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig, PluginOption } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

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
});

// article à propos des chunks : https://dev.to/tassiofront/splitting-vendor-chunk-with-vite-and-loading-them-async-15o3
