import type { JSONContent } from '@tiptap/core';

import {
  FileSystemAccessUnsupportedError,
  isAbortError,
} from './errors';
import { LocalProjectStorage } from './LocalProjectStorage';
import {
  clearLastProjectHandle,
  getLastProjectHandle,
  saveLastProjectHandle,
} from './recentProjectStore';
import type {
  BookProject,
  OpenedBookProject,
  PendingLocalProject,
  RestoreLastProjectResult,
} from './types';

type DirectoryPickerOptions = {
  id?: string;
  mode?: 'read' | 'readwrite';
};

type DirectoryPickerWindow = Window & {
  showDirectoryPicker(
    options?: DirectoryPickerOptions,
  ): Promise<FileSystemDirectoryHandle>;
};

type PermissionDescriptor = {
  mode?: 'read' | 'readwrite';
};

type PermissionCapableDirectoryHandle = FileSystemDirectoryHandle & {
  queryPermission(
    descriptor?: PermissionDescriptor,
  ): Promise<PermissionState>;
  requestPermission(
    descriptor?: PermissionDescriptor,
  ): Promise<PermissionState>;
};

const pickProjectDirectory = async (): Promise<FileSystemDirectoryHandle> => {
  if (!('showDirectoryPicker' in window)) {
    throw new FileSystemAccessUnsupportedError();
  }

  return (window as DirectoryPickerWindow).showDirectoryPicker({
    id: 'active-book-project',
    mode: 'readwrite',
  });
};

const queryWritePermission = async (
  handle: FileSystemDirectoryHandle,
): Promise<PermissionState> => {
  const permissionHandle = handle as PermissionCapableDirectoryHandle;

  if (typeof permissionHandle.queryPermission !== 'function') {
    return 'prompt';
  }

  return permissionHandle.queryPermission({ mode: 'readwrite' });
};

const requestWritePermission = async (
  handle: FileSystemDirectoryHandle,
): Promise<PermissionState> => {
  const permissionHandle = handle as PermissionCapableDirectoryHandle;

  if (typeof permissionHandle.requestPermission !== 'function') {
    return 'denied';
  }

  return permissionHandle.requestPermission({ mode: 'readwrite' });
};

const rememberProject = async (
  handle: FileSystemDirectoryHandle,
): Promise<void> => {
  try {
    await saveLastProjectHandle(handle);
  } catch (error) {
    console.warn('[project] Could not remember the last project.', error);
  }
};

const forgetProject = async (): Promise<void> => {
  try {
    await clearLastProjectHandle();
  } catch (error) {
    console.warn('[project] Could not clear the last project.', error);
  }
};

const openProjectFromHandle = async (
  directoryHandle: FileSystemDirectoryHandle,
  remember = true,
): Promise<OpenedBookProject> => {
  const storage = new LocalProjectStorage(directoryHandle);
  const document = await storage.readBook();

  if (remember) {
    await rememberProject(directoryHandle);
  }

  return {
    project: {
      name: storage.name,
      storage,
    },
    document,
  };
};

export const createLocalProject = async (
  document: JSONContent,
): Promise<BookProject> => {
  const directoryHandle = await pickProjectDirectory();
  const storage = new LocalProjectStorage(directoryHandle);

  await storage.initialize(document);
  await rememberProject(directoryHandle);

  return {
    name: storage.name,
    storage,
  };
};

export const openLocalProject = async (): Promise<OpenedBookProject> => {
  const directoryHandle = await pickProjectDirectory();
  return openProjectFromHandle(directoryHandle);
};

export const saveProject = async (
  project: BookProject,
  document: JSONContent,
): Promise<void> => {
  await project.storage.writeBook(document);
};

export const clearCurrentProject = async (): Promise<void> => {
  await forgetProject();
};

export const restoreLastProject = async (): Promise<RestoreLastProjectResult> => {
  let directoryHandle: FileSystemDirectoryHandle | null;

  try {
    directoryHandle = await getLastProjectHandle();
  } catch (error) {
    console.warn('[project] Could not read the last project.', error);
    return { status: 'none' };
  }

  if (!directoryHandle) {
    return { status: 'none' };
  }

  const permission = await queryWritePermission(directoryHandle);

  if (permission === 'granted') {
    try {
      return {
        status: 'opened',
        openedProject: await openProjectFromHandle(directoryHandle, false),
      };
    } catch (error) {
      console.warn('[project] Could not restore the last project.', error);
      return { status: 'unavailable' };
    }
  }

  if (permission === 'prompt') {
    const project: PendingLocalProject = {
      name: directoryHandle.name,
      directoryHandle,
    };

    return {
      status: 'permission-required',
      project,
    };
  }

  return { status: 'unavailable' };
};

export const continueLastProject = async (
  pendingProject: PendingLocalProject,
): Promise<OpenedBookProject | null> => {
  const permission = await requestWritePermission(
    pendingProject.directoryHandle,
  );

  if (permission !== 'granted') {
    return null;
  }

  return openProjectFromHandle(pendingProject.directoryHandle);
};

export { isAbortError };
