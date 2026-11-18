import { fileURLToPath } from 'node:url';

import { defineConfig, mergeConfig } from 'vitest/config';

import common, {
  browser,
  component,
  unit,
} from '@active-book/common/vitest';

import editorConfig from './apps/editor/vite.config';

export default defineConfig((env) => {
  const mergedEditorConfig = mergeConfig(editorConfig(env), common);

  const contentBenchmark = process.env.npm_lifecycle_event === 'bench:content';

  return mergeConfig(mergedEditorConfig, {
    root: fileURLToPath(new URL('.', import.meta.url)),
    test: {
      provide: { contentBenchmark },
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
            include: [
              '{apps,packages}/**/*.browser.test.{ts,tsx}',
              'tests/package-core/*.browser.test.{ts,tsx}',
            ],
            setupFiles: ['./tests/setup-browser.ts'],
          },
        }),
      ],
    },
  });
});
