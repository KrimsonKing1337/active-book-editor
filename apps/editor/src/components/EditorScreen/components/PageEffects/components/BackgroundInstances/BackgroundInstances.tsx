import type { ComponentType, CSSProperties } from 'react';

import { useEffect, useMemo, useState } from 'react';

import type {
  BackgroundEffect as CoreBackgroundEffect,
} from 'activeBook-core/hooks/effects/background/@types';

import type { BookComponentProps } from '@active-book/types';

import { Background } from 'activeBook-core/components/ProxyHooks';

import { createBookRuntime } from '@active-book/book-builder/customComponents/runtime';
import { resolveStyle } from '@active-book/book-builder/effects';

import type { BookProject } from '@project/@types';

import { useCustomComponents } from '@project/customComponentRegistry';

import type { BackgroundEffectDraft } from '../../@types';

import {
  type BackgroundPreviewLayer,
  type BackgroundStylePreviews,

  getBackgroundPreviewKey,
  useBackgroundStylePreviews,
  usePageEffects,
} from '../../PageEffectsContext';

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
    throw new Error('Сохраните проект, чтобы использовать файлы из assets/');
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
  const imagePaths = effect.options.images?.map((cur) => cur.src) ?? [];
  const videoPaths = effect.options.videos?.map((cur) => cur.src) ?? [];

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

const withPreviewStyle = (style: CSSProperties | undefined, preview: CSSProperties | undefined) => {
  return preview ?? style;
};

type BackgroundInstanceProps = {
  effect: BackgroundEffectDraft;
  project: BookProject | null;
  components: Record<string, ComponentType>;
  stylePreviews: BackgroundStylePreviews;
};

const BackgroundInstance = ({ effect, project, components, stylePreviews }: BackgroundInstanceProps) => {
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
    if (!CustomComponent) {
      return null;
    }

    return <CustomComponent book={bookRuntime} />;
  }, [CustomComponent]);

  if (!media) {
    return null;
  }

  const previewStyle = (layer: BackgroundPreviewLayer, mediaId: string | null = null) => {
    const key = getBackgroundPreviewKey(effect.id, layer, mediaId);

    return stylePreviews[key];
  };

  const backgroundImages = images.map((imageCur, index) => {
    const style = resolveStyle(
      withPreviewStyle(imageCur.style, previewStyle('image', imageCur.id)),
      imageCur.styleFilters,
    );

    return {
      ...imageCur,
      src: media.images[index],
      style,
    };
  });

  const backgroundVideos = videos.map((videoCur, index) => {
    const style = resolveStyle(
      withPreviewStyle(videoCur.style, previewStyle('video', videoCur.id)),
      videoCur.styleFilters,
    );

    return {
      ...videoCur,
      src: media.videos[index],
      style,
    };
  });

  const shadowStyle = resolveStyle(
    withPreviewStyle(effect.options.shadow?.style, previewStyle('shadow')),
    effect.options.shadow?.styleFilters,
  );

  const shadow = options.shadow && {
    ...options.shadow,
    style: shadowStyle,
  };

  const backgroundStyle = resolveStyle(
    withPreviewStyle(effect.options.style, previewStyle('background')),
    effect.options.styleFilters,
  );

  const background: CoreBackgroundEffect = {
    id: effect.id,
    ...options,
    style: backgroundStyle,
    shadow,
    images: backgroundImages,
    videos: backgroundVideos,
    Component: componentElement,
  };

  return <Background {...background} />;
};

export const BackgroundInstances = ({ project }: BackgroundInstancesProps) => {
  const { effects } = usePageEffects();
  const { components } = useCustomComponents();
  const stylePreviews = useBackgroundStylePreviews();

  const backgrounds = effects.filter((effectCur): effectCur is BackgroundEffectDraft => {
    return effectCur.type === 'background';
  });

  return (
    <>
      {backgrounds.map((effectCur) => {
        return (
          <BackgroundInstance
            key={effectCur.id}
            effect={effectCur}
            project={project}
            components={components}
            stylePreviews={stylePreviews}
          />
        );
      })}
    </>
  );
};
