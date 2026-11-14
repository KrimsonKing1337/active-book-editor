import type { ProjectStorage } from '../@types';

type PackageDescription = {
  dependencies?: Record<string, string>;
  [key: string]: unknown;
};

export const readProjectPackage = async (storage: ProjectStorage): Promise<PackageDescription> => {
  const packageJson = await storage.readPackageJson();

  return JSON.parse(packageJson) as PackageDescription;
};
