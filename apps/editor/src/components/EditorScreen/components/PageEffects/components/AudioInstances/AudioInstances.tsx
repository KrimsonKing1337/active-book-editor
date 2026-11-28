import {
  useEffect,
  useLayoutEffect,
  useState,
} from 'react';

import { useAudioController } from '@active-book/core/hooks/effects';

import { Audio } from '@active-book/core/components/ProxyHooks';

import { DEFAULT_AUDIO_RELATIVE_VOLUME } from '@active-book/core/utils/effects/audio/audioVolume';

import type { BookProject } from '@project/@types';

import type { AudioEffectDraft } from '../../@types';

import { usePageEffects } from '../../context';

import { type ResolvedAudioSource, resolveAudioSource } from './utils';

type PreviewSource = {
  source: ResolvedAudioSource;
  requestedFormat?: readonly string[];
};

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
  const { setAudioPreviewStatus } = usePageEffects();
  const { audio } = useAudioController(effect.id);

  const [resolved, setResolved] = useState<PreviewSource | null>(null);

  const { id, options } = effect;

  const {
    src,
    type = 'sfx',
    loop = false,
    format,
    relativeVolume = DEFAULT_AUDIO_RELATIVE_VOLUME,
  } = options;

  useLayoutEffect(() => {
    let cancelled = false;
    let blobUrl: string | null = null;

    const trimmedSource = src.trim();

    setResolved(null);

    if (!trimmedSource) {
      setAudioPreviewStatus(id, { state: 'empty' });

      return;
    }

    setAudioPreviewStatus(id, { state: 'loading' });

    const prepare = async () => {
      try {
        const source = await resolveAudioSource({ src, format }, project);

        if (source.src.startsWith('blob:') && source.src !== trimmedSource) {
          blobUrl = source.src;
        }

        if (cancelled) {
          if (blobUrl) {
            URL.revokeObjectURL(blobUrl);
          }

          return;
        }

        setResolved({ source, requestedFormat: format });
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
  }, [
    id,
    src,
    project,
    format,
    setAudioPreviewStatus,
  ]);

  useLayoutEffect(() => {
    return () => {
      setAudioPreviewStatus(id, null);
    };
  }, [id, setAudioPreviewStatus]);

  let currentSource: ResolvedAudioSource | null = null;

  if (resolved) {
    const { source, requestedFormat } = resolved;

    const sourceTheSame = source.path === src;
    const projectTheSame = source.project === project;
    const formatTheSame = requestedFormat === format;

    const isCurrentSource = sourceTheSame && projectTheSame && formatTheSame;

    if (isCurrentSource) {
      currentSource = source;
    }
  }

  let registeredSource = audio?.src;

  if (Array.isArray(registeredSource)) {
    [registeredSource] = registeredSource;
  }

  let currentAudio = null;

  if (currentSource && registeredSource === currentSource.src) {
    currentAudio = audio;
  }

  useLayoutEffect(() => {
    if (!currentAudio) {
      return;
    }

    return currentAudio.observeLoad((outcome) => {
      if (outcome === 'ready') {
        setAudioPreviewStatus(id, { state: 'ready' });
      } else if (outcome === 'failed') {
        setAudioPreviewStatus(id, {
          state: 'error',
          error: 'Не удалось загрузить аудио в Howler',
        });
      }
    });
  }, [
    currentAudio,
    currentSource,
    id,
    setAudioPreviewStatus,
  ]);

  // These options can be changed without replacing a registered HowlWrapper.
  useEffect(() => {
    if (!currentAudio || !currentSource) {
      return;
    }

    currentAudio.howlInst.loop(loop);

    if (currentAudio.type !== type) {
      currentAudio.type = type;
      currentAudio.volume(currentAudio.getVolumeByType() / 100);
    }
  }, [
    currentAudio,
    currentSource,
    loop,
    type,
  ]);

  useEffect(() => {
    if (currentAudio && currentSource) {
      currentAudio.setRelativeVolume(relativeVolume);
    }
  }, [
    currentAudio,
    currentSource,
    relativeVolume,
  ]);

  if (!currentSource) {
    return null;
  }

  const audioInstanceKey = `${id}:${currentSource.src}`;

  // The page owns the preview. Starting it is always an explicit command.
  return (
    <Audio
      key={audioInstanceKey}
      id={id}
      page={page}
      src={currentSource.src}
      format={currentSource.format}
      type={type}
      loop={loop}
      relativeVolume={relativeVolume}
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
