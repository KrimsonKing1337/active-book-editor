import { useEffect, useState } from 'react';

import { useAudioController } from '@active-book/core/hooks/effects';

import type { AudioEffectDraft } from '../../@types';

import { usePageEffects } from '../../context';

import styles from './AudioPreview.module.scss';

type AudioPreviewProps = {
  effect: AudioEffectDraft;
  onLoadingChange: (loading: boolean) => void;
};

export const AudioPreview = ({ effect, onLoadingChange }: AudioPreviewProps) => {
  const { audioPreviewStatuses } = usePageEffects();
  const {
    audio,
    play,
    stop,
  } = useAudioController(effect.id);

  const [isPlaying, setIsPlaying] = useState(false);
  const [loopPreview, setLoopPreview] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [playError, setPlayError] = useState('');

  const source = effect.options.src.trim();
  const status = audioPreviewStatuses[effect.id];
  const isReady = Boolean(audio && status?.state === 'ready' && audio.state() === 'loaded');
  const isPreparing = Boolean(source) && (!status || status.state === 'loading');
  const isLoading = isPreparing || isStarting;

  useEffect(() => {
    if (!audio) {
      setIsPlaying(false);
      setIsStarting(false);

      return;
    }

    const handlePlay = () => {
      setIsPlaying(true);
      setIsStarting(false);
      setPlayError('');
    };

    const handlePauseOrStop = () => {
      setIsPlaying(false);
      setIsStarting(false);
    };

    const handleEnd = () => {
      if (!audio.howlInst.loop()) {
        handlePauseOrStop();
      }
    };

    const handlePlayError = () => {
      setIsStarting(false);
      setPlayError('Не удалось запустить воспроизведение');
    };

    audio.howlInst.on('play', handlePlay);
    audio.howlInst.on('pause', handlePauseOrStop);
    audio.howlInst.on('stop', handlePauseOrStop);
    audio.howlInst.on('end', handleEnd);
    audio.howlInst.on('playerror', handlePlayError);

    setIsPlaying(audio.playing());

    return () => {
      audio.howlInst.off('play', handlePlay);
      audio.howlInst.off('pause', handlePauseOrStop);
      audio.howlInst.off('stop', handlePauseOrStop);
      audio.howlInst.off('end', handleEnd);
      audio.howlInst.off('playerror', handlePlayError);
    };
  }, [audio]);

  // A preview-only override must not change playback already running on the page.
  useEffect(() => {
    if (!audio || !loopPreview) {
      return;
    }

    audio.howlInst.loop(true);

    return () => {
      if (!audio.isUnloading) {
        audio.howlInst.loop(effect.options.loop ?? false);
      }
    };
  }, [audio, loopPreview, effect.options.loop]);

  useEffect(() => {
    onLoadingChange(isLoading);
  }, [isLoading, onLoadingChange]);

  const handlePlay = () => {
    if (!audio || !isReady) {
      return;
    }

    if (isPlaying) {
      void stop();

      return;
    }

    setIsStarting(true);
    setPlayError('');

    void play();
  };

  const handleLoopChange = (checked: boolean) => {
    setLoopPreview(checked);
  };

  const playButtonLabel = isPlaying ? 'Остановить' : 'Прослушать';

  return (
    <div className={styles.Preview}>
      {status?.state === 'error' && (
        <small className={styles.Error} role="alert">
          {status.error}
        </small>
      )}

      {playError && (
        <small className={styles.Error} role="alert">
          {playError}
        </small>
      )}

      <div className={styles.Player}>
        <button
          className={styles.PlayButton}
          type="button"
          disabled={!isReady || isStarting}
          onClick={handlePlay}
        >
          {playButtonLabel}
        </button>
      </div>

      <label className={styles.LoopCheckbox}>
        <input
          type="checkbox"
          checked={loopPreview}
          onChange={(event) => handleLoopChange(event.target.checked)}
        />
        Зациклить только предпрослушивание
      </label>

      {!source && (
        <small className={styles.Hint}>
          Укажите путь к файлу или выбери аудио с компьютера
        </small>
      )}
    </div>
  );
};
