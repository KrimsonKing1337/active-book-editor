import { useEffect, useRef, useState } from 'react';

import { Audio } from 'activeBook-core/components/ProxyHooks';

import { useAudioController } from 'activeBook-core/hooks/effects';

import { useDispatch } from 'activeBook-core/store';

import { mainActions } from 'activeBook-core/store/main';
import type { BookProject } from '@project/@types';

import type { AudioEffectDraft, AudioOptions } from '../../@types';

type PreviewAudio = {
  id: string;
  src: string;
  format?: string[];
  options: AudioOptions;
};

type ResolvedSource = {
  src: string;
  format?: string[];
};

type AudioPreviewProps = {
  effect: AudioEffectDraft;
  project: BookProject | null;
};

type ScheduledRelease = {
  id: string;
  timeout: number;
};

const resolveSource = async (source: string, project: BookProject | null): Promise<ResolvedSource> => {
  const path = source.trim();

  if (!path) {
    throw new Error('Укажите путь к аудиофайлу');
  }

  if (/^(https?:|blob:|data:)/.test(path)) {
    return {
      src: path,
    };
  }

  if (!project) {
    throw new Error('Сначала сохраните проект, чтобы загрузить файл из assets/');
  }

  const assetPath = path.replace(/^\.\//, '').replace(/^\//, '');

  if (!assetPath.startsWith('assets/') || assetPath.split('/').includes('..')) {
    throw new Error('Укажите файл из папки assets/, например assets/audio/rain.ogg');
  }

  for await (const file of project.storage.getBuildFiles()) {
    if (file.path === assetPath) {
      const extension = assetPath.split('.').pop()?.toLowerCase();

      if (!extension) {
        throw new Error('У аудиофайла должно быть расширение (например, .mp3 или .ogg)');
      }

      return {
        src: URL.createObjectURL(file.data),
        format: [extension],
      };
    }
  }

  throw new Error('Аудиофайл не найден в папке проекта');
};

export const AudioPreview = ({ effect, project }: AudioPreviewProps) => {
  const dispatch = useDispatch();

  const [preview, setPreview] = useState<PreviewAudio | null>(null);
  const [playRequested, setPlayRequested] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const scheduledReleaseRef = useRef<ScheduledRelease | null>(null);
  const { audio, play, stop, remove } = useAudioController(preview?.id ?? '');

  useEffect(() => {
    if (!playRequested || !audio) {
      return;
    }

    void play();

    setPlayRequested(false);
  }, [playRequested, audio, play]);

  useEffect(() => {
    // StrictMode повторно запускает effects: не выгружаем звук между cleanup и следующим setup.
    const scheduledRelease = scheduledReleaseRef.current;

    if (scheduledRelease?.id === preview?.id) {
      window.clearTimeout(scheduledRelease.timeout);
      scheduledReleaseRef.current = null;
    }

    if (!preview) {
      return;
    }

    return () => {
      const releasedPreview = preview;
      const releasedRemove = remove;

      const timeout = window.setTimeout(() => {
        releasedRemove();

        if (releasedPreview.src.startsWith('blob:')) {
          URL.revokeObjectURL(releasedPreview.src);
        }

        if (scheduledReleaseRef.current?.id === releasedPreview.id) {
          scheduledReleaseRef.current = null;
        }
      }, 0);

      scheduledReleaseRef.current = {
        id: releasedPreview.id,
        timeout,
      };
    };
  }, [preview, remove]);

  const handlePreview = async () => {
    if (preview) {
      setPlayRequested(false);

      void stop();
      remove();

      setPreview(null);

      return;
    }

    setLoading(true);
    setError('');

    try {
      const source = await resolveSource(effect.options.src, project);

      dispatch(mainActions.setIsAudioUnlocked(true));

      setPreview({
        id: `editor-preview-${crypto.randomUUID()}`,
        src: source.src,
        format: source.format,
        options: { ...effect.options },
      });

      setPlayRequested(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось загрузить аудио';

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
          format={preview.format}
          playOnLoad={false}
          lifecycle="manual"
        />
      )}
    </div>
  );
};
