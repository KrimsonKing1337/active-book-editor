import { type ComponentType, useMemo } from 'react';

import type { BookComponentProps } from '@active-book/types';

import { Side } from 'activeBook-core/components/ProxyHooks';

import { createBookRuntime } from '@active-book/book-builder/components/custom/runtime';
import { resolveSideOptions } from '@active-book/book-builder/effects';

import { useCustomComponents } from '@project/customComponentRegistry';

import type { SideEffectDraft } from '../../@types';

import type { SideItemPreviews, SideStylePreviews } from '../../PageEffectsContext';

import { getSidePreviewKey, getSideStylePreviewKey, usePageEffects } from '../../PageEffectsContext';

const bookRuntime = createBookRuntime('editor');

type SideInstanceProps = {
  effect: SideEffectDraft;
  components: Record<string, ComponentType>;
  previews: SideItemPreviews;
  stylePreviews: SideStylePreviews;
};

const SideInstance = ({
  effect,
  components,
  previews,
  stylePreviews,
}: SideInstanceProps) => {
  const { component, shadows, texts } = effect.options;

  let componentId = null;

  if (component) {
    componentId = `${component.package}/${component.name}`;
  }

  let CustomComponent: ComponentType<BookComponentProps> | undefined = undefined;

  if (componentId) {
    CustomComponent = components[componentId] as ComponentType<BookComponentProps>;
  }

  const componentElement = useMemo(() => {
    if (!CustomComponent) {
      return null;
    }

    return <CustomComponent book={bookRuntime} />;
  }, [CustomComponent]);

  type ShadowItem = NonNullable<typeof shadows>[number];
  type TextItem = NonNullable<typeof texts>[number];

  type Item = ShadowItem | TextItem;

  const withPreview = <T extends Item>(item: T, kind: 'shadow' | 'text'): T => {
    const previewKey = getSidePreviewKey(effect.id, item.id);
    const styleKey = getSideStylePreviewKey(effect.id, kind, item.id);

    const preview = previews[previewKey];
    const style = stylePreviews[styleKey] ?? item.style;

    const playState = preview?.playState ?? item.animation?.playState;
    const hidden = preview?.hidden ?? item.hidden;

    const animation = {
      ...item.animation,
      playState,
    };

    return {
      ...item,
      style,
      hidden,
      animation,
    };
  };

  const previewShadows = shadows?.map((cur) => withPreview(cur, 'shadow'));
  const previewTexts = texts?.map((cur) => withPreview(cur, 'text'));

  const previewOptions = {
    shadows: previewShadows,
    texts: previewTexts,
  };

  const resolvedOptions = resolveSideOptions(previewOptions);

  return (
    <Side
      id={effect.id}
      shadows={resolvedOptions.shadows}
      texts={resolvedOptions.texts}
      Component={componentElement}
    />
  );
};

export const SideInstances = () => {
  const { effects, sideItemPreviews, sideStylePreviews } = usePageEffects();
  const { components } = useCustomComponents();

  const sideEffects = effects.filter((effectCur): effectCur is SideEffectDraft => {
    return effectCur.type === 'side';
  });

  return (
    <>
      {sideEffects.map((effectCur) => {
        return (
          <SideInstance
            key={effectCur.id}
            effect={effectCur}
            components={components}
            previews={sideItemPreviews}
            stylePreviews={sideStylePreviews}
          />
        );
      })}
    </>
  );
};
