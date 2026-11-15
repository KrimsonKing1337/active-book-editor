import { vi } from 'vitest';

import type { BookDocument } from '@active-book/book-builder/book';

import type {
  ProjectDirectoryHandle,
  ProjectFileHandle,
  ProjectWritableFileStream,
} from '../../../@types/fileSystemAccess';

import { LocalProjectStorage } from '../../LocalProjectStorage';

export const book: BookDocument = {
  type: 'book',
  pages: [{ id: 'page', document: { type: 'doc', content: [] } }],
  visualEffects: [],
};

export const createFile = (name: string) => {
  const write = vi.fn<ProjectWritableFileStream['write']>().mockResolvedValue();
  const close = vi.fn<ProjectWritableFileStream['close']>().mockResolvedValue();
  const abort = vi.fn<() => Promise<void>>().mockResolvedValue();
  const writable: ProjectWritableFileStream = {
    write,
    close,
    abort,
  };
  const createWritable = vi.fn(async () => writable);
  const handle: ProjectFileHandle = {
    kind: 'file',
    name,
    getFile: async () => new File([], name),
    createWritable,
  };

  return {
    handle,
    writable,
    createWritable,
    write,
    close,
    abort,
  };
};

type DirectoryFixture = {
  handle: ProjectDirectoryHandle;
  files: Map<string, ProjectFileHandle>;
  directories: Map<string, DirectoryFixture>;
};

const createDirectory = (name: string, create: (name: string) => ProjectFileHandle): DirectoryFixture => {
  const files = new Map<string, ProjectFileHandle>();
  const directories = new Map<string, DirectoryFixture>();
  const handle: ProjectDirectoryHandle = {
    kind: 'directory',
    name,
    async getFileHandle(filename, options) {
      const existing = files.get(filename);

      if (existing) {
        return existing;
      }

      if (!options?.create) {
        throw new DOMException('File not found', 'NotFoundError');
      }

      const file = create(filename);

      files.set(filename, file);

      return file;
    },
    async getDirectoryHandle(dirname, options) {
      const existing = directories.get(dirname);

      if (existing) {
        return existing.handle;
      }

      if (!options?.create) {
        throw new DOMException('Directory not found', 'NotFoundError');
      }

      const directory = createDirectory(dirname, create);

      directories.set(dirname, directory);

      return directory.handle;
    },
    async *values() {
      yield* files.values();

      for (const directory of directories.values()) {
        yield directory.handle;
      }
    },
  };

  return {
    handle,
    files,
    directories,
  };
};

export const createStorage = (create = createFile) => {
  const streams: ReturnType<typeof createFile>[] = [];
  const root = createDirectory('Project', (name) => {
    const file = create(name);

    streams.push(file);

    return file.handle;
  });

  return {
    root,
    streams,
    storage: new LocalProjectStorage(root.handle),
  };
};

export const nextTurn = () => new Promise<void>((resolve) => setImmediate(resolve));
