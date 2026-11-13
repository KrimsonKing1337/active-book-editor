import {
  useContext,
  useEffect,
  useState,
} from 'react';

import { ProjectAssetsContext } from './context';

type Resolution = {
  owner: unknown;
  key: string;
  urls: Map<string, string>;
  errors: Map<string, string>;
};

export const useProjectAssetUrls = (paths: readonly string[]) => {
  const cache = useContext(ProjectAssetsContext);
  const key = JSON.stringify([...new Set(paths)].sort());
  const [resolved, setResolved] = useState<Resolution | null>(null);

  useEffect(() => {
    let cancelled = false;
    const requested: string[] = JSON.parse(key);

    const load = async (path: string) => {
      if (!cache) {
        throw new Error('Откройте проект для просмотра медиа');
      }

      return cache.load(path);
    };

    void Promise.allSettled(requested.map(load)).then((results) => {
      if (cancelled) {
        return;
      }

      const urls = new Map<string, string>();
      const errors = new Map<string, string>();

      results.forEach((result, index) => {
        const path = requested[index];

        if (result.status === 'fulfilled') {
          urls.set(path, result.value);
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

  const urls = new Map<string, string>();

  for (const path of paths) {
    const available = cache?.lookup(path);

    if (available) {
      urls.set(path, available);
    }
  }

  return { urls, errors: new Map<string, string>() };
};
