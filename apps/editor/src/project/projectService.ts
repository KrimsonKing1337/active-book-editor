import type { JSONContent } from '@tiptap/core';

import {
  FileSystemAccessUnsupportedError,
  isAbortError,
} from './errors';
import type {
  DirectoryPickerWindow,
  ProjectDirectoryHandle,
  ProjectPermissionState,
} from './fileSystemAccess';
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
} from './@types';

const pickProjectDirectory = async (): Promise<ProjectDirectoryHandle> => {
  if (!('showDirectoryPicker' in window)) {
    throw new FileSystemAccessUnsupportedError();
  }

  return (window as DirectoryPickerWindow).showDirectoryPicker({
    id: 'active-book-project',
    mode: 'readwrite',
  });
};

const queryWritePermission = async (
  handle: ProjectDirectoryHandle,
): Promise<ProjectPermissionState> => {
  if (typeof handle.queryPermission !== 'function') {
    return 'prompt';
  }

  return handle.queryPermission({ mode: 'readwrite' });
};

const requestWritePermission = async (
  handle: ProjectDirectoryHandle,
): Promise<ProjectPermissionState> => {
  if (typeof handle.requestPermission !== 'function') {
    return 'denied';
  }

  return handle.requestPermission({ mode: 'readwrite' });
};

const rememberProject = async (
  handle: ProjectDirectoryHandle,
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
  directoryHandle: ProjectDirectoryHandle,
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
  let directoryHandle: ProjectDirectoryHandle | null;

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
      await forgetProject();
      return { status: 'unavailable' };
    }
  }

  if (permission === 'prompt' || permission === 'denied') {
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
