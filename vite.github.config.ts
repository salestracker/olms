import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/olms/', // Base path for GitHub Pages - matches repository name
  build: {
    // Specify the entry point for GitHub Pages
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
      output: {
        manualChunks: undefined
      }
    },
    // Ensure assets are handled correctly
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: false
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});