import type { JSONContent } from '@tiptap/core';

import { ExistingProjectError, InvalidProjectError } from './errors';
import type { ProjectDirectoryHandle, ProjectFileHandle } from './fileSystemAccess';
import type { ProjectStorage } from './types';

const BOOK_FILE_NAME = 'book.json';
const ASSETS_DIRECTORY_NAME = 'assets';

const isBookDocument = (value: unknown): value is JSONContent =>
  typeof value === 'object' &&
  value !== null &&
  'type' in value &&
  (value as { type?: unknown }).type === 'doc';

export class LocalProjectStorage implements ProjectStorage {
  public readonly name: string;

  constructor(
    public readonly directoryHandle: ProjectDirectoryHandle,
  ) {
    this.name = directoryHandle.name;
  }

  async hasBook(): Promise<boolean> {
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
    if (await this.hasBook()) {
      throw new ExistingProjectError();
    }

    await this.directoryHandle.getDirectoryHandle(ASSETS_DIRECTORY_NAME, {
      create: true,
    });

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

    if (!isBookDocument(document)) {
      throw new InvalidProjectError('book.json не содержит документ Active Book.');
    }

    return document;
  }

  async writeBook(document: JSONContent): Promise<void> {
    const fileHandle = await this.directoryHandle.getFileHandle(BOOK_FILE_NAME, {
      create: true,
    });
    const writable = await fileHandle.createWritable();

    try {
      await writable.write(`${JSON.stringify(document, null, 2)}\n`);
    } finally {
      await writable.close();
    }
  }
}
