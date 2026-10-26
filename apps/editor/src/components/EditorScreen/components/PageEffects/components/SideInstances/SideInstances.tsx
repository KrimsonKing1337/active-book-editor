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

  const withPreview = <T extends NonNullable<typeof shadow | typeof text>>(item: T, kind: 'shadow' | 'text'): T => {
    const preview = previews[getSidePreviewKey(effect.id, item.id)];
    const style = stylePreviews[getSideStylePreviewKey(effect.id, kind, item.id)] ?? item.style;

    const animation = {
      ...item.animation,
      playState: preview?.playState ?? item.animation?.playState,
    };

    return {
      ...item,
      style,
      hidden: preview?.hidden ?? item.hidden,
      animation,
    };
  };

  const options = resolveSideOptions({
    shadow: shadow ? withPreview(shadow, 'shadow') : undefined,
    text: text ? withPreview(text, 'text') : undefined,
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
