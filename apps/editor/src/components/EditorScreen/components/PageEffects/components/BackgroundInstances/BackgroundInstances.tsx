import { type ComponentType, type CSSProperties, useEffect, useMemo, useState } from 'react';

import { Background } from 'activeBook-core/components/ProxyHooks';

import type { BackgroundEffect as CoreBackgroundEffect } from 'activeBook-core/hooks/effects/background/@types';
import type { BookComponentProps } from '@active-book/types';

import { createBookRuntime } from '@active-book/book-builder/customComponents/runtime';

import type { BookProject } from '@project/@types';

import { useCustomComponents } from '@project/customComponentRegistry';

import type { BackgroundEffectDraft } from '../../@types';
import {
  getBackgroundPreviewKey,
  useBackgroundBlurPreviews,
  usePageEffects,
} from '../../PageEffectsContext';

import type { BackgroundBlurPreviews } from '../../PageEffectsContext';

type BackgroundInstancesProps = {
  project: BookProject | null;
};

const bookRuntime = createBookRuntime('editor');

type ResolvedMedia = {
  images: string[];
  videos: string[];
};

const resolveSource = async (src: string, project: BookProject | null): Promise<string> => {
  const trimmed = src.trim();

  if (!trimmed || /^(https?:|blob:|data:)/i.test(trimmed)) {
    return trimmed;
  }

  if (!project) {
    throw new Error('Сохрани проект, чтобы использовать файлы из assets/');
  }

  const file = await project.storage.getAssetFile(trimmed);

  return URL.createObjectURL(file);
};

export type UseResolvedMediaResolvedState = {
  pathsKey: string;
  project: BookProject | null;
  media: ResolvedMedia;
};

const useResolvedMedia = (effect: BackgroundEffectDraft, project: BookProject | null): ResolvedMedia | null => {
  const imagePaths = effect.options.images?.map((image) => image.src) ?? [];
  const videoPaths = effect.options.videos?.map((video) => video.src) ?? [];

  const pathsKey = JSON.stringify([imagePaths, videoPaths]);

  const [resolved, setResolved] = useState<UseResolvedMediaResolvedState | null>(null);

  useEffect(() => {
    let cancelled = false;

    const objectUrls = new Set<string>();

    const load = async () => {
      const [imageSources, videoSources] = JSON.parse(pathsKey) as [string[], string[]];

      const resolvePaths = async (paths: string[]) => {
        const sources: string[] = [];

        for (const pathCur of paths) {
          const resolvedSrc = await resolveSource(pathCur, project);

          if (resolvedSrc.startsWith('blob:') && !pathCur.startsWith('blob:')) {
            objectUrls.add(resolvedSrc);
          }

          sources.push(resolvedSrc);
        }

        return sources;
      };

      try {
        const images = await resolvePaths(imageSources);
        const videos = await resolvePaths(videoSources);

        if (!cancelled) {
          const resolvedMedia = {
            images,
            videos,
          };

          setResolved({
            pathsKey,
            project,
            media: resolvedMedia,
          });
        }
      } catch (error) {
        if (!cancelled) {
          console.error('[background] Failed to load media assets', error);

          setResolved(null);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;

      for (const urlCur of objectUrls) {
        URL.revokeObjectURL(urlCur);
      }
    };
  }, [pathsKey, project]);

  if (resolved?.pathsKey !== pathsKey || resolved.project !== project) {
    return null;
  }

  return resolved.media;
};

const withPreviewBlur = (style: CSSProperties | undefined, blur: number | undefined): CSSProperties | undefined => {
  if (blur === undefined) {
    return style;
  }

  return {
    ...style,
    backdropFilter: blur ? `blur(${blur}px)` : undefined,
  };
};

type BackgroundInstanceProps = {
  effect: BackgroundEffectDraft;
  project: BookProject | null;
  components: Record<string, ComponentType>;
  blurPreviews: BackgroundBlurPreviews;
};

const BackgroundInstance = ({ effect, project, components, blurPreviews }: BackgroundInstanceProps) => {
  const media = useResolvedMedia(effect, project);

  const {
    component,
    images = [],
    videos = [],
    ...options
  } = effect.options;

  let componentId = null;

  if (component) {
    componentId = `${component.package}/${component.name}`;
  }

  let CustomComponent: ComponentType<BookComponentProps> | undefined;

  if (componentId) {
    CustomComponent = components[componentId] as ComponentType<BookComponentProps>;
  }

  const componentElement = useMemo(() => {
    return CustomComponent ? <CustomComponent book={bookRuntime} /> : null;
  }, [CustomComponent]);

  if (!media) {
    return null;
  }

  const previewBlur = (layer: 'background' | 'shadow' | 'image' | 'video', mediaId: string | null = null) => {
    const key = getBackgroundPreviewKey(effect.id, layer, mediaId);

    return blurPreviews[key];
  };

  const backgroundImages = images.map((imageCur, index) => {
    return {
      ...imageCur,
      src: media.images[index],
      style: withPreviewBlur(imageCur.style, previewBlur('image', imageCur.id)),
    };
  });

  const backgroundVideos = videos.map((videoCur, index) => {
    return {
      ...videoCur,
      src: media.videos[index],
      style: withPreviewBlur(videoCur.style, previewBlur('video', videoCur.id)),
    };
  });

  const shadow = options.shadow && {
    ...options.shadow,
    style: withPreviewBlur(options.shadow.style, previewBlur('shadow')),
  };

  const background: CoreBackgroundEffect = {
    id: effect.id,
    ...options,
    style: withPreviewBlur(options.style, previewBlur('background')),
    shadow,
    images: backgroundImages,
    videos: backgroundVideos,
    Component: componentElement,
  };

  return <Background {...background} />;
};

export const BackgroundInstances = ({ project }: BackgroundInstancesProps) => {
  const { effects } = usePageEffects();
  const blurPreviews = useBackgroundBlurPreviews();
  const { components } = useCustomComponents();

  const backgrounds = effects.filter((effectCur): effectCur is BackgroundEffectDraft => {
    return effectCur.type === 'background';
  });

  return (
    <>
      {backgrounds.map((effect) => {
        return (
          <BackgroundInstance
            key={effect.id}
            effect={effect}
            project={project}
            components={components}
            blurPreviews={blurPreviews}
          />
        );
      })}
    </>
  );
};
