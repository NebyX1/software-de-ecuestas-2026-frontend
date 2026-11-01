import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, process.cwd(), 'VITE_');
  const apiOrigin = new URL((process.env.VITE_API_URL ?? environment.VITE_API_URL)?.trim() || 'http://localhost:5000').origin;
  return {
    plugins: [react(), tailwindcss(), {
      name: 'survey-api-preconnect',
      transformIndexHtml: () => [{ tag: 'link', attrs: { rel: 'preconnect', href: apiOrigin, crossorigin: 'use-credentials' }, injectTo: 'head-prepend' as const }],
    }],
    css: { postcss: { plugins: [] } },
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
  };
});
