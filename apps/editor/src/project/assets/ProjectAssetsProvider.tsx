import type { PropsWithChildren } from 'react';

import { useLayoutEffect, useMemo } from 'react';

import type { BookProject } from '../@types';

import { ProjectAssetsContext } from './context';
import { createProjectAssetUrls } from './utils';

type ProjectAssetsProviderProps = PropsWithChildren<{
  project: BookProject | null;
}>;

export const ProjectAssetsProvider = ({
  project,
  children,
}: ProjectAssetsProviderProps) => {
  const cache = useMemo(() => createProjectAssetUrls(project?.storage), [project]);

  useLayoutEffect(() => {
    cache.activate();

    return cache.dispose;
  }, [cache]);

  return (
    <ProjectAssetsContext value={cache}>
      {children}
    </ProjectAssetsContext>
  );
};
