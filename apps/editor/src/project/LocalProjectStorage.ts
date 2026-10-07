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
          file,
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

  async initialize(document: JSONContent): Promise<void> {
    const hasBook = await this.getHasBook();

    if (hasBook) {
      throw new ExistingProjectError();
    }

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

  async *getBuildFiles(): AsyncGenerator<ProjectBuildFile> {
    const bookFileHandle = await this.directoryHandle.getFileHandle(BOOK_FILE_NAME);
    const bookFile = await bookFileHandle.getFile();

    yield {
      path: BOOK_FILE_NAME,
      file: bookFile,
    };

    const assetsDirectory = await this.directoryHandle.getDirectoryHandle(ASSETS_DIRECTORY_NAME);

    yield* this.getDirectoryBuildFiles(
      assetsDirectory,
      ASSETS_DIRECTORY_NAME,
    );
  }
}
