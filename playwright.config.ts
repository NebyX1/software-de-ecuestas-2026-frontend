import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('./', import.meta.url));

export default defineConfig({
  testDir: './e2e',
  testMatch: 'controls.spec.ts',
  outputDir: './test-results/visual',
  timeout: 60_000,
  expect: { timeout: 5000 },
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4328',
    viewport: { width: 1280, height: 1000 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4328 --strictPort',
    cwd: root,
    url: 'http://127.0.0.1:4328',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
