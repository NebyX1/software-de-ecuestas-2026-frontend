import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  css: { postcss: { plugins: [] } },
  server: {
    proxy: {
      '/api': { target: process.env.BACKEND_UPSTREAM || 'http://127.0.0.1:5000' },
      '/admin': { target: process.env.BACKEND_UPSTREAM || 'http://127.0.0.1:5000' },
      '/public': { target: process.env.BACKEND_UPSTREAM || 'http://127.0.0.1:5000' },
      '/static': { target: process.env.BACKEND_UPSTREAM || 'http://127.0.0.1:5000' },
    },
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          validation: ['zod', 'react-hook-form', '@hookform/resolvers'],
          data: ['axios', '@tanstack/react-query', 'zustand'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    restoreMocks: true,
    clearMocks: true,
    exclude: ['node_modules/**', 'e2e/**'],
  },
});
