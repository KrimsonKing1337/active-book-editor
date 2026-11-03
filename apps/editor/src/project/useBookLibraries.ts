import { useEffect, useMemo, useState } from 'react';

import type { BrowserLibrary } from '@active-book/book-builder/components/custom/browser';

import { createCustomVisualDefinitions } from '@active-book/book-builder/components/custom/visual';
import { createBookRuntime } from '@active-book/book-builder/components/custom/runtime';

import type { BookProject } from './@types';

import { loadProjectLibraries } from './customComponents';
import { emptyCustomComponents } from './customComponentRegistry';

const bookRuntime = createBookRuntime('editor');
const noLibraries: BrowserLibrary[] = [];

type LoadedLibraries = {
  project: BookProject | null;
  session: number;
  revision: number;
  libraries: BrowserLibrary[];
};

type BookLibrariesOptions = {
  project: BookProject | null;
  session: number;
  revision: number;
  onError: (message: string) => void;
};

export const useBookLibraries = ({
  project,
  session,
  revision,
  onError,
}: BookLibrariesOptions) => {
  const [loaded, setLoaded] = useState<LoadedLibraries | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let resources: BrowserLibrary[] = [];

    const load = async () => {
      try {
        resources = [];

        if (project) {
          resources = await loadProjectLibraries(project.storage, { signal: controller.signal });
        }

        if (controller.signal.aborted) {
          resources.forEach((cur) => cur.dispose());

          return;
        }

        setLoaded({
          project,
          session,
          revision,
          libraries: resources,
        });
      } catch (error) {
        if (!controller.signal.aborted) {
          onError(error instanceof Error ? error.message : 'Ошибка загрузки библиотек');
        }
      }
    };

    void load();

    return () => {
      controller.abort();

      resources.forEach((cur) => cur.dispose());
    };
  }, [project, session, revision, onError]);

  const isCurrent = loaded?.project === project
    && loaded?.session === session
    && loaded?.revision === revision;

  const libraries = isCurrent ? loaded.libraries : noLibraries;

  return useMemo(() => {
    const components = Object.assign({}, ...libraries.map((cur) => cur.components));
    const definitions = libraries.flatMap((cur) => cur.definitions);
    const visualDefinitions = libraries.flatMap((cur) => cur.visualDefinitions);

    const registry = {
      ...emptyCustomComponents,
      components,
      definitions,
      visualDefinitions,
    };

    const runtimeDefinitions = createCustomVisualDefinitions(libraries, bookRuntime);

    return {
      registry,
      definitions: runtimeDefinitions,
      isLoading: !isCurrent,
    };
  }, [libraries, isCurrent]);
};
