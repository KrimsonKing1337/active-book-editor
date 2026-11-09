import { fixupPluginRules } from '@eslint/compat';
import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import { defineConfig, globalIgnores } from 'eslint/config';
import importX from 'eslint-plugin-import-x';
import newlineDestructuring from 'eslint-plugin-newline-destructuring';
import reactHooks from 'eslint-plugin-react-hooks';

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
    extends: [js.configs.recommended, typescriptEslint.configs['flat/recommended']],

    plugins: {
      'import-x': importX,
      '@stylistic': stylistic,
      'newline-destructuring': fixupPluginRules(newlineDestructuring),
      'react-hooks': reactHooks,
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
      'import-x/internal-regex':
        '^(@root|@build|@project|@hooks|@components|@utils|@active-book/core)(/.*)?$',
    },

    rules: {
      'import-x/order': [
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

          pathGroupsExcludedImportTypes: ['builtin'],
        },
      ],

      '@stylistic/eol-last': ['error', 'always'],
      '@stylistic/comma-dangle': ['error', 'always-multiline'],
      '@stylistic/semi': ['error', 'always'],
      '@stylistic/indent': ['error', 2],
      '@stylistic/quotes': ['error', 'single'],
      '@stylistic/object-curly-spacing': ['error', 'always'],

      '@stylistic/object-property-newline': ['error',  {
        allowAllPropertiesOnSameLine: true,
      }],

      '@stylistic/object-curly-newline': ['error', {
        ObjectExpression: {
          minProperties: 3,
          multiline: true,
          consistent: true,
        },
        ObjectPattern: {
          minProperties: 3,
          multiline: true,
          consistent: true,
        },
        TSTypeLiteral: {
          minProperties: 1,
          multiline: true,
          consistent: true,
        },
        TSInterfaceBody: {
          minProperties: 1,
          multiline: true,
          consistent: true,
        },
        TSEnumBody: {
          minProperties: 1,
          multiline: true,
          consistent: true,
        }
      }],

      '@stylistic/curly-newline': ['error', {
        'minElements': 1,
      }],

      '@stylistic/padding-line-between-statements': ['error', {
        blankLine: 'always',
        prev: '*',
        next: 'return',
      }],

      '@stylistic/max-len': [
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

      'import-x/no-default-export': 'warn',
      'curly': ['error', 'all'],

      'no-unneeded-ternary': ['error', {
        defaultAssignment: true,
      }],

      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      '@stylistic/jsx-max-props-per-line': [
        'error',
        {
          maximum: {
            single: 3,
            multi: 1,
          },
        },
      ],

      '@stylistic/jsx-closing-bracket-location': [
        'error',
        {
          nonEmpty: 'tag-aligned',
          selfClosing: 'line-aligned',
        },
      ],

      '@stylistic/jsx-closing-tag-location': 'warn',
      '@stylistic/jsx-first-prop-new-line': ['error', 'multiline'],
      '@stylistic/jsx-curly-brace-presence': ['error', 'never'],
      '@stylistic/jsx-self-closing-comp': 'error',

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

      'newline-destructuring/newline': ['error', {
        items: 2,
        consistent: false,
        allowAllPropertiesOnSameLine: false,
      }],
    },
  },
]);
