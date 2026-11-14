import {
  useContext,
  useEffect,
  useState,
} from 'react';

import { ProjectAssetsContext } from './context';


type Strings = Map<string, string>;

type Resolution = {
  owner: unknown;
  key: string;
  urls: Strings;
  errors: Strings;
};

const getNewStrings = () => new Map<string, string>;

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

      const urls = getNewStrings();
      const errors = getNewStrings();

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

  const urls = new Map<string, string>();

  for (const pathCur of paths) {
    const available = cache?.lookup(pathCur);

    if (available) {
      urls.set(pathCur, available);
    }
  }

  const errors = getNewStrings();

  return { urls, errors };
};
