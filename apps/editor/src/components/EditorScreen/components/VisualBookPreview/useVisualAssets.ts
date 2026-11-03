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

  const entries = Object.entries(value);

  return entries.flatMap(([key, entry]) => {
    const keyAndValueAreValid = key === 'src' && typeof entry === 'string' && entry.trim();
    const pathIsValid = /^(https?:|blob:|data:)/i.test(String(entry));

    if (keyAndValueAreValid && !pathIsValid) {
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

  const entries = Object.entries(value);

  const resolvedEntries = entries.map(([key, entry]) => {
    const isSource = key === 'src' && typeof entry === 'string';
    const hasReplacement = isSource && urls.has(entry);

    if (hasReplacement) {
      const replacement = urls.get(entry)!;

      return [key, replacement];
    }

    const resolvedEntry = resolveSources(entry, urls);

    return [key, resolvedEntry];
  });

  return Object.fromEntries(resolvedEntries);
};

/** URLs belong to the open book and survive page navigation and ordinary parameter edits. */
type VisualAssetsOptions = {
  registrations: VisualEffectRegistration[];
  project: BookProject | null;
  session: number;
};

export const useVisualAssets = ({
  registrations,
  project,
  session,
}: VisualAssetsOptions) => {
  const [, refresh] = useState(0);

  const cache = useMemo<AssetCache>(() => ({
    urls: new Map(),
    pending: new Set(),
    closed: false,
  }), [project, session]);

  const registrationsFlat = registrations.flatMap((registrationCur) => {
    return assetPaths(registrationCur.effect.params);
  });

  const pathsKeySet = new Set(registrationsFlat);
  const pathsKey = JSON.stringify([pathsKeySet]);

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
      const inCache = cache.urls.has(pathCur) || cache.pending.has(pathCur);

      if (inCache || !project) {
        continue;
      }

      cache.pending.add(pathCur);

      void project.storage.getAssetFile(pathCur)
        .then((file) => {
          if (cache.closed || cancelled) {
            return;
          }

          cache.urls.set(pathCur, URL.createObjectURL(file));

          refresh((revision) => revision + 1);
        })
        .catch((error: unknown) => {
          if (!cache.closed && !cancelled) {
            console.error('[visual-effects] Cannot load asset', pathCur, error);
          }
        })
        .finally(() => {
          return cache.pending.delete(pathCur);
        });
    }

    return () => {
      cancelled = true;

      cache.pending.clear();
    };
  }, [cache, pathsKey, project]);

  const availableRegistrations = registrations.filter((registrationCur) => {
    const paths = assetPaths(registrationCur.effect.params);

    return paths.every((pathCur) => {
      return cache.urls.has(pathCur);
    });
  });

  return availableRegistrations.map((registrationCur) => {
    const { effect } = registrationCur;

    const params = resolveSources(effect.params, cache.urls) as typeof effect.params;

    const resolvedEffect = {
      ...effect,
      params,
    };

    return {
      ...registrationCur,
      effect: resolvedEffect,
    };
  });
};
