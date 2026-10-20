import type { JSONContent } from '@tiptap/core';

import type {
  ProjectBuildFile,
  ProjectStorage,
} from './@types';

import type {
  ProjectDirectoryHandle,
  ProjectFileHandle,
} from './fileSystemAccess';
import {
  ExistingProjectError,
  InvalidProjectError,
} from './errors';

const BOOK_FILE_NAME = 'book.json';
const PACKAGE_FILE_NAME = 'package.json';
const ASSETS_DIRECTORY_NAME = 'assets';

const getIsBookDocument = (value: unknown): value is JSONContent => {
  type Value = { type?: unknown };

  return typeof value === 'object'
    && value !== null
    && 'type' in value
    && (value as Value).type === 'doc';
};

export class LocalProjectStorage implements ProjectStorage {
  public readonly name: string;

  constructor(public readonly directoryHandle: ProjectDirectoryHandle) {
    this.name = directoryHandle.name;
  }

  private async ensureAssetsDirectory(): Promise<void> {
    await this.directoryHandle.getDirectoryHandle(ASSETS_DIRECTORY_NAME, {
      create: true,
    });
  }

  private async *getDirectoryBuildFiles(
    directoryHandle: ProjectDirectoryHandle,
    relativePath: string,
  ): AsyncGenerator<ProjectBuildFile> {
    for await (const handle of directoryHandle.values()) {
      const handlePath = `${relativePath}/${handle.name}`;

      if (handle.kind === 'file') {
        const file = await handle.getFile();

        yield {
          path: handlePath,
          data: file,
        };

        continue;
      }

      yield* this.getDirectoryBuildFiles(handle, handlePath);
    }
  }

  async getHasBook(): Promise<boolean> {
    try {
      await this.directoryHandle.getFileHandle(BOOK_FILE_NAME);

      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'NotFoundError') {
        return false;
      }

      throw error;
    }
  }

  private async ensurePackageJson(): Promise<void> {
    try {
      await this.directoryHandle.getFileHandle(PACKAGE_FILE_NAME);

      return;
    } catch (error) {
      if (!(error instanceof DOMException) || error.name !== 'NotFoundError') {
        throw error;
      }
    }

    const fileHandle = await this.directoryHandle.getFileHandle(PACKAGE_FILE_NAME, { create: true });
    const writable = await fileHandle.createWritable();

    try {
      const packageJson = {
        name: 'active-book-project',
        private: true,
        version: '0.0.0',
        dependencies: {},
      };

      await writable.write(`${JSON.stringify(packageJson, null, 2)}\n`);
      await writable.close();
    } catch (error) {
      await writable.abort?.();
      throw error;
    }
  }

  async initialize(document: JSONContent): Promise<void> {
    const hasBook = await this.getHasBook();

    if (hasBook) {
      throw new ExistingProjectError();
    }

    await this.ensurePackageJson();
    await this.writeBook(document);
  }

  async readBook(): Promise<JSONContent> {
    let fileHandle: ProjectFileHandle;

    try {
      fileHandle = await this.directoryHandle.getFileHandle(BOOK_FILE_NAME);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'NotFoundError') {
        throw new InvalidProjectError('В выбранной папке нет book.json.');
      }

      throw error;
    }

    const file = await fileHandle.getFile();
    const raw = await file.text();

    let document: unknown;

    try {
      document = JSON.parse(raw);
    } catch {
      throw new InvalidProjectError('book.json содержит некорректный JSON.');
    }

    const isBookDocument = getIsBookDocument(document);

    if (!isBookDocument) {
      throw new InvalidProjectError('book.json не содержит документ Active Book.');
    }

    return document as JSONContent;
  }

  async writeBook(document: JSONContent): Promise<void> {
    await this.ensureAssetsDirectory();

    const fileHandle = await this.directoryHandle.getFileHandle(BOOK_FILE_NAME, {
      create: true,
    });
    const writable = await fileHandle.createWritable();

    try {
      const jsonString = `${JSON.stringify(document, null, 2)}\n`;

      await writable.write(jsonString);

      await writable.close();
    } catch (error) {
      await writable.abort?.();

      throw error;
    }
  }

  async getAssetFile(path: string): Promise<File> {
    const relativePath = path.replace(/^\.\//, '').replace(/^\//, '');
    const parts = relativePath.split('/');

    if (
      parts[0] !== ASSETS_DIRECTORY_NAME
      || parts.length < 2
      || parts.some((part) => !part || part === '.' || part === '..')
      || relativePath.includes('\\')
    ) {
      throw new Error('Путь должен указывать на файл внутри assets/');
    }

    let directory = await this.directoryHandle.getDirectoryHandle(ASSETS_DIRECTORY_NAME);

    for (const directoryName of parts.slice(1, -1)) {
      directory = await directory.getDirectoryHandle(directoryName);
    }

    const fileHandle = await directory.getFileHandle(parts[parts.length - 1]);

    return fileHandle.getFile();
  }

  async importAssetFile(file: File, sourceHandle?: ProjectFileHandle): Promise<string> {
    const assetsDirectory = await this.directoryHandle.getDirectoryHandle(ASSETS_DIRECTORY_NAME, {
      create: true,
    });

    if (sourceHandle && assetsDirectory.resolve) {
      const relativePath = await assetsDirectory.resolve(sourceHandle);

      if (relativePath?.length) {
        // A file already inside assets/ must not be copied, even when nested.
        return [ASSETS_DIRECTORY_NAME, ...relativePath].join('/');
      }
    }

    const name = file.name.split(/[/\\]/).pop() || 'asset';
    const dotIndex = name.lastIndexOf('.');
    const baseName = dotIndex > 0 ? name.slice(0, dotIndex) : name;
    const extension = dotIndex > 0 ? name.slice(dotIndex) : '';

    let candidate = name;
    let suffix = 1;

    // External files are copied into assets/ without overwriting existing names.
    while (true) {
      try {
        await assetsDirectory.getFileHandle(candidate);
        candidate = `${baseName}-${suffix}${extension}`;
        suffix += 1;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'NotFoundError') {
          break;
        }

        throw error;
      }
    }

    const fileHandle = await assetsDirectory.getFileHandle(candidate, { create: true });
    const writable = await fileHandle.createWritable();

    try {
      await writable.write(file);
      await writable.close();
    } catch (error) {
      await writable.abort?.();
      throw error;
    }

    return `${ASSETS_DIRECTORY_NAME}/${candidate}`;
  }
  async *getBuildFiles(): AsyncGenerator<ProjectBuildFile> {
    const bookFileHandle = await this.directoryHandle.getFileHandle(BOOK_FILE_NAME);
    const bookFile = await bookFileHandle.getFile();

    yield {
      path: BOOK_FILE_NAME,
      data: bookFile,
    };

    // A book's npm dependencies are part of the project description, not its media assets.
    try {
      const packageHandle = await this.directoryHandle.getFileHandle(PACKAGE_FILE_NAME);
      const packageFile = await packageHandle.getFile();

      yield {
        path: PACKAGE_FILE_NAME,
        data: packageFile,
      };
    } catch (error) {
      if (!(error instanceof DOMException) || error.name !== 'NotFoundError') {
        throw error;
      }
    }

    const assetsDirectory = await this.directoryHandle.getDirectoryHandle(ASSETS_DIRECTORY_NAME);

    yield* this.getDirectoryBuildFiles(
      assetsDirectory,
      ASSETS_DIRECTORY_NAME,
    );
  }
}
