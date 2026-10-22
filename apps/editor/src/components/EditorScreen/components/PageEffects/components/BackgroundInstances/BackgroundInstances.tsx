import { useEffect, useMemo, useState, type ComponentType } from 'react';

import { Background } from 'activeBook-core/components/ProxyHooks';

import type { BackgroundEffect as CoreBackgroundEffect } from 'activeBook-core/hooks/effects/background/@types';
import type { BookComponentProps } from '@active-book/types';

import type { BookProject } from '@project/@types';
import { useCustomComponents } from '@project/customComponentRegistry';
import { createBookRuntime } from '@active-book/book-builder/customComponents/runtime';

import type { BackgroundEffectDraft } from '../../@types';
import { usePageEffects } from '../../PageEffectsContext';

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

const useResolvedMedia = (effect: BackgroundEffectDraft, project: BookProject | null): ResolvedMedia | null => {
  const imagePaths = effect.options.images?.map((image) => image.src) ?? [];
  const videoPaths = effect.options.videos?.map((video) => video.src) ?? [];
  const pathsKey = JSON.stringify([imagePaths, videoPaths]);

  const [resolved, setResolved] = useState<{
    pathsKey: string;
    project: BookProject | null;
    media: ResolvedMedia;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const objectUrls = new Set<string>();

    const load = async () => {
      const [imageSources, videoSources] = JSON.parse(pathsKey) as [string[], string[]];

      const resolvePaths = async (paths: string[]) => {
        const sources: string[] = [];

        for (const path of paths) {
          const resolvedSrc = await resolveSource(path, project);

          if (resolvedSrc.startsWith('blob:') && !path.startsWith('blob:')) {
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
          setResolved({ pathsKey, project, media: { images, videos } });
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

      for (const url of objectUrls) {
        URL.revokeObjectURL(url);
      }
    };
  }, [pathsKey, project]);

  if (resolved?.pathsKey !== pathsKey || resolved.project !== project) {
    return null;
  }

  return resolved.media;
};

type BackgroundInstanceProps = {
  effect: BackgroundEffectDraft;
  project: BookProject | null;
  components: Record<string, ComponentType>;
};

const BackgroundInstance = ({ effect, project, components }: BackgroundInstanceProps) => {
  const media = useResolvedMedia(effect, project);

  const { component, images = [], videos = [], ...options } = effect.options;
  const componentId = component ? `${component.package}/${component.name}` : null;
  const CustomComponent = componentId ? components[componentId] as ComponentType<BookComponentProps> : undefined;

  const componentElement = useMemo(() => {
    return CustomComponent ? <CustomComponent book={bookRuntime} /> : null;
  }, [CustomComponent]);

  if (!media) {
    return null;
  }

  const background: CoreBackgroundEffect = {
    id: effect.id,
    ...options,
    images: images.map((image, index) => ({ ...image, src: media.images[index] })),
    videos: videos.map((video, index) => ({ ...video, src: media.videos[index] })),
    Component: componentElement,
  };

  return <Background {...background} />;
};

export const BackgroundInstances = ({ project }: BackgroundInstancesProps) => {
  const { effects } = usePageEffects();
  const { components } = useCustomComponents();

  const backgrounds = effects.filter((effect): effect is BackgroundEffectDraft => effect.type === 'background');

  return (
    <>
      {backgrounds.map((effect) => {
        return <BackgroundInstance key={effect.id} effect={effect} project={project} components={components} />;
      })}
    </>
  );
};
