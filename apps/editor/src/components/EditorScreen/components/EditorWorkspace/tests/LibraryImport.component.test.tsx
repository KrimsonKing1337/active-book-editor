import {
  act,
  renderHook,
  waitFor,
} from '@testing-library/react';
import {
  afterEach,
  expect,
  test,
  vi,
} from 'vitest';

import { LocalProjectStorage } from '@project/LocalProjectStorage';
import { importBrowserLibrary } from '@project/customComponents';

import { HIDE_CUSTOM_COMPONENTS_WARNING_STORAGE_KEY } from '../../../constants';

import { useLibraryImport } from '../hooks/useLibraryImport';

vi.mock('@project/customComponents', () => ({ importBrowserLibrary: vi.fn() }));

const unexpectedStorage = async (): Promise<never> => {
  throw new Error('The import hook must delegate storage to importBrowserLibrary');
};

const project = {
  name: 'Import fixture',
  storage: new LocalProjectStorage({
    kind: 'directory',
    name: 'Import fixture',
    getFileHandle: unexpectedStorage,
    getDirectoryHandle: unexpectedStorage,
    async *values() {
      yield await unexpectedStorage();
    },
  }),
};

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
  vi.mocked(importBrowserLibrary).mockReset();
});

test.each(['save', 'import'])('reports %s failures, keeps the revision and releases busy', async (stage) => {
  localStorage.setItem(HIDE_CUSTOM_COMPONENTS_WARNING_STORAGE_KEY, 'true');
  const failure = new Error(`${stage} failed`);
  const saveCurrentProject = vi.fn(async () => project);
  const setIsProjectBusy = vi.fn();
  const setProjectMessage = vi.fn();
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});

  if (stage === 'save') {
    saveCurrentProject.mockRejectedValueOnce(failure);
  } else {
    vi.mocked(importBrowserLibrary).mockRejectedValueOnce(failure);
  }

  const { result } = renderHook(() => useLibraryImport({
    isProjectBusy: false,
    saveCurrentProject,
    setIsProjectBusy,
    setProjectMessage,
  }));

  act(() => result.current.handleImportCustomComponents());
  await waitFor(() => expect(setIsProjectBusy.mock.calls).toEqual([[true], [false]]));
  expect(setProjectMessage).toHaveBeenCalledExactlyOnceWith(`${stage} failed`);
  expect(result.current.librariesRevision).toBe(0);
  expect(error).toHaveBeenCalledExactlyOnceWith('[custom-components] Import failed.', failure);

  if (stage === 'save') {
    expect(importBrowserLibrary).not.toHaveBeenCalled();
  } else {
    expect(importBrowserLibrary).toHaveBeenCalledExactlyOnceWith(project.storage);
    expect(setIsProjectBusy.mock.invocationCallOrder[0]).toBeLessThan(saveCurrentProject.mock.invocationCallOrder[0]);
    expect(saveCurrentProject.mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(importBrowserLibrary).mock.invocationCallOrder[0],
    );
  }
});

test('blocks busy requests and stops cleanly when saving yields no current project', async () => {
  const saveCurrentProject = vi.fn(async () => null);
  const setIsProjectBusy = vi.fn();
  const setProjectMessage = vi.fn();
  const { result, rerender } = renderHook((isProjectBusy: boolean) => useLibraryImport({
    isProjectBusy,
    saveCurrentProject,
    setIsProjectBusy,
    setProjectMessage,
  }), { initialProps: true });

  act(() => result.current.handleImportCustomComponents());
  expect(result.current.isImportWarningOpen).toBe(false);
  expect(saveCurrentProject).not.toHaveBeenCalled();
  expect(setIsProjectBusy).not.toHaveBeenCalled();
  localStorage.setItem(HIDE_CUSTOM_COMPONENTS_WARNING_STORAGE_KEY, 'true');
  rerender(false);
  act(() => result.current.handleImportCustomComponents());
  await waitFor(() => expect(setIsProjectBusy.mock.calls).toEqual([[true], [false]]));
  expect(saveCurrentProject).toHaveBeenCalledTimes(1);
  expect(importBrowserLibrary).not.toHaveBeenCalled();
  expect(setProjectMessage).not.toHaveBeenCalled();
  expect(result.current.librariesRevision).toBe(0);
});
