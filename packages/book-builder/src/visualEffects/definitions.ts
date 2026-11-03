import type { VisualEffectDefinition, VisualEffectRegistration } from '@active-book/types';

import type { VisualCategory } from './@types';

export const backgroundDefinitionId = 'builtin.background';
export const frameDefinitionId = 'builtin.frame';

export const customVisualDefinitionId = (category: VisualCategory, componentId: string): string => {
  return `custom.${category}/${componentId}`;
};

export const getVisualCategory = (definitionId: string): VisualCategory => {
  if (definitionId === backgroundDefinitionId || definitionId.startsWith('custom.background/')) {
    return 'background';
  }

  if (definitionId === frameDefinitionId || definitionId.startsWith('custom.frame/')) {
    return 'frame';
  }

  throw new Error(`Unknown visual definition: ${definitionId}`);
};

export const getVisualComponentId = (definitionId: string): string | null => {
  const prefix = `custom.${getVisualCategory(definitionId)}/`;

  return definitionId.startsWith(prefix) ? definitionId.slice(prefix.length) : null;
};

export const missingVisualDefinitions = (
  registrations: readonly VisualEffectRegistration[],
  definitions: readonly VisualEffectDefinition[],
): string[] => {
  const definitionsIds = [...definitions].map((cur) => cur.id);
  const allIds = [backgroundDefinitionId, frameDefinitionId, definitionsIds];

  const known = new Set(allIds);

  const missing = registrations.filter((registrationCur) => {
    return !known.has(registrationCur.effect.definitionId);
  });

  const missingIds = missing.map((cur) => cur.effect.definitionId);
  const uniqMissingIds = new Set(missingIds);

  return [...uniqMissingIds];
};
