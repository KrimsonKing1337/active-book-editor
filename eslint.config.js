import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { fixupPluginRules } from '@eslint/compat';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import { defineConfig, globalIgnores } from 'eslint/config';
import _import from 'eslint-plugin-import';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

const ignores = [
  '**/*.js',
  'lib',
  'scripts',
  'd.ts',
  'dist',
  'dist-book',
  '.active-book-temp',
  'node_modules',
];

const globIgnores = globalIgnores(ignores);

export default defineConfig([
  globIgnores,
  {
    extends: compat.extends(
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
    ),

    plugins: {
      import: fixupPluginRules(_import),
      '@typescript-eslint': typescriptEslint,
      'jsx-a11y': jsxA11y,
      react,
      'react-hooks': fixupPluginRules(reactHooks),
    },

    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2021,
      sourceType: 'module',

      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },

    settings: {
      react: {
        version: 'detect',
      },
      'import/internal-regex':
        '^(@root|@build|@project|@hooks|@components|@utils|assets|styles)(/.*)?,
    },

    rules: {
      'import/order': [
        'error',
        {
          'newlines-between': 'always-and-inside-groups',
          groups: [
            'builtin',
            'external',
            'internal',
            ['parent', 'sibling', 'index'],
          ],

          pathGroups: [
            { pattern: 'react', group: 'external', position: 'before' },
            { pattern: 'react-dom{,/**}', group: 'external', position: 'before' },

            { pattern: '@root{,/**}', group: 'internal', position: 'before' },
            { pattern: '@build{,/**}', group: 'internal', position: 'after' },
            { pattern: '@project{,/**}', group: 'internal', position: 'after' },
            { pattern: '@hooks{,/**}', group: 'internal', position: 'after' },
            { pattern: '@components{,/**}', group: 'internal', position: 'after' },
            { pattern: '@utils{,/**}', group: 'internal', position: 'after' },
            { pattern: 'assets{,/**}', group: 'internal', position: 'after' },
            { pattern: 'styles{,/**}', group: 'internal', position: 'after' },
          ],

          pathGroupsExcludedImportTypes: ['builtin'],
        },
      ],

      'eol-last': ['error', 'always'],
      'comma-dangle': ['error', 'always-multiline'],
      semi: ['error', 'always'],
      indent: ['error', 2],
      quotes: ['error', 'single'],
      'object-curly-spacing': ['error', 'always'],

      'max-len': [
        'error',
        {
          code: 120,
        },
      ],

      'max-lines': [
        'warn',
        {
          max: 150,
          skipBlankLines: true,
          skipComments: true,
        },
      ],

      'import/no-default-export': 'warn',
      'no-negated-in-lhs': 'off',
      'no-native-reassign': 'off',
      'jsx-a11y/anchor-is-valid': 'off',

      'react/jsx-max-props-per-line': [
        'error',
        {
          maximum: {
            single: 3,
            multi: 1,
          },
        },
      ],

      'react/jsx-closing-bracket-location': [
        'error',
        {
          nonEmpty: 'tag-aligned',
          selfClosing: 'line-aligned',
        },
      ],

      'react/jsx-closing-tag-location': 'warn',
      'react/jsx-first-prop-new-line': ['error', 'multiline'],
      'react/jsx-curly-brace-presence': ['error', 'never'],
      'react/self-closing-comp': 'error',

      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-var-requires': 'off',

      '@typescript-eslint/no-explicit-any': [
        'warn',
        {
          ignoreRestArgs: false,
        },
      ],
    },
  },
]);
,
    },

    rules: {
      'import/order': [
        'error',
        {
          'newlines-between': 'always-and-inside-groups',
          groups: [
            'builtin',
            'external',
            'internal',
            ['parent', 'sibling', 'index'],
          ],

          pathGroups: [
            { pattern: 'react', group: 'external', position: 'before' },
            { pattern: 'react-dom{,/**}', group: 'external', position: 'before' },

            { pattern: '@root{,/**}', group: 'internal', position: 'before' },
            { pattern: '@build{,/**}', group: 'internal', position: 'after' },
            { pattern: '@project{,/**}', group: 'internal', position: 'after' },
            { pattern: '@components{,/**}', group: 'internal', position: 'after' },
            { pattern: '@utils{,/**}', group: 'internal', position: 'after' },
            { pattern: 'assets{,/**}', group: 'internal', position: 'after' },
            { pattern: 'styles{,/**}', group: 'internal', position: 'after' },
          ],

          pathGroupsExcludedImportTypes: ['builtin'],
        },
      ],

      'eol-last': ['error', 'always'],
      'comma-dangle': ['error', 'always-multiline'],
      semi: ['error', 'always'],
      indent: ['error', 2],
      quotes: ['error', 'single'],
      'object-curly-spacing': ['error', 'always'],

      'max-len': [
        'error',
        {
          code: 120,
        },
      ],

      'max-lines': [
        'warn',
        {
          max: 150,
          skipBlankLines: true,
          skipComments: true,
        },
      ],

      'import/no-default-export': 'warn',
      'no-negated-in-lhs': 'off',
      'no-native-reassign': 'off',
      'jsx-a11y/anchor-is-valid': 'off',

      'react/jsx-max-props-per-line': [
        'error',
        {
          maximum: {
            single: 3,
            multi: 1,
          },
        },
      ],

      'react/jsx-closing-bracket-location': [
        'error',
        {
          nonEmpty: 'tag-aligned',
          selfClosing: 'line-aligned',
        },
      ],

      'react/jsx-closing-tag-location': 'warn',
      'react/jsx-first-prop-new-line': ['error', 'multiline'],
      'react/jsx-curly-brace-presence': ['error', 'never'],
      'react/self-closing-comp': 'error',

      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-var-requires': 'off',

      '@typescript-eslint/no-explicit-any': [
        'warn',
        {
          ignoreRestArgs: false,
        },
      ],
    },
  },
]);
