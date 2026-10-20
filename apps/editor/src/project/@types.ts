import type { JSONContent } from '@tiptap/core';

import type { ProjectDirectoryHandle, ProjectFileHandle } from './fileSystemAccess';

export type ProjectBuildFile = {
  path: string;
  data: Blob;
};

export interface ProjectStorage {
  readonly name: string;

  getHasBook(): Promise<boolean>;
  initialize(document: JSONContent): Promise<void>;
  readBook(): Promise<JSONContent>;
  writeBook(document: JSONContent): Promise<void>;
  getBuildFiles(): AsyncIterable<ProjectBuildFile>;
  getAssetFile(path: string): Promise<File>;
  importAssetFile(file: File, sourceHandle?: ProjectFileHandle): Promise<string>;
  readPackageJson(): Promise<string>;
  writePackageJson(content: string): Promise<void>;
  importDependencyFile(file: File, sourceHandle?: ProjectFileHandle): Promise<string>;
  getDependencyFile(relativePath: string): Promise<File>;
}

export type BookProject = {
  name: string;
  storage: ProjectStorage;
};

export type OpenedBookProject = {
  project: BookProject;
  document: JSONContent;
};

export type PendingLocalProject = {
  name: string;
  directoryHandle: ProjectDirectoryHandle;
};

export type RestoreLastProjectResult =
  | { status: 'none' }
  | { status: 'opened'; openedProject: OpenedBookProject }
  | { status: 'permission-required'; project: PendingLocalProject }
  | { status: 'unavailable' };
