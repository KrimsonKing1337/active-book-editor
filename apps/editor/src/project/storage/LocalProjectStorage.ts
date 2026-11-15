import type { BookDocument } from '@active-book/book-builder/book';
import { isBookDocument } from '@active-book/book-builder/book';
import { assertContentDocument } from '@active-book/book-builder/content';

import type {
  ProjectBuildFile,
  ProjectStorage,
} from '../@types';

import type {
  ProjectDirectoryHandle,
  ProjectFileHandle,
} from '../@types/fileSystemAccess';

import { trackProjectWrite } from '../pendingOperations';

import { writeProjectFile } from './utils';

import {
  BOOK_FILE_NAME,
  PACKAGE_FILE_NAME,
  ASSETS_DIRECTORY_NAME,
  DEPENDENCIES_DIRECTORY_NAME,
} from './constants';

import {
  ExistingProjectError,
  InvalidProjectError,
} from '../errors';

export class LocalProjectStorage implements ProjectStorage {
  public readonly name: string;
  private assetImport: Promise<unknown> = Promise.resolve();

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
    for await (const entryHandleCur of directoryHandle.values()) {
      const entryPath = `${relativePath}/${entryHandleCur.name}`;

      if (entryHandleCur.kind === 'file') {
        const file = await entryHandleCur.getFile();

        yield {
          path: entryPath,
          data: file,
        };

        continue;
      }

      yield* this.getDirectoryBuildFiles(entryHandleCur, entryPath);
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

    const fileHandle = await this.directoryHandle.getFileHandle(PACKAGE_FILE_NAME, {
      create: true,
    });

    const packageMeta = {
      name: 'active-book-project',
      private: true,
      version: '0.0.0',
      dependencies: {},
    };

    const packageMetaJson = JSON.stringify(packageMeta, null, 2);

    await writeProjectFile(fileHandle, `${packageMetaJson}\n`);
  }

  async initialize(document: BookDocument): Promise<void> {
    return trackProjectWrite(() => this.initializeInternal(document));
  }

  private async initializeInternal(document: BookDocument): Promise<void> {
    const hasBook = await this.getHasBook();

    if (hasBook) {
      throw new ExistingProjectError();
    }

    await this.ensurePackageJson();
    await this.writeBook(document);
  }

  async readBook(): Promise<BookDocument> {
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
      throw new InvalidProjectError('book.json должен содержать книгу с непустым списком страниц и уникальными id');
    }

    try {
      for (const [index, page] of document.pages.entries()) {
        assertContentDocument(page.document, `pages[${index}].document`);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new InvalidProjectError(error.message, { cause: error });
      }

      throw error;
    }

