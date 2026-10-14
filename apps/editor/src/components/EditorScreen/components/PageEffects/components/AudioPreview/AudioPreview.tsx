import { useEffect, useState } from 'react';

import { Audio } from 'activeBook-core/components/ProxyHooks';

import { useDispatch, useSelector } from 'activeBook-core/store';

import { mainActions } from 'activeBook-core/store/main';
import { audioEffectsSelectors } from 'activeBook-core/store/effects/audio/audio';

import type { BookProject } from '@project/@types';

import type { AudioEffectDraft, AudioOptions } from '../../@types';

type PreviewAudio = {
  id: string;
  src: string;
  options: AudioOptions;
};

type AudioPreviewProps = {
  effect: AudioEffectDraft;
  project: BookProject | null;
};

const resolveSource = async (source: string, project: BookProject | null): Promise<string> => {
  const path = source.trim();

  if (!path) {
    throw new Error('Укажите путь к аудиофайлу.');
  }

  if (/^(https?:|blob:|data:)/.test(path)) {
    return path;
  }

  if (!project) {
    throw new Error('Сначала сохраните проект, чтобы загрузить файл из assets/.');
  }

  const assetPath = path.replace(/^\.\//, '').replace(/^\//, '');

  if (!assetPath.startsWith('assets/') || assetPath.split('/').includes('..')) {
    throw new Error('Укажите файл из папки assets/, например assets/audio/rain.ogg.');
  }

  for await (const file of project.storage.getBuildFiles()) {
    if (file.path === assetPath) {
      return URL.createObjectURL(file.data);
    }
  }

  throw new Error('Аудиофайл не найден в папке проекта.');
};

export const AudioPreview = ({ effect, project }: AudioPreviewProps) => {
  const dispatch = useDispatch();

  const [preview, setPreview] = useState<PreviewAudio | null>(null);
  const [playRequested, setPlayRequested] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const audioInstances = useSelector(audioEffectsSelectors.audioInstances);
  const audioInstance = preview ? audioInstances[preview.id] : null;

  useEffect(() => {
    if (!playRequested || !audioInstance) {
      return;
    }

    void audioInstance.play();
    setPlayRequested(false);
  }, [playRequested, audioInstance]);

  useEffect(() => {
    return () => {
      if (preview?.src.startsWith('blob:')) {
        URL.revokeObjectURL(preview.src);
      }
    };
  }, [preview]);

  const handlePreview = async () => {
    if (preview) {
      setPlayRequested(false);
      void audioInstance?.stop();
      setPreview(null);

      return;
    }

    setLoading(true);
    setError('');

    try {
      const src = await resolveSource(effect.options.src, project);

      dispatch(mainActions.setIsAudioUnlocked(true));

      setPreview({
        id: `editor-preview-${crypto.randomUUID()}`,
        src,
        options: { ...effect.options },
      });
      setPlayRequested(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось загрузить аудио.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const buttonLabel = preview ? 'Остановить' : 'Прослушать';

  return (
    <div>
      <button type="button" disabled={loading} onClick={handlePreview}>
        {buttonLabel}
      </button>

      {error && (
        <small role="alert">
          {error}
        </small>
      )}

      {preview && (
        <Audio
          key={preview.id}
          id={preview.id}
          page={0}
          {...preview.options}
          src={preview.src}
          playOnLoad={false}
        />
      )}
    </div>
  );
};
