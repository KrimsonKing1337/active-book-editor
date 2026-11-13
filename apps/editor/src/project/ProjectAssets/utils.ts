import type { ProjectStorage } from '../@types';

/** Shared project-file URL ownership for content and visual-effect previews. */
export const createProjectAssetUrls = (storage: Pick<ProjectStorage, 'getAssetFile'> | undefined) => {
  const urls = new Map<string, string>();
  const pending = new Map<string, Promise<string>>();
  let generation = 0;
  let isActive = false;

  const dispose = () => {
    isActive = false;
    generation += 1;
    urls.forEach((url) => URL.revokeObjectURL(url));
    urls.clear();
    pending.clear();
  };

  const activate = () => {
    isActive = true;
    generation += 1;
  };

  const load = (path: string): Promise<string> => {
    if (!storage || !isActive) {
      return Promise.reject(new Error(`Ресурс недоступен: ${path}`));
    }

    const cached = urls.get(path);

    if (cached) {
      return Promise.resolve(cached);
    }

    const loading = pending.get(path);

    if (loading) {
      return loading;
    }

    const owner = generation;
    const request = storage.getAssetFile(path).then((file) => {
      if (!isActive || owner !== generation) {
        throw new DOMException('Project asset scope closed', 'AbortError');
      }

      const url = URL.createObjectURL(file);
      urls.set(path, url);

      return url;
    }).finally(() => {
      if (pending.get(path) === request) {
        pending.delete(path);
      }
    });
    pending.set(path, request);

    return request;
  };

  const lookup = (path: string) => urls.get(path);

  return {
    lookup,
    activate,
    dispose,
    load,
  };
};
