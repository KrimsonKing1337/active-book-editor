import {
  afterEach,
  expect,
  test,
  vi,
} from 'vitest';

import { getHasPendingProjectChanges } from '../../../pendingOperations';
import { createLocalProject } from '../../../projectService';

import {
  book,
  createFile,
  createStorage,
  nextTurn,
} from './utils';

afterEach(() => {
  vi.unstubAllGlobals();
  expect(getHasPendingProjectChanges()).toBe(false);
});

test('waits for abort before releasing the asset queue and pending writes', async () => {
  const failure = new Error('Original asset write failure');
  const releaseAbort: ((reason: unknown) => void)[] = [];
  const create = vi.fn(createFile).mockImplementationOnce((name) => {
    const file = createFile(name);

    file.write.mockRejectedValueOnce(failure);
    file.abort.mockImplementationOnce(() => new Promise<void>((_resolve, reject) => {
      releaseAbort.push(reject);
    }));

    return file;
  });
  const { storage, streams } = createStorage(create);
  const asset = new File(['image'], 'image.png');
  const firstOutcome = Promise.allSettled([storage.importAssetFile(asset)]);
  const nextImport = storage.importAssetFile(asset);

  try {
    await nextTurn();
    expect(getHasPendingProjectChanges()).toBe(true);
    expect(streams).toHaveLength(1);
    expect(streams[0].abort).toHaveBeenCalledTimes(1);
  } finally {
    for (const reject of releaseAbort) {
      reject(new Error('Secondary abort failure'));
    }
  }

  const [outcome] = await firstOutcome;

  expect(outcome.status).toBe('rejected');

  if (outcome.status === 'rejected') {
    expect(outcome.reason).toBe(failure);
  }

  await expect(nextImport).resolves.toBe('assets/image-1.png');
  expect(streams[1].close).toHaveBeenCalledTimes(1);
  expect(getHasPendingProjectChanges()).toBe(false);
});

test('project creation propagates package initialization failure before book write or handle persistence', async () => {
  const failure = new Error('Cannot initialize package.json');
  const create = (name: string) => {
    const file = createFile(name);

    file.write.mockRejectedValueOnce(failure);
    file.abort.mockRejectedValueOnce(new Error('Secondary abort failure'));

    return file;
  };
  const { root, streams } = createStorage(create);
  const open = vi.fn();

  vi.stubGlobal('window', { showDirectoryPicker: async () => root.handle });
  vi.stubGlobal('indexedDB', { open });
  await expect(createLocalProject(book)).rejects.toBe(failure);
  expect(streams).toHaveLength(1);
  expect(streams[0].handle.name).toBe('package.json');
  expect(root.files.has('book.json')).toBe(false);
  expect(open).not.toHaveBeenCalled();
});

test('initialization preserves an existing package.json', async () => {
  const {
    root,
    storage,
    streams,
  } = createStorage();
  const existing = createFile('package.json');

  root.files.set('package.json', existing.handle);
  await storage.initialize(book);
  expect(existing.createWritable).not.toHaveBeenCalled();
  expect(streams).toHaveLength(1);
  expect(streams[0].handle.name).toBe('book.json');
});

test('reuses imported dependency and nested asset handles without creating a writable', async () => {
  const {
    root,
    storage,
    streams,
  } = createStorage();
  const source = createFile('existing.tgz');
  const file = await source.handle.getFile();
  const dependencies = await root.handle.getDirectoryHandle('dependencies', { create: true });
  const assets = await root.handle.getDirectoryHandle('assets', { create: true });

  dependencies.resolve = async () => ['existing.tgz'];
  assets.resolve = async () => ['nested', 'existing.tgz'];
  await expect(storage.importDependencyFile(file, source.handle)).resolves.toBe('dependencies/existing.tgz');
  await expect(storage.importAssetFile(file, source.handle)).resolves.toBe('assets/nested/existing.tgz');
  expect(streams).toHaveLength(0);
  expect(source.createWritable).not.toHaveBeenCalled();
});
