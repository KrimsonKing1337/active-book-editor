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
