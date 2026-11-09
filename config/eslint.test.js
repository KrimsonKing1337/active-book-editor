import assert from 'node:assert/strict';
import test from 'node:test';

import { ESLint } from 'eslint';

const eslint = new ESLint({
  overrideConfig: {
    languageOptions: {
      parserOptions: { project: null },
    },
  },
});

const lintMessages = async (code) => {
  const [result] = await eslint.lintText(code, { filePath: 'apps/editor/src/components/EditorScreen/EditorScreen.tsx' });

  return result.messages;
};

const violations = [
  {
    name: 'import grouping',
    code: "import local from './local';\n\nimport React from 'react';\n",
    ruleId: 'import-x/order',
    severity: 2,
  },
  {
    name: 'default export warning',
    code: 'export default function Component() { return null; }\n',
    ruleId: 'import-x/no-default-export',
    severity: 1,
  },
  {
    name: 'three destructured properties on one line',
    code: 'const { first, second, third } = input;\n',
    ruleId: 'newline-destructuring/newline',
    severity: 2,
  },
  {
    name: 'two destructured properties split across lines',
    code: 'const {\n  first,\n  second,\n} = input;\n',
    ruleId: 'newline-destructuring/newline',
    severity: 2,
  },
  {
    name: 'destructuring with a rest property',
    code: 'const { first, second, ...rest } = input;\n',
    ruleId: 'newline-destructuring/newline',
    severity: 2,
  },
  {
    name: 'single quotes',
    code: 'const text = "value";\n',
    ruleId: '@stylistic/quotes',
    severity: 2,
  },
  {
    name: 'required semicolons',
    code: 'const value = 1\n',
    ruleId: '@stylistic/semi',
    severity: 2,
  },
  {
    name: 'required braces',
    code: 'if (ready) run();\n',
    ruleId: 'curly',
    severity: 2,
  },
  {
    name: 'caught error causes',
    code: "try { run(); } catch (error) { throw new Error('failed'); }\n",
    ruleId: 'preserve-caught-error',
    severity: 2,
  },
  {
    name: 'unused initial assignments',
    code: 'let value = 1;\nvalue = 2;\nuse(value);\n',
    ruleId: 'no-useless-assignment',
    severity: 2,
  },
  {
    name: 'unassigned variables',
    code: 'let value;\nuse(value);\n',
    ruleId: 'no-unassigned-vars',
    severity: 2,
  },
  {
    name: 'unneeded boolean ternary',
    code: 'const value = ready ? true : false;\n',
    ruleId: 'no-unneeded-ternary',
    severity: 2,
  },
  {
    name: 'explicit any warning',
    code: 'const value: any = input;\n',
    ruleId: '@typescript-eslint/no-explicit-any',
    severity: 1,
  },
];

for (const violationCur of violations) {
  test(`preserves ${violationCur.name}`, async () => {
    const messages = await lintMessages(violationCur.code);

    assert(messages.some((message) => {
      return message.ruleId === violationCur.ruleId && message.severity === violationCur.severity;
    }), JSON.stringify(messages));
  });
}

test('accepts compact pairs and expanded triples when destructuring', async () => {
  const snippets = [
    'const { first, second } = input;\n',
    'const {\n  first,\n  second,\n  third,\n} = input;\n',
  ];

  for (const snippetCur of snippets) {
    const messages = await lintMessages(snippetCur);

    assert(!messages.some((message) => message.ruleId === 'newline-destructuring/newline'));
  }
});

test('accepts short value choices, nullish fallbacks and intentional truthy defaults', async () => {
  const snippets = [
    "const value = ready ? 'yes' : 'no';\n",
    'const value = current ? current : fallback;\n',
    'const value = preview.hidden ?? item?.hidden ?? false;\n',
    'const value = item?.width ?? 0;\n',
  ];

  for (const snippetCur of snippets) {
    const messages = await lintMessages(snippetCur);

    assert(!messages.some((message) => message.ruleId === 'no-unneeded-ternary'), JSON.stringify(messages));
  }
});

const reactSourceFiles = [
  'apps/editor/src/components/EditorScreen/EditorScreen.tsx',
  'apps/book-runtime/src/components/BookPage/BookPage.tsx',
  'packages/book-builder/src/components/custom/runtime.ts',
];

for (const filePathCur of reactSourceFiles) {
  test(`checks React Hooks in ${filePathCur}`, async () => {
    const [invalid] = await eslint.lintText(`import { useEffect } from 'react';
function Component({ ready }) {
  if (ready) { useEffect(() => {}, []); }
  return null;
}
`, { filePath: filePathCur });
    const [missing] = await eslint.lintText(`import { useEffect } from 'react';
function Component({ value }) {
  useEffect(() => { consume(value); }, []);
  return null;
}
`, { filePath: filePathCur });
    const [valid] = await eslint.lintText(`import { useEffect } from 'react';
function Component({ value }) {
  useEffect(() => { consume(value); }, [value]);
  return null;
}
`, { filePath: filePathCur });

    assert(invalid.messages.some((message) => message.ruleId === 'react-hooks/rules-of-hooks'
      && message.severity === 2), JSON.stringify(invalid.messages));
    assert(missing.messages.some((message) => message.ruleId === 'react-hooks/exhaustive-deps'
      && message.severity === 1), JSON.stringify(missing.messages));
    assert(!valid.messages.some((message) => message.ruleId?.startsWith('react-hooks/')),
      JSON.stringify(valid.messages));

    const config = await eslint.calculateConfigForFile(filePathCur);
    assert.deepEqual(config.rules['no-unneeded-ternary'], [2, { defaultAssignment: true }]);
    assert.equal(config.rules['no-nested-ternary']?.[0] ?? 0, 0);
    assert.equal(config.rules['no-restricted-syntax']?.[0] ?? 0, 0);
  });
}
