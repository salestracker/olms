import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/olms/', // Base path for GitHub Pages - matches repository name
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/trpc': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Mark server-specific modules as external. This prevents Vite from bundling them into the client code.
    rollupOptions: {
      external: ['express', 'lumos-ts'],
      output: {
        manualChunks: undefined
      }
    },
    // Ensure assets are handled correctly
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: false
  },
});