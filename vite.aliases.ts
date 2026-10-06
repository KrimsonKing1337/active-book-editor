import path from 'node:path';

export const createProjectAliases = (repoRoot: string) => ({
  '@@': repoRoot,
  '@editor': path.resolve(repoRoot, 'apps/editor/src'),
  '@book-runtime': path.resolve(repoRoot, 'apps/book-runtime/src'),
  '@book-builder': path.resolve(repoRoot, 'packages/book-builder/src'),
});
