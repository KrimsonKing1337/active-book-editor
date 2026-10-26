import { type ComponentType, type CSSProperties, useEffect, useMemo, useState } from 'react';

import type { BackgroundEffect as CoreBackgroundEffect } from 'activeBook-core/hooks/effects/background/@types';
import type { BookComponentProps } from '@active-book/types';

import { Background } from 'activeBook-core/components/ProxyHooks';

import { createBookRuntime } from '@active-book/book-builder/components/custom/runtime';
import { resolveStyle } from '@active-book/book-builder/effects';

import type { BookProject } from '@project/@types';

import { useCustomComponents } from '@project/customComponentRegistry';

import type { BackgroundEffectDraft } from '../../@types';

import type { BackgroundPreviewLayer, BackgroundStylePreviews } from '../../PageEffectsContext';

import { getBackgroundPreviewKey, useBackgroundStylePreviews, usePageEffects } from '../../PageEffectsContext';

type BackgroundInstancesProps = {
  project: BookProject | null;
};

const bookRuntime = createBookRuntime('editor');

type ResolvedSource = {
  src: string;
  project: BookProject | null;
  value: string;
};

const useResolvedSource = (src: string, project: BookProject | null): string | null => {
  const [resolved, setResolved] = useState<ResolvedSource | null>(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    const resolve = async () => {
      const trimmed = src.trim();
      const re = /^(https?:|blob:|data:)/i;

      if (!trimmed || re.test(trimmed)) {
        const resolvedSource = {
          src,
          project,
          value: trimmed,
        };

        setResolved(resolvedSource);

        return;
      }

      try {
        if (!project) {
          throw new Error('Сохраните проект, чтобы использовать файлы из assets/');
        }

        const file = await project.storage.getAssetFile(trimmed);

        objectUrl = URL.createObjectURL(file);

        if (!cancelled) {
          const resolvedSource = {
            src,
            project,
            value: objectUrl,
          };

          setResolved(resolvedSource);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('[background] Failed to load media asset', error);

          const resolvedSource = {
            src,
            project,
            value: '',
          };

          setResolved(resolvedSource);
        }
      }
    };

    void resolve();

    return () => {
      cancelled = true;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src, project]);

  if (resolved?.src !== src || resolved.project !== project) {
    return null;
  }

  return resolved.value;
};

type BackgroundInstanceProps = {
  effect: BackgroundEffectDraft;
  project: BookProject | null;
  components: Record<string, ComponentType>;
  stylePreviews: BackgroundStylePreviews;
};

const BackgroundInstance = ({
  effect,
  project,
  components,
  stylePreviews,
}: BackgroundInstanceProps) => {
  const options = effect.options;

  let source = '';

  if (effect.kind === 'image') {
    source = options.image?.src ?? '';
  } else if (effect.kind === 'video') {
    source = options.video?.src ?? '';
  }

  const resolvedSource = useResolvedSource(source, project);

  const component = options.component;
  const componentId = component ? `${component.package}/${component.name}` : '';
  const CustomComponent = components[componentId] as ComponentType<BookComponentProps> | undefined;

  const componentElement = useMemo(() => {
    return CustomComponent ? <CustomComponent book={bookRuntime} /> : null;
  }, [CustomComponent]);

  if (resolvedSource === null) {
    return null;
  }

  const previewStyle = (layer: BackgroundPreviewLayer, mediaId: string | null = null) => {
    const key = getBackgroundPreviewKey(effect.id, layer, mediaId);

    return stylePreviews[key];
  };

  const withPreviewStyle = (style: CSSProperties | undefined, preview: CSSProperties | undefined) => {
    return preview ?? style;
  };

  const style = resolveStyle(
    withPreviewStyle(options.style, previewStyle('background')),
    options.styleFilters,
  );

  const image = options.image && {
    ...options.image,
    src: resolvedSource,
    style: resolveStyle(
      withPreviewStyle(options.image.style, previewStyle('image', options.image.id)),
      options.image.styleFilters,
    ),
  };

  const video = options.video && {
    ...options.video,
    src: resolvedSource,
    style: resolveStyle(
      withPreviewStyle(options.video.style, previewStyle('video', options.video.id)),
      options.video.styleFilters,
    ),
  };

  const shadow = options.shadow && {
    ...options.shadow,
    style: resolveStyle(
      withPreviewStyle(options.shadow.style, previewStyle('shadow')),
      options.shadow.styleFilters,
    ),
  };

  const background: CoreBackgroundEffect = {
    id: effect.id,
    kind: effect.kind,
    style,
    image,
    video,
    shadow,
    Component: componentElement,
  };

  return (
    <Background {...background} />
  );
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
