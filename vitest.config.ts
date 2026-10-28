import { fileURLToPath } from 'node:url';

import { playwright } from '@vitest/browser-playwright';
import { defineConfig, mergeConfig } from 'vitest/config';

import editorConfig from './apps/editor/vite.config';

export default defineConfig((env) => mergeConfig(editorConfig(env), {
  root: fileURLToPath(new URL('.', import.meta.url)),
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['apps/*/src/**/*.{ts,tsx}', 'packages/*/src/**/*.{ts,tsx}'],
      exclude: ['**/*.d.ts', '**/*.{test,spec}.{ts,tsx}', '**/*.{component,browser}.test.{ts,tsx}'],
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['{apps,packages}/**/*.{test,spec}.{ts,tsx}'],
          exclude: ['**/*.component.test.{ts,tsx}', '**/*.browser.test.{ts,tsx}', '**/node_modules/**'],
        },
      },
      {
        extends: true,
        test: {
          name: 'component',
          environment: 'jsdom',
          include: ['{apps,packages}/**/*.component.test.{ts,tsx}'],
          setupFiles: ['./tests/setup-component.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'browser',
          include: ['{apps,packages}/**/*.browser.test.{ts,tsx}'],
          setupFiles: ['./tests/setup-browser.ts'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({
              launchOptions: {
                executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
              },
            }),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
}));
