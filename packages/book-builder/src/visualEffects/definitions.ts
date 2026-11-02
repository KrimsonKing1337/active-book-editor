import type { VisualEffectDefinition, VisualEffectRegistration } from '@active-book/types';

import type { VisualCategory } from './@types';

export const backgroundDefinitionId = 'builtin.background';
export const frameDefinitionId = 'builtin.frame';

export const customVisualDefinitionId = (category: VisualCategory, componentId: string): string => {
  return `custom.${category}/${componentId}`;
};

export const visualCategory = (definitionId: string): VisualCategory => {
  if (definitionId === backgroundDefinitionId || definitionId.startsWith('custom.background/')) {
    return 'background';
  }
  if (definitionId === frameDefinitionId || definitionId.startsWith('custom.frame/')) {
    return 'frame';
  }
  throw new Error(`Unknown visual definition: ${definitionId}`);
};

export const visualComponentId = (definitionId: string): string | null => {
  const prefix = `custom.${visualCategory(definitionId)}/`;
  return definitionId.startsWith(prefix) ? definitionId.slice(prefix.length) : null;
};

export const missingVisualDefinitions = (
  registrations: readonly VisualEffectRegistration[],
  definitions: readonly VisualEffectDefinition[],
): string[] => {
  const known = new Set([backgroundDefinitionId, frameDefinitionId, ...definitions.map((cur) => cur.id)]);

  const missing = registrations.filter((cur) => !known.has(cur.effect.definitionId));

  return [...new Set(missing.map((cur) => cur.effect.definitionId))];
};
