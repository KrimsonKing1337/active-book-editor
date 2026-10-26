import type { ComponentType } from 'react';

import type { BookComponentProps } from '@active-book/types';
import type { SideEffectDraft } from '../../@types';
import type { SideItemPreviews, SideStylePreviews } from '../../PageEffectsContext';

import { useMemo } from 'react';

import { Side } from 'activeBook-core/components/ProxyHooks';

import { createBookRuntime } from '@active-book/book-builder/components/custom/runtime';
import { resolveSideOptions } from '@active-book/book-builder/effects';

import { useCustomComponents } from '@project/customComponentRegistry';

import {
  getSidePreviewKey,
  getSideStylePreviewKey,
  usePageEffects,
} from '../../PageEffectsContext';

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
  const { component, shadow, text } = effect.options;

  const componentId = component ? `${component.package}/${component.name}` : '';
  const CustomComponent = components[componentId] as ComponentType<BookComponentProps> | undefined;

  const componentElement = useMemo(() => {
    return CustomComponent ? <CustomComponent book={bookRuntime} /> : null;
  }, [CustomComponent]);

  const shadowPreviewKey = shadow && getSidePreviewKey(effect.id, shadow.id);
  const textPreviewKey = text && getSidePreviewKey(effect.id, text.id);

  const shadowPreview = shadowPreviewKey && previews[shadowPreviewKey];
  const textPreview = textPreviewKey && previews[textPreviewKey];

  const shadowStyleKey = shadow && getSideStylePreviewKey(effect.id, 'shadow', shadow.id);
  const textStyleKey = text && getSideStylePreviewKey(effect.id, 'text', text.id);
  const componentStyleKey = getSideStylePreviewKey(effect.id, 'component', effect.id);

  const shadowStyle = shadowStyleKey && stylePreviews[shadowStyleKey];
  const textStyle = textStyleKey && stylePreviews[textStyleKey];
  const componentStyle = stylePreviews[componentStyleKey];

  const previewShadowStyle = shadowStyle ?? shadow?.style;
  const previewShadowHidden = shadowPreview?.hidden ?? shadow?.hidden;
  const shadowPlayState = shadowPreview?.playState ?? shadow?.animation?.playState;

  const shadowAnimation = {
    ...shadow?.animation,
    playState: shadowPlayState,
  };

  const previewShadow = shadow && {
    ...shadow,
    style: previewShadowStyle,
    hidden: previewShadowHidden,
    animation: shadowAnimation,
  };

  const previewTextStyle = textStyle ?? text?.style;
  const previewTextHidden = textPreview?.hidden ?? text?.hidden;
  const textPlayState = textPreview?.playState ?? text?.animation?.playState;

  const textAnimation = {
    ...text?.animation,
    playState: textPlayState,
  };

  const previewText = text && {
    ...text,
    style: previewTextStyle,
    hidden: previewTextHidden,
    animation: textAnimation,
  };

  const resolvedShadow = previewShadow ?? undefined;
  const resolvedText = previewText ?? undefined;
  const previewComponentStyle = componentStyle ?? effect.options.style;

  const options = resolveSideOptions({
    ...effect.options,
    shadow: resolvedShadow,
    text: resolvedText,
    style: previewComponentStyle,
  });

  return (
    <Side
      id={effect.id}
      kind={effect.kind}
      shadow={options.shadow}
      text={options.text}
      style={options.style}
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
