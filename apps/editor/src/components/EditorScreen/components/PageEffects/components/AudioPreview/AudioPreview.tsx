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
  id: string;
  source: ResolvedSource;
  delay: number;
  stopBy: number;
  relativeVolume: number;
  screamer: boolean;
  loopPreview: boolean;
  onReady: () => void;
  onError: (message: string) => void;
  onStartingChange: (starting: boolean) => void;
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

const AudioPreviewPlayer = ({
  id,
  source,
  delay,
  stopBy,
  relativeVolume,
  screamer,
  loopPreview,
  onReady,
  onError,
  onStartingChange,
}: PlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const { audio, play, stop, remove } = useAudioController(id);

  useEffect(() => {
    return () => {
      onStartingChange(false);
      remove();
    };
  }, [onStartingChange, remove]);

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
      onStartingChange(false);
      onError('Не удалось загрузить аудио в Howler');
    };

    const handlePlayError = () => {
      onStartingChange(false);
      onError('Не удалось запустить воспроизведение');
    };

    const handlePlay = () => {
      setIsPlaying(true);
      onStartingChange(false);
    };

    const handleStop = () => {
      setIsPlaying(false);
      onStartingChange(false);
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
    audio.howlInst.on('playerror', handlePlayError);
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
      audio.howlInst.off('playerror', handlePlayError);
      audio.howlInst.off('play', handlePlay);
      audio.howlInst.off('end', handleEnd);
      audio.howlInst.off('stop', handleStop);
      audio.howlInst.off('pause', handleStop);
    };
  }, [audio, onReady, onError, onStartingChange]);

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

    if (isPlaying) {
      void stop();
      return;
    }

    // Пока Howler не отправил play, интерфейс заблокирован лоадером.
    onStartingChange(true);
    void play();
  };

  const playButtonLabel = isPlaying ? 'Остановить' : 'Прослушать';

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
  const [isStarting, setIsStarting] = useState(false);

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
  const isPreparing = Boolean(trimmedSrc) && !error && (!currentSource || readyKey !== playerKey);
  const isLoading = isPreparing || isStarting;

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
          key={`${effect.id}:${playerKey}`}
          id={effect.id}
          source={currentSource}
          delay={delay}
          stopBy={stopBy}
          relativeVolume={relativeVolume}
          screamer={screamer}
          loopPreview={loopPreview}
          onReady={handleReady}
          onError={handleError}
          onStartingChange={setIsStarting}
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