    return document;
  }

  async writeBook(document: BookDocument): Promise<void> {
    return trackProjectWrite(() => this.writeBookInternal(document));
  }

  private async writeBookInternal(document: BookDocument): Promise<void> {
    await this.ensureAssetsDirectory();

    const fileHandle = await this.directoryHandle.getFileHandle(BOOK_FILE_NAME, {
      create: true,
    });

    const documentJson = JSON.stringify(document, null, 2);

    await writeProjectFile(fileHandle, `${documentJson}\n`);
  }

  async readPackageJson(): Promise<string> {
    try {
      const handle = await this.directoryHandle.getFileHandle(PACKAGE_FILE_NAME);

      const file = await handle.getFile();

      return file.text();
    } catch (error) {
      if (!(error instanceof DOMException) || error.name !== 'NotFoundError') {
        throw error;
      }

      const defaultPackageDescription = {
        name: 'active-book-project',
        private: true,
        dependencies: {},
      };

      return JSON.stringify(defaultPackageDescription);
    }
  }

  async writePackageJson(content: string): Promise<void> {
    return trackProjectWrite(() => this.writePackageJsonInternal(content));
  }

  private async writePackageJsonInternal(content: string): Promise<void> {
    const handle = await this.directoryHandle.getFileHandle(PACKAGE_FILE_NAME, {
      create: true,
    });

    await writeProjectFile(handle, content);
  }

  async importDependencyFile(file: File, sourceHandle?: ProjectFileHandle): Promise<string> {
    return trackProjectWrite(() => this.importDependencyFileInternal(file, sourceHandle));
  }

  private async importDependencyFileInternal(file: File, sourceHandle?: ProjectFileHandle): Promise<string> {
    const directory = await this.directoryHandle.getDirectoryHandle(DEPENDENCIES_DIRECTORY_NAME, {
      create: true,
    });

    if (sourceHandle && directory.resolve) {
      const relativePath = await directory.resolve(sourceHandle);

      if (relativePath?.length === 1 && relativePath[0].endsWith('.tgz')) {
        return `${DEPENDENCIES_DIRECTORY_NAME}/${relativePath[0]}`;
      }
    }

    const filename = file.name.split(/[/\\]/).pop() ?? 'components.tgz';
    const base = filename.replace(/\.tgz$/i, '');

    let candidate = filename;
    let index = 1;

    while (true) {
      try {
        await directory.getFileHandle(candidate);

        candidate = `${base}-${index}.tgz`;
        index += 1;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'NotFoundError') {
          break;
        }

        throw error;
      }
    }

    const handle = await directory.getFileHandle(candidate, {
      create: true,
    });

    await writeProjectFile(handle, file);

    return `${DEPENDENCIES_DIRECTORY_NAME}/${candidate}`;
  }

  async getDependencyFile(relativePath: string): Promise<File> {
    const parts = relativePath.replaceAll('\\', '/').split('/');

    const isInvalidDirectory = parts[0] !== DEPENDENCIES_DIRECTORY_NAME;
    const isInvalidPathLength = parts.length !== 2;
    const isInvalidFileName = parts[1] === '..' || !parts[1]?.toLowerCase().endsWith('.tgz');

    if (isInvalidDirectory || isInvalidPathLength || isInvalidFileName) {
      throw new Error(`Недопустимый путь библиотеки: ${relativePath}`);
    }

    const directory = await this.directoryHandle.getDirectoryHandle(DEPENDENCIES_DIRECTORY_NAME);

    const fileHandle = await directory.getFileHandle(parts[1]);

    return fileHandle.getFile();
  }

  async getAssetFile(path: string): Promise<File> {
    const relativePath = path.replace(/^\.\//, '').replace(/^\//, '');
    const parts = relativePath.split('/');

    const hasInvalidPathSegment = parts.some((segment) => {
      return !segment || segment === '.' || segment === '..';
    });

    if (
      parts[0] !== ASSETS_DIRECTORY_NAME
      || parts.length < 2
      || hasInvalidPathSegment
      || relativePath.includes('\\')
    ) {
      throw new Error('Путь должен указывать на файл внутри assets/');
    }

    let directory = await this.directoryHandle.getDirectoryHandle(ASSETS_DIRECTORY_NAME);

    const directories = parts.slice(1, -1);

    for (const directoryName of directories) {
      directory = await directory.getDirectoryHandle(directoryName);
    }

    const fileHandle = await directory.getFileHandle(parts[parts.length - 1]);

    return fileHandle.getFile();
  }

  async importAssetFile(file: File, sourceHandle?: ProjectFileHandle): Promise<string> {
    const operation = this.assetImport.then(() => this.importAssetFileInternal(file, sourceHandle));
    // Keep the queue usable after a failure; callers still receive the original rejected operation.
    this.assetImport = operation.then(() => undefined, () => undefined);

    return trackProjectWrite(() => operation);
  }

  private async importAssetFileInternal(file: File, sourceHandle?: ProjectFileHandle): Promise<string> {
    const assetsDirectory = await this.directoryHandle.getDirectoryHandle(ASSETS_DIRECTORY_NAME, {
      create: true,
    });

    if (sourceHandle && assetsDirectory.resolve) {
      const relativePath = await assetsDirectory.resolve(sourceHandle);

      if (relativePath?.length) {
        const assetPathSegments = [ASSETS_DIRECTORY_NAME, ...relativePath];

        // A file already inside assets/ must not be copied, even when nested.
        return assetPathSegments.join('/');
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

    const fileHandle = await assetsDirectory.getFileHandle(candidate, {
      create: true,
    });

    await writeProjectFile(fileHandle, file);

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

    try {
      const assetsDirectory = await this.directoryHandle.getDirectoryHandle(ASSETS_DIRECTORY_NAME);

      yield* this.getDirectoryBuildFiles(assetsDirectory, ASSETS_DIRECTORY_NAME);
    } catch (error) {
      if (!(error instanceof DOMException) || error.name !== 'NotFoundError') {
        throw error;
      }
    }

    try {
      const dependencies = await this.directoryHandle.getDirectoryHandle(DEPENDENCIES_DIRECTORY_NAME);

      yield* this.getDirectoryBuildFiles(dependencies, DEPENDENCIES_DIRECTORY_NAME);
    } catch (error) {
      if (!(error instanceof DOMException) || error.name !== 'NotFoundError') {
        throw error;
      }
    }
  }
}
