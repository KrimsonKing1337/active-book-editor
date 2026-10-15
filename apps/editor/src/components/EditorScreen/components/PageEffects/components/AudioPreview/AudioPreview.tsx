import { useCallback, useEffect, useState } from 'react';

import { Audio } from 'activeBook-core/components/ProxyHooks';
import { useAudioController } from 'activeBook-core/hooks/effects';

import { useDispatch } from 'activeBook-core/store';
import { mainActions } from 'activeBook-core/store/main';

import type { BookProject } from '@project/@types';

import type { AudioEffectDraft } from '../../@types';

import styles from './AudioPreview.module.scss';

type ResolvedSource = {
  path: string;
  project: BookProject | null;
  src: string;
  format?: string[];
};

type AudioPreviewProps = {
  effect: AudioEffectDraft;
  project: BookProject | null;
  onLoadingChange: (loading: boolean) => void;
};

type PlayerProps = {
  source: ResolvedSource;
  delay: number;
  stopBy: number;
  relativeVolume: number;
  screamer: boolean;
  loopPreview: boolean;
  onReady: () => void;
  onError: (message: string) => void;
};

const resolveSource = async (source: string, project: BookProject | null): Promise<ResolvedSource> => {
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

  if (!assetPath.startsWith('assets/') || assetPath.split('/').includes('..')) {
    throw new Error('Укажи путь внутри assets/, например assets/audio/rain.ogg');
  }

  for await (const file of project.storage.getBuildFiles()) {
    if (file.path === assetPath) {
      const extension = assetPath.split('.').pop()?.toLowerCase();

      if (!extension) {
        throw new Error('У аудиофайла должно быть расширение');
      }

      return {
        path: source,
        project,
        src: URL.createObjectURL(file.data),
        format: [extension],
      };
    }
  }

  throw new Error('Аудиофайл не найден в папке проекта');
};

const AudioPreviewPlayer = ({
  source,
  delay,
  stopBy,
  relativeVolume,
  screamer,
  loopPreview,
  onReady,
  onError,
}: PlayerProps) => {
  const [id] = useState(() => `editor-preview-${crypto.randomUUID()}`);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isRequested, setIsRequested] = useState(false);

  const { audio, play, stop, remove } = useAudioController(id);

  useEffect(() => {
    return () => {
      remove();
    };
  }, [remove]);

  useEffect(() => {
    if (!audio) {
      return;
    }

    const handleReady = () => {
      setIsReady(true);

      onReady();
    };

    const handleError = () => {
      setIsReady(false);

      onError('Не удалось загрузить аудио в Howler');
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handleStop = () => {
      setIsPlaying(false);
      setIsRequested(false);
    };

    const handleEnd = () => {
      // Howler отправляет end в конце КАЖДОГО повтора при loop=true
      const isLoop = audio.howlInst.loop();

      if (!isLoop) {
        handleStop();
      }
    };

    audio.howlInst.on('load', handleReady);
    audio.howlInst.on('loaderror', handleError);
    audio.howlInst.on('play', handlePlay);
    audio.howlInst.on('end', handleEnd);
    audio.howlInst.on('stop', handleStop);
    audio.howlInst.on('pause', handleStop);

    if (audio.state() === 'loaded') {
      handleReady();
    }

    return () => {
      audio.howlInst.off('load', handleReady);
      audio.howlInst.off('loaderror', handleError);
      audio.howlInst.off('play', handlePlay);
      audio.howlInst.off('end', handleEnd);
      audio.howlInst.off('stop', handleStop);
      audio.howlInst.off('pause', handleStop);
    };
  }, [audio, onReady, onError]);

  // Эти настройки можно оценить на слух без пересоздания Howler
  useEffect(() => {
    if (!audio) {
      return;
    }

    audio.howlInst.loop(loopPreview);
    audio.relativeVolume = relativeVolume;

    if (screamer) {
      audio.howlInst.volume(1);
    } else {
      audio.volume(audio.getVolumeByType() / 100);
    }
  }, [audio, loopPreview, relativeVolume, screamer]);

  const handlePlay = () => {
    if (!audio || !isReady) {
      return;
    }

    if (isPlaying || isRequested) {
      // Отменяем отложенный play(), если пользователь нажал «Остановить» до его запуска
      if (audio.timers.delay) {
        clearTimeout(audio.timers.delay);

        audio.timers.delay = null;
      }

      if (audio.timers.stopBy) {
        clearTimeout(audio.timers.stopBy);

        audio.timers.stopBy = null;
      }

      void stop();

      setIsRequested(false);

      return;
    }

    setIsRequested(true);

    void play();
  };

  const playButtonLabel = isPlaying || isRequested ? 'Остановить' : 'Прослушать';

  return (
    <div className={styles.Player}>
      <Audio
        id={id}
        page={0}
        src={source.src}
        format={source.format}
        type="sfx"
        delay={delay}
        stopBy={stopBy}
        relativeVolume={relativeVolume}
        loop={false}
        screamer={false}
        fadeOutWhenUnload={false}
        playOnLoad={false}
        lifecycle="manual"
      />

      <button
        className={styles.PlayButton}
        type="button"
        disabled={!isReady}
        onClick={handlePlay}
      >
        {playButtonLabel}
      </button>
    </div>
  );
};

