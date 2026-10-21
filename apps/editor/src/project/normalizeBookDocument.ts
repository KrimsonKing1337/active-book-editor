import type { JSONContent } from '@tiptap/core';

const LEGACY_NODE_NAMES: Record<string, string> = {
  activeBookP: 'P',
  activeBookH1: 'H1',
  activeBookH2: 'H2',
};

export const normalizeLegacyNodeNames = (node: JSONContent): JSONContent => {
  const normalizedNode = { ...node };

  if (node.type) {
    normalizedNode.type = LEGACY_NODE_NAMES[node.type] ?? node.type;
  }

  if (node.content) {
    normalizedNode.content = node.content.map(normalizeLegacyNodeNames);
  }

  return normalizedNode;
};
