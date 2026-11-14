import {
  useContext,
  useEffect,
  useState,
} from 'react';

import { ProjectAssetsContext } from './context';

type PathMap = Map<string, string>;

type Resolution = {
  owner: unknown;
  key: string;
  urls: PathMap;
  errors: PathMap;
};

const createPathMap = (): PathMap => new Map();

export const useProjectAssetUrls = (paths: readonly string[]) => {
  const cache = useContext(ProjectAssetsContext);

  const [resolved, setResolved] = useState<Resolution | null>(null);

  const key = JSON.stringify([...new Set(paths)].sort());

  useEffect(() => {
    let cancelled = false;
    const requested: string[] = JSON.parse(key);

    const load = async (path: string) => {
      if (!cache) {
        throw new Error('Откройте проект для просмотра медиа');
      }

      return cache.load(path);
    };

    const mappedRequests = requested.map(load);

    void Promise.allSettled(mappedRequests).then((results) => {
      if (cancelled) {
        return;
      }

      const urls = createPathMap();
      const errors = createPathMap();

      results.forEach((resultCur, index) => {
        const path = requested[index];

        if (resultCur.status === 'fulfilled') {
          urls.set(path, resultCur.value);
        } else {
          errors.set(path, `Файл ${path} недоступен. Проверьте папку assets/ проекта`);
        }
      });

      setResolved({
        owner: cache,
        key,
        urls,
        errors,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [cache, key]);

  if (resolved?.owner === cache && resolved.key === key) {
    return resolved;
  }

  const urls = createPathMap();

  for (const pathCur of paths) {
    const available = cache?.lookup(pathCur);

    if (available) {
      urls.set(pathCur, available);
    }
  }

  const errors = createPathMap();

  return { urls, errors };
};
