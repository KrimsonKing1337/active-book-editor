import { useState } from 'react';

import {
  act,
  cleanup,
  renderHook,
} from '@testing-library/react';
import {
  expect,
  test,
  vi,
} from 'vitest';

import archiveUrl from '@root/tests/fixtures/multipage-book/dependencies/fixture-parts.tgz?url';
import { createProject } from '@root/tests/editor-effects/project';

import { openLocalProject, saveProject } from '@project/projectService';
import { LocalProjectStorage } from '@project/storage';

import { useLibraryImport } from '@components/EditorScreen/components/EditorWorkspace/hooks/useLibraryImport';

import { InvalidProjectError } from '../../errors';

import { loadProjectLibraries } from '../loadProjectLibraries';

test('rejects an invalid manifest before TGZ writes, keeps the revision and releases busy', async () => {
  const project = await createProject();

  try {
    const opened = await openLocalProject();
    const storage = opened.project.storage;
    const content = JSON.stringify({
      private: true,
      dependencies: { kept: 'file:./dependencies/kept.tgz', broken: 42 },
      metadata: { keep: ['unchanged'] },
    });

    await storage.writePackageJson(content);
    const directory = await project.directory.getDirectoryHandle('imports', { create: true });
    const archive = await directory.getFileHandle('fixture-parts.tgz', { create: true });
    const writable = await archive.createWritable();

    await writable.write(await (await fetch(archiveUrl)).blob());
    await writable.close();
    vi.stubGlobal('showOpenFilePicker', vi.fn(async () => [archive]));
    const copy = vi.spyOn(LocalProjectStorage.prototype, 'importDependencyFile');
    const write = vi.spyOn(LocalProjectStorage.prototype, 'writePackageJson');
    const read = vi.spyOn(LocalProjectStorage.prototype, 'getDependencyFile');
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const saveCurrentProject = vi.fn(async () => {
      await saveProject(opened.project, opened.document);

      return opened.project;
    });
    const { result } = renderHook(() => {
      const [isProjectBusy, setIsProjectBusy] = useState(false);
      const [projectMessage, setProjectMessage] = useState('');
      const importer = useLibraryImport({
        isProjectBusy,
        saveCurrentProject,
        setIsProjectBusy,
        setProjectMessage,
      });

      return {
        ...importer,
        isProjectBusy,
        projectMessage,
      };
    });

    act(() => result.current.handleImportCustomComponents());
    expect(result.current.isImportWarningOpen).toBe(true);
    act(() => result.current.handleConfirmCustomComponentsImport(false));
    await expect.poll(() => result.current.projectMessage).toBe(
      'Некорректный package.json: зависимость "broken" должна содержать непустую строку',
    );
    expect(result.current.isProjectBusy).toBe(false);
    expect(result.current.librariesRevision).toBe(0);
    expect(result.current.isImportWarningOpen).toBe(false);
    expect(saveCurrentProject).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledExactlyOnceWith(
      '[custom-components] Import failed.',
      expect.any(InvalidProjectError),
    );
    await expect(loadProjectLibraries(storage)).rejects.toThrow(InvalidProjectError);
    expect(copy).not.toHaveBeenCalled();
    expect(write).not.toHaveBeenCalled();
    expect(read).not.toHaveBeenCalled();
    expect(await storage.readPackageJson()).toBe(content);
  } finally {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    await project.dispose();
  }
});