export const AudioPreview = ({ effect, project, onLoadingChange }: AudioPreviewProps) => {
  const dispatch = useDispatch();

  const [resolved, setResolved] = useState<ResolvedSource | null>(null);
  const [readyKey, setReadyKey] = useState('');
  const [error, setError] = useState('');
  const [loopPreview, setLoopPreview] = useState(false);

  const { src, delay, stopBy, relativeVolume, screamer } = effect.options;

  useEffect(() => {
    let cancelled = false;
    let blobUrl: string | null = null;

    setResolved(null);
    setError('');

    if (!src.trim()) {
      return;
    }

    const prepare = async () => {
      try {
        const source = await resolveSource(src, project);

        if (source.src.startsWith('blob:')) {
          blobUrl = source.src;
        }

        if (cancelled) {
          if (blobUrl) {
            URL.revokeObjectURL(blobUrl);
          }

          return;
        }

        dispatch(mainActions.setIsAudioUnlocked(true));

        setResolved(source);
      } catch (reason) {
        if (!cancelled) {
          const errorText = reason instanceof Error ? reason.message : 'Не удалось прочитать аудиофайл';

          setError(errorText);
        }
      }
    };

    void prepare();

    return () => {
      cancelled = true;

      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [src, project, dispatch]);

  const trimmedSrc = src.trim();

  const currentSource = resolved?.path === src && resolved.project === project ? resolved : null;
  const playerKey = currentSource ? `${currentSource.src}:${delay}:${stopBy}` : '';
  const isLoading = Boolean(trimmedSrc) && !error && (!currentSource || readyKey !== playerKey);

  useEffect(() => {
    onLoadingChange(isLoading);
  }, [isLoading, onLoadingChange]);

  const handleReady = useCallback(() => {
    setReadyKey(playerKey);
  }, [playerKey]);

  const handleError = useCallback((message: string) => {
    setError(message);
  }, []);

  return (
    <div className={styles.Preview}>
      {error && (
        <small className={styles.Error} role="alert">
          {error}
        </small>
      )}

      {currentSource && (
        <AudioPreviewPlayer
          key={playerKey}
          source={currentSource}
          delay={delay}
          stopBy={stopBy}
          relativeVolume={relativeVolume}
          screamer={screamer}
          loopPreview={loopPreview}
          onReady={handleReady}
          onError={handleError}
        />
      )}

      <label className={styles.LoopCheckbox}>
        <input
          type="checkbox"
          checked={loopPreview}
          onChange={(event) => setLoopPreview(event.target.checked)}
        />
        Зациклить только предпрослушивание
      </label>

      {!trimmedSrc && (
        <small className={styles.Hint}>
          Укажите путь к файлу или выбери аудио с компьютера
        </small>
      )}
    </div>
  );
};
