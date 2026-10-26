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

const SideInstance = ({ effect, components, previews, stylePreviews }: SideInstanceProps) => {
  const { component, shadow, text } = effect.options;

  const componentId = component ? `${component.package}/${component.name}` : '';
  const CustomComponent = components[componentId] as ComponentType<BookComponentProps> | undefined;

  const componentElement = useMemo(() => {
    return CustomComponent ? <CustomComponent book={bookRuntime} /> : null;
  }, [CustomComponent]);

  const shadowPreview = shadow && previews[getSidePreviewKey(effect.id, shadow.id)];
  const textPreview = text && previews[getSidePreviewKey(effect.id, text.id)];

  const shadowStyle = shadow && stylePreviews[getSideStylePreviewKey(effect.id, 'shadow', shadow.id)];
  const textStyle = text && stylePreviews[getSideStylePreviewKey(effect.id, 'text', text.id)];

  const previewShadow = shadow && {
    ...shadow,
    style: shadowStyle ?? shadow.style,
    hidden: shadowPreview?.hidden ?? shadow.hidden,
    animation: {
      ...shadow.animation,
      playState: shadowPreview?.playState ?? shadow.animation?.playState,
    },
  };

  const previewText = text && {
    ...text,
    style: textStyle ?? text.style,
    hidden: textPreview?.hidden ?? text.hidden,
    animation: {
      ...text.animation,
      playState: textPreview?.playState ?? text.animation?.playState,
    },
  };

  const options = resolveSideOptions({
    shadow: previewShadow || undefined,
    text: previewText || undefined,
  });

  return (
    <Side
      id={effect.id}
      kind={effect.kind}
      shadow={options.shadow}
      text={options.text}
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
