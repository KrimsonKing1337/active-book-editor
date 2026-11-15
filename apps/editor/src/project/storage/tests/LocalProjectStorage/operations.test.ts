import {
  afterEach,
  expect,
  test,
  vi,
} from 'vitest';

import type { LocalProjectStorage } from '../../LocalProjectStorage';


import { getHasPendingProjectChanges } from '../../../pendingOperations';

import {
  book,
  createFile,
  createStorage,
} from './utils';

const packageContent = '{"name":"Project metadata"}\n';
const dependency = new File(['archive'], 'library.tgz');
const asset = new File(['image'], 'image.png');
const initialPackage = {
  name: 'active-book-project',
  private: true,
  version: '0.0.0',
  dependencies: {},
};
const operations = [
  {
    name: 'initialize',
    run: (storage: LocalProjectStorage) => storage.initialize(book),
    filename: 'package.json',
    content: `${JSON.stringify(initialPackage, null, 2)}\n`,
    result: undefined,
  },
  {
    name: 'writeBook',
    run: (storage: LocalProjectStorage) => storage.writeBook(book),
    filename: 'book.json',
    content: `${JSON.stringify(book, null, 2)}\n`,
    result: undefined,
  },
  {
    name: 'writePackageJson',
    run: (storage: LocalProjectStorage) => storage.writePackageJson(packageContent),
    filename: 'package.json',
    content: packageContent,
    result: undefined,
  },
  {
    name: 'importDependencyFile',
    run: (storage: LocalProjectStorage) => storage.importDependencyFile(dependency),
    filename: 'library.tgz',
    content: dependency,
    result: 'dependencies/library.tgz',
  },
  {
    name: 'importAssetFile',
    run: (storage: LocalProjectStorage) => storage.importAssetFile(asset),
    filename: 'image.png',
    content: asset,
    result: 'assets/image.png',
  },
];

afterEach(() => {
  expect(getHasPendingProjectChanges()).toBe(false);
});

test.each(operations)('$name preserves contents, return value and stream order', async (operation) => {
  const { storage, streams } = createStorage();

  await expect(operation.run(storage)).resolves.toBe(operation.result);
  const [file] = streams;

  expect(file.handle.name).toBe(operation.filename);
  expect(file.write).toHaveBeenCalledExactlyOnceWith(operation.content);

  if (operation.name === 'initialize') {
    expect(streams).toHaveLength(2);
    expect(streams[1].handle.name).toBe('book.json');
    expect(streams[1].write).toHaveBeenCalledExactlyOnceWith(`${JSON.stringify(book, null, 2)}\n`);
  } else {
    expect(streams).toHaveLength(1);
  }

  for (const stream of streams) {
    expect(stream.createWritable).toHaveBeenCalledTimes(1);
    expect(stream.close).toHaveBeenCalledTimes(1);
    expect(stream.abort).not.toHaveBeenCalled();
    expect(stream.createWritable).toHaveBeenCalledBefore(stream.write);
    expect(stream.write).toHaveBeenCalledBefore(stream.close);
  }
});

test.each(operations)('$name preserves write failure over abort and permits another operation', async (operation) => {
  const failure = new Error('Original write failure');
  const create = vi.fn(createFile).mockImplementationOnce((name) => {
    const file = createFile(name);

    file.write.mockRejectedValueOnce(failure);
    file.abort.mockRejectedValueOnce(new Error('Secondary abort failure'));

    return file;
  });
  const { storage, streams } = createStorage(create);

  await expect(operation.run(storage)).rejects.toBe(failure);
  expect(getHasPendingProjectChanges()).toBe(false);
  expect(streams[0].close).not.toHaveBeenCalled();
  expect(streams[0].abort).toHaveBeenCalledTimes(1);

  if (operation.name === 'initialize') {
    expect(streams).toHaveLength(1);
  }

  await operation.run(storage);
  expect(getHasPendingProjectChanges()).toBe(false);

  if (operation.name === 'importAssetFile') {
    expect(streams[1].handle.name).toBe('image-1.png');
  } else if (operation.name === 'importDependencyFile') {
    expect(streams[1].handle.name).toBe('library-1.tgz');
  }
});
