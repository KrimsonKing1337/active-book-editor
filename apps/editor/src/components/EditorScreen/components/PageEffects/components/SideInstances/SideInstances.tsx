import type { ComponentType } from 'react';

import { useMemo } from 'react';

import { Side } from 'activeBook-core/components/ProxyHooks';

import type { BookComponentProps } from '@active-book/types';

import { createBookRuntime } from '@active-book/book-builder/components/custom/runtime';

import { useCustomComponents } from '@project/customComponentRegistry';

import type { SideEffectDraft } from '../../@types';

import { getSidePreviewKey, usePageEffects } from '../../PageEffectsContext';

import type { SideItemPreviews } from '../../PageEffectsContext';

const bookRuntime = createBookRuntime('editor');

type SideInstanceProps = {
  effect: SideEffectDraft;
  components: Record<string, ComponentType>;
  previews: SideItemPreviews;
};

const SideInstance = ({ effect, components, previews }: SideInstanceProps) => {
  const { component, shadows, texts } = effect.options;

  const componentId = component ? `${component.package}/${component.name}` : null;
  const CustomComponent = componentId ? components[componentId] as ComponentType<BookComponentProps> : undefined;

  const componentElement = useMemo(() => {
    if (!CustomComponent) {
      return null;
    }

    return <CustomComponent book={bookRuntime} />;
  }, [CustomComponent]);

  const withPreview = <T extends NonNullable<typeof shadows>[number] | NonNullable<typeof texts>[number]>(item: T): T => {
    const key = getSidePreviewKey(effect.id, item.id);
    const preview = previews[key];

    if (!preview) {
      return item;
    }

    return {
      ...item,
      hidden: preview.hidden ?? item.hidden,
      animation: {
        ...item.animation,
        playState: preview.playState ?? item.animation?.playState,
      },
    };
  };

  const previewShadows = shadows?.map(withPreview);
  const previewTexts = texts?.map(withPreview);

  return (
    <Side
      id={effect.id}
      shadows={previewShadows}
      texts={previewTexts}
      Component={componentElement}
    />
  );
};

export const SideInstances = () => {
  const { effects, sideItemPreviews } = usePageEffects();
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
          />
        );
      })}
    </>
  );
};
