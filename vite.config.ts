import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import { PluginOption } from 'vite';
import { defineConfig } from 'vitest/config'; //au lieu de { defineConfig } from 'vitest/config' pour pouvoir configurer test

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), visualizer() as PluginOption],
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
    // setupFiles: './vitest.setup.ts',
    setupFiles: process.env.NODE_ENV === 'production' ? [] : ['./vitest.setup.ts'], // Ne pas charger le fichier de setup en production
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
  server: {
    proxy: {
      '/gallica': {
        //url vers laquelle les requêtes sont envoyées
        target: 'http://localhost/', //cible de la redirection
        changeOrigin: true,
        // secure: false,
        rewrite(url) {
          console.log('url', url);
          return url.replace('native', 'default');
        },
      },
    },
  },
});

// article à propos des chunks : https://dev.to/tassiofront/splitting-vendor-chunk-with-vite-and-loading-them-async-15o3
