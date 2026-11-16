import { defineConfig, globalIgnores } from 'eslint/config';
import common, { globals, importOrder } from '@active-book/common/eslint';

export default defineConfig([
  globalIgnores([
    '**/node_modules/**',
    '**/{lib,dist,dist-book,coverage,test-results}/**',
    '**/{.active-book-temp,.active-book-build,.vitest-attachments}/**',
  ]),
  {
    extends: [common],
    settings: {
      'import-x/internal-regex': '^(@root|@build|@project|@hooks|@components|@utils|@active-book/core)(/.*)?$',
    },
    rules: {
      'import-x/order': [
        'error',
        {
          ...importOrder,
          pathGroups: [
            {
              pattern: 'react',
              group: 'external',
              position: 'before',
            },
            {
              pattern: 'react-dom{,/**}',
              group: 'external',
              position: 'before',
            },

            {
              pattern: '@active-book/types{,/**}',
              group: 'external',
              position: 'after',
            },

            {
              pattern: '@active-book/core/@types{,/**}',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: '@active-book/core/assets{,/**}',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: '@active-book/core/styles{,/**}',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: '@active-book/core/pages{,/**}',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: '@active-book/core/store{,/**}',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: '@active-book/core/hooks{,/**}',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: '@active-book/core/components{,/**}',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: '@active-book/core/utils{,/**}',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: '@active-book/core{,/**}',
              group: 'internal',
              position: 'before',
            },

            {
              pattern: 'active-book-editor{,/**}',
              group: 'internal',
              position: 'after',
            },
            {
              pattern: '@active-book/book-builder{,/**}',
              group: 'internal',
              position: 'after',
            },

            {
              pattern: '@root{,/**}',
              group: 'internal',
              position: 'after',
            },
            {
              pattern: '@types{,/**}',
              group: 'internal',
              position: 'after',
            },
            {
              pattern: '@build{,/**}',
              group: 'internal',
              position: 'after',
            },
            {
              pattern: '@project{,/**}',
              group: 'internal',
              position: 'after',
            },
            {
              pattern: '@hooks{,/**}',
              group: 'internal',
              position: 'after',
            },
            {
              pattern: '@components{,/**}',
              group: 'internal',
              position: 'after',
            },
            {
              pattern: '@utils{,/**}',
              group: 'internal',
              position: 'after',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.{js,jsx,mjs,cjs}'],
    languageOptions: { parserOptions: { project: null } },
  },
  {
    files: [
      'apps/*/src/**/*.{ts,tsx,js,jsx,mjs}',
      'tests/fixtures/**/*.{ts,tsx,js}',
      'tests/editor-effects/**/*.ts',
    ],
    languageOptions: { globals: globals.browser },
  },
  {
    files: [
      '*.{js,mjs,cjs}',
      '*.config.ts',
      'scripts/**/*.{js,mjs,cjs}',
      'config/**/*.js',
      'apps/*/*.config.ts',
      'packages/book-builder/src/{build,server,bookPreparation}/**/*.ts',
      'packages/book-builder/src/cli.ts',
      'packages/book-builder/src/**/*.{test,spec}.ts',
      'tests/package-core/**/*.mjs',
      'tests/infrastructure/**/*.{js,mjs,cjs}',
      'tests/eslint/**/*.{js,mjs,cjs}',
      'tests/book-runtime/**/*.ts',
      'tests/media/**/*.ts',
    ],
    languageOptions: { globals: globals.nodeBuiltin },
  },
  {
    files: ['*.cjs', '{scripts,config,tests}/**/*.cjs'],
    languageOptions: { globals: globals.node },
  },
  {
    // Custom modules run in the browser; Playwright harnesses also serialize page callbacks.
    files: [
      'packages/book-builder/src/components/custom/**/*.{ts,tsx}',
      'tests/setup-*.ts',
      'tests/{book-runtime,media}/**/*.ts',
    ],
    languageOptions: { globals: globals.browser },
  },
]);
