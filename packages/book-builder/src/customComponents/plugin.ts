import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

import type { Plugin } from 'vite';

type CustomComponentsPluginParams = {
  projectRoot: string;
  repoRoot: string;
};

type PackageDescription = {
  activeBook?: string;
};

type BookDependencies = {
  dependencies?: Record<string, string>;
};

type ManifestComponent = {
  title: string;
  description?: string;
  entry: string;
  export: string;
};

type ActiveBookManifest = {
  schemaVersion: number;
  components: Record<string, ManifestComponent>;
};

type RegistryComponent = ManifestComponent & {
  name: string;
  packageName: string;
  id: string;
  entryPath: string;
};

const REGISTRY_ID = 'virtual:active-book-custom-components';
const RESOLVED_REGISTRY_ID = '\0' + REGISTRY_ID;
const ENTRY_PREFIX = 'virtual:active-book-custom-entry:';

const readJson = <T>(filePath: string): T => {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
};

const loadRegistry = ({ projectRoot, repoRoot }: CustomComponentsPluginParams): RegistryComponent[] => {
  const packagePath = path.join(projectRoot, 'package.json');

  if (!fs.existsSync(packagePath)) {
    return [];
  }

  const projectPackage = readJson<BookDependencies>(packagePath);
  const components: RegistryComponent[] = [];

  for (const packageName of Object.keys(projectPackage.dependencies ?? {}).sort()) {
    const { directory, installRoot } = getPackageDirectory(packageName, projectRoot, repoRoot);

    const packageDescription = readJson<PackageDescription>(path.join(directory, 'package.json'));
    const manifestName = packageDescription.activeBook;

    if (!manifestName) {
      continue;
    }

    const manifestPath = path.resolve(directory, manifestName);
    const relativeManifestPath = path.relative(directory, manifestPath);

    if (relativeManifestPath.startsWith('..') || path.isAbsolute(relativeManifestPath)) {
      throw new Error(`Invalid Active Book manifest path in ${packageName}`);
    }

    const manifest = readJson<ActiveBookManifest>(manifestPath);

    if (manifest.schemaVersion !== 1 || !manifest.components || Array.isArray(manifest.components)) {
      throw new Error(`Unsupported Active Book manifest in ${packageName}`);
    }

    const resolveFromConsumer = createRequire(path.join(installRoot, 'package.json'));

    for (const [name, definition] of Object.entries(manifest.components)) {
      if (!definition || typeof definition.title !== 'string'
        || typeof definition.entry !== 'string' || typeof definition.export !== 'string') {
        throw new Error(`Invalid custom component ${packageName}/${name}`);
      }

      if (definition.entry !== '.' && !definition.entry.startsWith('./')) {
        throw new Error(`Invalid package entry for ${packageName}/${name}`);
      }

      const moduleName = definition.entry === '.'
        ? packageName
        : `${packageName}/${definition.entry.slice(2)}`;
      const entryPath = resolveFromConsumer.resolve(moduleName);

      components.push({
        ...definition,
        name,
        packageName,
        id: `${packageName}/${name}`,
        entryPath,
      });
    }
  }

  return components;
};

// An unrelated npm dependency does not need an Active Book manifest.
// The actual installation of archives is intentionally outside this proof of concept.
const getPackageDirectory = (
  packageName: string,
  projectRoot: string,
  repoRoot: string,
): { directory: string; installRoot: string } => {
  for (const installRoot of [projectRoot, repoRoot]) {
    const directory = path.join(installRoot, 'node_modules', packageName);

    if (fs.existsSync(path.join(directory, 'package.json'))) {
      return { directory, installRoot };
    }
  }

  throw new Error(`Dependency "${packageName}" is listed in the book but is not installed.`);
};

export const activeBookCustomComponentsPlugin = (params: CustomComponentsPluginParams): Plugin => {
  let entryPaths: string[] = [];

  return {
    name: 'active-book-custom-components',

    resolveId(source) {
      if (source === REGISTRY_ID) {
        return RESOLVED_REGISTRY_ID;
      }

      if (source.startsWith(ENTRY_PREFIX)) {
        const index = Number(source.slice(ENTRY_PREFIX.length));

        return Number.isInteger(index) ? entryPaths[index] ?? null : null;
      }

      return null;
    },

    load(id) {
      if (id !== RESOLVED_REGISTRY_ID) {
        return null;
      }

      const components = loadRegistry(params);

      entryPaths = components.map((item) => item.entryPath);

      const imports = components.map((component, index) => {
        return `import * as customModule${index} from ${JSON.stringify(`${ENTRY_PREFIX}${index}`)};`;
      });

      const registry = components.map((component, index) => {
        return `  ${JSON.stringify(component.id)}: customModule${index}[${JSON.stringify(component.export)}],`;
      });

      const definitions = components.map(({ id: componentId, name, packageName, title, description }) => {
        return { id: componentId, name, packageName, title, description };
      });

      return [
        ...imports,
        'export const customComponents = {',
        ...registry,
        '};',
        `export const customComponentDefinitions = ${JSON.stringify(definitions)};`,
      ].join('\n');
    },
  };
};
