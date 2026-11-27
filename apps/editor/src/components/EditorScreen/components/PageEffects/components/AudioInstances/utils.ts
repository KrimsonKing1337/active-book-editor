import type { BookProject } from '@project/@types';

export type ResolvedAudioSource = {
  path: string;
  project: BookProject | null;
  src: string;
  format?: string[];
};

type AudioSource = {
  src: string;
  format?: readonly string[];
};

export const resolveAudioSource = async (
  audioSource: AudioSource,
  project: BookProject | null): Promise<ResolvedAudioSource> => {
  const { src: source, format = [] } = audioSource;

  const path = source.trim();

  const sourceFormats = [...format];

  if (/^(https?:|blob:|data:)/i.test(path)) {
    return {
      path: source,
      project,
      src: path,
      format: sourceFormats,
    };
  }

  if (!project) {
    throw new Error('Сначала сохрани проект, чтобы загрузить файл из assets/');
  }

  const assetPath = source.replace(/^\.\//, '').replace(/^\//, '');

  if (!sourceFormats.length) {
    const fileName = assetPath.split('/').pop() ?? '';
    const extension = /\.([^.]+)$/.exec(fileName)?.[1];

    if (!extension) {
      throw new Error('У аудиофайла должно быть расширение или заданный формат');
    }

    sourceFormats.push(extension.toLowerCase());
  }

  let file: File;

  try {
    file = await project.storage.getAssetFile(assetPath);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'NotFoundError') {
      throw new Error('Аудиофайл не найден в папке проекта', { cause: error });
    }

    throw error;
  }

  const src = URL.createObjectURL(file);

  return {
    path: source,
    project,
    src,
    format: sourceFormats,
  };
};
