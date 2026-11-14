import { useState } from 'react';

import type { BookProject } from '@project/@types';

import { importBrowserLibrary } from '@project/libraries';

import { HIDE_CUSTOM_COMPONENTS_WARNING_STORAGE_KEY } from '../../../constants';

type LibraryImportOptions = {
  isProjectBusy: boolean;
  saveCurrentProject: () => Promise<BookProject | null>;
  setIsProjectBusy: (isBusy: boolean) => void;
  setProjectMessage: (message: string) => void;
};

export const useLibraryImport = ({
  isProjectBusy,
  saveCurrentProject,
  setIsProjectBusy,
  setProjectMessage,
}: LibraryImportOptions) => {
  const [librariesRevision, setLibrariesRevision] = useState(0);
  const [isImportWarningOpen, setIsImportWarningOpen] = useState(false);

  const importCustomComponents = async () => {
    if (isProjectBusy) {
      return;
    }

    setIsProjectBusy(true);

    try {
      const savedProject = await saveCurrentProject();

      if (!savedProject) {
        return;
      }

      const message = await importBrowserLibrary(savedProject.storage);

      if (message) {
        setLibrariesRevision((revision) => revision + 1);
        setProjectMessage(`Подключена библиотека ${message}`);
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        console.error('[custom-components] Import failed.', error);

        let errorMessage = 'Ошибка импорта TGZ';

        if (error instanceof Error) {
          errorMessage = error.message;
        }

        setProjectMessage(errorMessage);
      }
    } finally {
      setIsProjectBusy(false);
    }
  };

  const handleImportCustomComponents = () => {
    if (isProjectBusy) {
      return;
    }

    if (localStorage.getItem(HIDE_CUSTOM_COMPONENTS_WARNING_STORAGE_KEY) === 'true') {
      void importCustomComponents();

      return;
    }

    setIsImportWarningOpen(true);
  };

  const handleConfirmCustomComponentsImport = (doNotShowAgain: boolean) => {
    if (doNotShowAgain) {
      localStorage.setItem(HIDE_CUSTOM_COMPONENTS_WARNING_STORAGE_KEY, 'true');
    }

    setIsImportWarningOpen(false);
    void importCustomComponents();
  };

  const closeImportWarning = () => {
    setIsImportWarningOpen(false);
  };

  return {
    librariesRevision,
    isImportWarningOpen,
    handleImportCustomComponents,
    handleConfirmCustomComponentsImport,
    closeImportWarning,
  };
};
