import { fileURLToPath } from 'node:url';

import common, { browser, component, unit } from '@active-book/common/vitest';
import { defineConfig, mergeConfig } from 'vitest/config';

import editorConfig from './apps/editor/vite.config';

export default defineConfig((env) => mergeConfig(
  mergeConfig(editorConfig(env), common),
  {
    root: fileURLToPath(new URL('.', import.meta.url)),
    optimizeDeps: { include: ['@active-book/core/controllers/visualEffects'] },
    test: {
      coverage: { include: ['apps/*/src/**/*.{ts,tsx}', 'packages/*/src/**/*.{ts,tsx}'] },
      projects: [
        mergeConfig(unit, {
          extends: true,
          test: { include: ['{apps,packages}/**/*.{test,spec}.{ts,tsx}'] },
        }),
        mergeConfig(component, {
          extends: true,
          test: {
            include: ['{apps,packages}/**/*.component.test.{ts,tsx}'],
            setupFiles: ['./tests/setup-component.ts'],
          },
        }),
        mergeConfig(browser(env.mode), {
          extends: true,
          test: {
            include: ['{apps,packages}/**/*.browser.test.{ts,tsx}'],
            setupFiles: ['./tests/setup-browser.ts'],
          },
        }),
      ],
    },
  },
));
