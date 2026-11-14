import {
  expect,
  test,
  vi,
} from 'vitest';

import { InvalidProjectError } from '../../errors';

import { readProjectPackage } from '../utils';

const storageFor = (content: string) => ({ readPackageJson: vi.fn(async () => content) });

test.each([
  {},
  { dependencies: {} },
  { dependencies: { example: 'file:./dependencies/example.tgz' } },
])('reads a valid package without changing its fields: %j', async (description) => {
  const storage = storageFor(JSON.stringify(description));

  expect(await readProjectPackage(storage)).toStrictEqual(description);
  expect(storage.readPackageJson).toHaveBeenCalledTimes(1);
});

test('preserves arbitrary metadata and nonempty dependency strings without normalizing them', async () => {
  const description = {
    name: 'Project metadata',
    private: true,
    scripts: { custom: 'keep this command' },
    metadata: { nested: [null, { enabled: true }] },
    dependencies: { example: '  custom-specifier  ' },
  };

  expect(await readProjectPackage(storageFor(JSON.stringify(description)))).toStrictEqual(description);
});

test('reports JSON syntax errors with their original cause', async () => {
  await expect(readProjectPackage(storageFor('{'))).rejects.toMatchObject({
    name: 'InvalidProjectError',
    message: 'Некорректный package.json: ошибка синтаксиса JSON',
    cause: expect.any(SyntaxError),
  });
});

test.each([
  'null',
  '[]',
  '42',
  '"text"',
  'false',
])('rejects a non-object root: %s', async (content) => {
  const operation = readProjectPackage(storageFor(content));

  await expect(operation).rejects.toBeInstanceOf(InvalidProjectError);
  await expect(operation).rejects.toThrow('Некорректный package.json: корневое значение должно быть объектом');
});

test.each(['null', '[]'])('rejects non-object dependencies: %s', async (dependencies) => {
  const content = `{"dependencies":${dependencies}}`;

  await expect(readProjectPackage(storageFor(content))).rejects.toThrow(
    'Некорректный package.json: dependencies должно быть объектом',
  );
});

test.each([
  42,
  false,
  null,
  {},
  [],
  '',
  ' \t\n ',
])('rejects a dependency that is not a nonempty string: %j', async (value) => {
  const content = JSON.stringify({ dependencies: { example: value } });

  await expect(readProjectPackage(storageFor(content))).rejects.toThrow(
    'Некорректный package.json: зависимость "example" должна содержать непустую строку',
  );
});

test('preserves a storage read failure instead of reporting invalid JSON', async () => {
  const failure = new DOMException('Permission denied', 'NotAllowedError');
  const storage = storageFor('{}');

  storage.readPackageJson.mockRejectedValueOnce(failure);
  await expect(readProjectPackage(storage)).rejects.toBe(failure);
});
