import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
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
});
