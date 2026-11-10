import { defineConfig, globalIgnores } from 'eslint/config';
import common, { importOrder } from 'active-book-common/eslint';

export default defineConfig([
  globalIgnores([
    '**/*.js',
    'lib',
    'scripts',
    'd.ts',
    'dist',
    'dist-book',
    '.active-book-temp',
    'node_modules',
  ]),
  {
    extends: [common],
    settings: { 'import-x/internal-regex': '^(@root|@build|@project|@hooks|@components|@utils|@active-book/core)(/.*)?$' },
    rules: {
      'import-x/order': ['error', {
        ...importOrder,
        pathGroups: [
          { pattern: 'react', group: 'external', position: 'before' },
          { pattern: 'react-dom{,/**}', group: 'external', position: 'before' },

          { pattern: '@active-book/types{,/**}', group: 'external', position: 'after' },

          { pattern: '@active-book/core/@types{,/**}', group: 'internal', position: 'before' },
          { pattern: '@active-book/core/assets{,/**}', group: 'internal', position: 'before' },
          { pattern: '@active-book/core/styles{,/**}', group: 'internal', position: 'before' },
          { pattern: '@active-book/core/pages{,/**}', group: 'internal', position: 'before' },
          { pattern: '@active-book/core/store{,/**}', group: 'internal', position: 'before' },
          { pattern: '@active-book/core/hooks{,/**}', group: 'internal', position: 'before' },
          { pattern: '@active-book/core/components{,/**}', group: 'internal', position: 'before' },
          { pattern: '@active-book/core/utils{,/**}', group: 'internal', position: 'before' },
          { pattern: '@active-book/core{,/**}', group: 'internal', position: 'before' },

          { pattern: 'active-book-editor{,/**}', group: 'internal', position: 'after' },
          { pattern: '@active-book/book-builder{,/**}', group: 'internal', position: 'after' },

          { pattern: '@root{,/**}', group: 'internal', position: 'after' },
          { pattern: '@types{,/**}', group: 'internal', position: 'after' },
          { pattern: '@build{,/**}', group: 'internal', position: 'after' },
          { pattern: '@project{,/**}', group: 'internal', position: 'after' },
          { pattern: '@hooks{,/**}', group: 'internal', position: 'after' },
          { pattern: '@components{,/**}', group: 'internal', position: 'after' },
          { pattern: '@utils{,/**}', group: 'internal', position: 'after' },
        ],
      }],
    },
  },
]);
