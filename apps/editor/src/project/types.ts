import type { JSONContent } from '@tiptap/core';

export interface ProjectStorage {
  readonly name: string;

  hasBook(): Promise<boolean>;
  initialize(document: JSONContent): Promise<void>;
  readBook(): Promise<JSONContent>;
  writeBook(document: JSONContent): Promise<void>;
}

export type BookProject = {
  name: string;
  storage: ProjectStorage;
  document: JSONContent;
};

export type PendingLocalProject = {
  name: string;
  directoryHandle: FileSystemDirectoryHandle;
};

export type RestoreLastProjectResult =
  | { status: 'none' }
  | { status: 'opened'; project: BookProject }
  | { status: 'permission-required'; project: PendingLocalProject }
  | { status: 'unavailable' };
