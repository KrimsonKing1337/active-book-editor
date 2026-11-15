import {
  expect,
  test,
} from 'vitest';

import { createFile, createStorage } from './utils';

const filenames = [
  'Library.tgz',
  'Library.TGZ',
  'Library.TgZ',
];

test.each(filenames)('preserves %s and resolves collisions without overwriting previous imports', async (name) => {
  const { storage, streams } = createStorage();
  const file = new File(['first archive'], name);
  const replacement = new File(['replacement archive'], name);

  await expect(storage.importDependencyFile(file)).resolves.toBe(`dependencies/${name}`);
  await expect(storage.importDependencyFile(replacement)).resolves.toBe('dependencies/Library-1.tgz');
  await expect(storage.importDependencyFile(replacement)).resolves.toBe('dependencies/Library-2.tgz');
  expect(streams[0].handle.name).toBe(name);
  expect(streams[0].write).toHaveBeenCalledExactlyOnceWith(file);
  expect(streams[1].handle.name).toBe('Library-1.tgz');
  expect(streams[1].write).toHaveBeenCalledExactlyOnceWith(replacement);
  expect(streams[2].handle.name).toBe('Library-2.tgz');
  expect(streams[2].write).toHaveBeenCalledExactlyOnceWith(replacement);
});

test.each(filenames)('reuses an existing dependencies/%s without copying', async (name) => {
  const {
    root,
    storage,
    streams,
  } = createStorage();
  const source = createFile(name);
  const directory = await root.handle.getDirectoryHandle('dependencies', { create: true });
  const fixture = root.directories.get('dependencies');

  if (!fixture) {
    throw new Error('Missing dependencies fixture');
  }

  fixture.files.set(name, source.handle);
  directory.resolve = async () => [name];
  await expect(storage.importDependencyFile(await source.handle.getFile(), source.handle))
    .resolves.toBe(`dependencies/${name}`);
  expect(source.createWritable).not.toHaveBeenCalled();
  expect(streams).toHaveLength(0);
});
