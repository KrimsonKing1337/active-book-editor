import type { BookProject } from '@project/@types';

export type ResolvedAudioSource = {
  path: string;
  project: BookProject | null;
  src: string;
  format?: string[];
};

export const resolveAudioSource = async (
  source: string,
  project: BookProject | null,
): Promise<ResolvedAudioSource> => {
  const path = source.trim();

  if (/^(https?:|blob:|data:)/.test(path)) {
    return {
      path: source,
      project,
      src: path,
    };
  }

  if (!project) {
    throw new Error('Сначала сохрани проект, чтобы загрузить файл из assets/');
  }

  const assetPath = path.replace(/^\.\//, '').replace(/^\//, '');
  const fileName = assetPath.split('/').pop() ?? '';
  const extension = fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() : undefined;

  if (!extension) {
    throw new Error('У аудиофайла должно быть расширение');
  }

  let file: File;

  try {
    file = await project.storage.getAssetFile(assetPath);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'NotFoundError') {
      throw new Error('Аудиофайл не найден в папке проекта');
    }

    throw error;
  }

  return {
    path: source,
    project,
    src: URL.createObjectURL(file),
    format: [extension],
  };
};
