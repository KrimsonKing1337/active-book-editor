import type { ProjectStorage } from '../@types';

import { InvalidProjectError } from '../errors';

type PackageDescription = {
  dependencies?: Record<string, string>;
  [key: string]: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

function assertPackageDescription(value: unknown): asserts value is PackageDescription {
  if (!isRecord(value)) {
    throw new InvalidProjectError('Некорректный package.json: корневое значение должно быть объектом');
  }

  if (!Object.hasOwn(value, 'dependencies')) {
    return;
  }

  const dependencies = value.dependencies;

  if (!isRecord(dependencies)) {
    throw new InvalidProjectError('Некорректный package.json: dependencies должно быть объектом');
  }

  for (const [name, specifier] of Object.entries(dependencies)) {
    if (typeof specifier !== 'string' || !specifier.trim()) {
      throw new InvalidProjectError(
        `Некорректный package.json: зависимость "${name}" должна содержать непустую строку`,
      );
    }
  }
}

export const readProjectPackage = async (
  storage: Pick<ProjectStorage, 'readPackageJson'>,
): Promise<PackageDescription> => {
  const packageJson = await storage.readPackageJson();

  let description: unknown;

  try {
    description = JSON.parse(packageJson);
  } catch (error) {
    throw new InvalidProjectError('Некорректный package.json: ошибка синтаксиса JSON', { cause: error });
  }

  assertPackageDescription(description);

  return description;
};
