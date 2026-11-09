import { useEffect, useState } from 'react';

import { useDispatch } from '@active-book/core/store';
import { mainActions } from '@active-book/core/store/main';

import { useAudioController } from '@active-book/core/hooks/effects';

import { Audio } from '@active-book/core/components/ProxyHooks';

import type { BookProject } from '@project/@types';

import type { AudioEffectDraft } from '../../@types';

import { usePageEffects } from '../../context';

import { type ResolvedAudioSource, resolveAudioSource } from './utils';

type AudioInstanceProps = {
  effect: AudioEffectDraft;
  project: BookProject | null;
  page: number;
};

type AudioInstancesProps = {
  project: BookProject | null;
  page: number;
};

const AudioInstance = ({
  effect,
  project,
  page,
}: AudioInstanceProps) => {
  const dispatch = useDispatch();

  const { setAudioPreviewStatus } = usePageEffects();
  const { audio } = useAudioController(effect.id);

  const [resolved, setResolved] = useState<ResolvedAudioSource | null>(null);

  const { id, options } = effect;

  const {
    src,
    type = 'sfx',
    loop = false,
    relativeVolume = 100,
    screamer = false,
    delay = 0,
    stopBy = 0,
  } = options;

  useEffect(() => {
    let cancelled = false;
    let blobUrl: string | null = null;

    const trimmedSource = src.trim();

    const initialState = trimmedSource ? 'loading' : 'empty';

    setResolved(null);
    setAudioPreviewStatus(id, { state: initialState });

    if (!trimmedSource) {
      return;
    }

    const prepare = async () => {
      try {
        const source = await resolveAudioSource(src, project);

        if (source.src.startsWith('blob:') && source.src !== trimmedSource) {
          blobUrl = source.src;
        }

        if (cancelled) {
          if (blobUrl) {
            URL.revokeObjectURL(blobUrl);
          }

          return;
        }

        // useAudio creates its HowlWrapper once the core's audio gate is open.
        // Auto-play remains disabled in the editor.
        dispatch(mainActions.setIsAudioUnlocked(true));

        setResolved(source);
      } catch (error) {
        if (cancelled) {
          return;
        }

        const message = error instanceof Error ? error.message : 'Не удалось прочитать аудиофайл';

        setAudioPreviewStatus(id, {
          state: 'error',
          error: message,
        });
      }
    };

    void prepare();

    return () => {
      cancelled = true;

      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [id, src, project, dispatch, setAudioPreviewStatus]);

  useEffect(() => {
    return () => {
      setAudioPreviewStatus(id, null);
    };
  }, [id, setAudioPreviewStatus]);

  const isCurrentResolvedSource = resolved?.path === src && resolved.project === project;
  const currentSource = isCurrentResolvedSource ? resolved : null;

  const audioSrc = audio?.src;
  const registeredSource = Array.isArray(audioSrc) ? audioSrc[0] : audioSrc;

  const currentAudio = registeredSource === currentSource?.src ? audio : null;

  useEffect(() => {
    if (!currentAudio || !currentSource) {
      return;
    }

    const handleReady = () => {
      setAudioPreviewStatus(id, {
        state: 'ready',
      });
    };

    const handleError = () => {
      setAudioPreviewStatus(id, {
        state: 'error',
        error: 'Не удалось загрузить аудио в Howler',
      });
    };

    currentAudio.howlInst.on('load', handleReady);
    currentAudio.howlInst.on('loaderror', handleError);

    if (currentAudio.state() === 'loaded') {
      handleReady();
    }

    return () => {
      currentAudio.howlInst.off('load', handleReady);
      currentAudio.howlInst.off('loaderror', handleError);
    };
  }, [currentAudio, currentSource, id, setAudioPreviewStatus]);

  // These options can be changed without replacing a registered HowlWrapper.
  useEffect(() => {
    if (!currentAudio || !currentSource) {
      return;
    }

    currentAudio.howlInst.loop(loop);
    currentAudio.type = type;
    currentAudio.relativeVolume = relativeVolume;

    if (screamer) {
      currentAudio.howlInst.volume(1);
    } else {
      currentAudio.volume(currentAudio.getVolumeByType() / 100);
    }
  }, [currentAudio, currentSource, loop, type, relativeVolume, screamer]);

  if (!currentSource) {
    return null;
  }

  const audioInstanceKey = `${id}:${currentSource.src}:${delay}:${stopBy}`;

  // The editor owns the audio instance, not the settings modal.
  // In auto lifecycle core removes it from Redux and unloads it on unmount.
  return (
    <Audio
      key={audioInstanceKey}
      id={id}
      page={page}
      src={currentSource.src}
      format={currentSource.format}
      type={type}
      loop={loop}
      playOnLoad={false}
      relativeVolume={relativeVolume}
      screamer={screamer}
      delay={delay}
      stopBy={stopBy}
      fadeOutWhenUnload={false}
      lifecycle="auto"
    />
  );
};

export const AudioInstances = ({ project, page }: AudioInstancesProps) => {
  const { effects } = usePageEffects();

  const audioEffects = effects.filter((effectCur): effectCur is AudioEffectDraft => {
    return effectCur.type === 'audio';
  });

  return (
    <>
      {audioEffects.map((effectCur) => {
        return (
          <AudioInstance
            key={effectCur.id}
            effect={effectCur}
            project={project}
            page={page}
          />
        );
      })}
    </>
  );
};
