import { useEffect, useMemo, useState } from 'react';

import type { JsonValue, VisualEffectRegistration } from '@active-book/types';

import type { BookProject } from '@project/@types';

type AssetCache = {
  urls: Map<string, string>;
  pending: Set<string>;
  closed: boolean;
};

const assetPaths = (value: JsonValue): string[] => {
  if (Array.isArray(value)) {
    return value.flatMap(assetPaths);
  }
  if (!value || typeof value !== 'object') {
    return [];
  }

  return Object.entries(value).flatMap(([key, entry]) => {
    if (key === 'src' && typeof entry === 'string' && entry.trim() && !/^(https?:|blob:|data:)/i.test(entry)) {
      return [entry];
    }
    return assetPaths(entry);
  });
};

const resolveSources = (value: JsonValue, urls: Map<string, string>): JsonValue => {
  if (Array.isArray(value)) {
    return value.map((cur) => resolveSources(cur, urls));
  }
  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.fromEntries(Object.entries(value).map(([key, entry]) => {
    return [key, key === 'src' && typeof entry === 'string' && urls.has(entry)
      ? urls.get(entry)! : resolveSources(entry, urls)];
  }));
};

/** URLs belong to the open book and survive page navigation and ordinary parameter edits. */
type VisualAssetsOptions = {
  registrations: VisualEffectRegistration[];
  project: BookProject | null;
  session: number;
};

export const useVisualAssets = ({ registrations, project, session }: VisualAssetsOptions) => {
  const [, refresh] = useState(0);
  const cache = useMemo<AssetCache>(() => ({
    urls: new Map(),
    pending: new Set(),
    closed: false,
  }), [project, session]);
  const pathsKey = JSON.stringify([...new Set(registrations.flatMap((cur) => assetPaths(cur.effect.params)))]);

  useEffect(() => {
    cache.closed = false;
    return () => {
      cache.closed = true;
      cache.urls.forEach((cur) => URL.revokeObjectURL(cur));
      cache.urls.clear();
      cache.pending.clear();
    };
  }, [cache]);

  useEffect(() => {
    let cancelled = false;
    const paths: string[] = JSON.parse(pathsKey);
    for (const pathCur of paths) {
      if (cache.urls.has(pathCur) || cache.pending.has(pathCur) || !project) {
        continue;
      }
      cache.pending.add(pathCur);
      void project.storage.getAssetFile(pathCur).then((file) => {
        if (cache.closed || cancelled) {
          return;
        }
        cache.urls.set(pathCur, URL.createObjectURL(file));
        refresh((revision) => revision + 1);
      }).catch((error: unknown) => {
        if (!cache.closed && !cancelled) {
          console.error('[visual-effects] Cannot load asset', pathCur, error);
        }
      }).finally(() => cache.pending.delete(pathCur));
    }
    return () => {
      cancelled = true;
      cache.pending.clear();
    };
  }, [cache, pathsKey, project]);

  return registrations.filter((cur) => assetPaths(cur.effect.params).every((path) => cache.urls.has(path)))
    .map((registrationCur) => {
      const params = resolveSources(registrationCur.effect.params, cache.urls) as typeof registrationCur.effect.params;
      const effect = {
        ...registrationCur.effect,
        params,
      };

      return {
        ...registrationCur,
        effect,
      };
    });
};
