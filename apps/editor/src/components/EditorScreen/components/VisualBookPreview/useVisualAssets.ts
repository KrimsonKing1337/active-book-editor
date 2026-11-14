import type { JsonValue, VisualEffectRegistration } from '@active-book/types';

import { useProjectAssetUrls } from '@project/ProjectAssets';

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

/** The project provider owns URLs; this adapter only projects visual-effect params. */
export const useVisualAssets = (registrations: VisualEffectRegistration[]) => {
  const paths = registrations.flatMap((cur) => assetPaths(cur.effect.params));
  const { urls } = useProjectAssetUrls(paths);

  const availableRegistrations = registrations.filter((registrationCur) => {
    const paths = assetPaths(registrationCur.effect.params);

    return paths.every((pathCur) => {
      return urls.has(pathCur);
    });
  });

  return availableRegistrations.map((registrationCur) => {
    const { effect } = registrationCur;

    const params = resolveSources(effect.params, urls) as typeof effect.params;

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
